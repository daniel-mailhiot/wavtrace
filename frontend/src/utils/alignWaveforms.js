// Lines up two peak envelopes so the diff overlay compares the right moments
// Finds sections that exist in only one version and keeps everything after a
// change aligned instead of stretching both files to the same width

// Segments come out in seconds:
//   { type: 'match',   aStart, aEnd, bStart, bEnd }   audio present in both
//   { type: 'added',   bStart, bEnd }                 only in the compare side
//   { type: 'removed', aStart, aEnd }                 only in the baseline side

const ALIGN_RATE = 10;     // frames per second the alignment runs at
const MAX_CELLS = 4e6;     // table size guard, long files align at a coarser rate
// Affine gap costs, opening is pricey but extending is cheap so an inserted
// section comes out as one contiguous block instead of scattered slivers
// (looped music makes many alignments equally plausible without this)
const GAP_OPEN = 1.5;
const GAP_EXTEND = 0.12;   // has to stay above half the typical cost of matching
                           // changed-but-same audio or layer changes turn into gaps
const COST_WIN = 1;        // frames of context around each point when comparing
const LEVEL_W = 0.6;       // weight of the loudness-difference term, spectra alone are
                           // loudness-blind and happily match a quiet tail to loud bars
const MIN_SECTION = 0.6;   // added/removed blips shorter than this fold into the match around them
const NOVELTY_W = 0.3;     // how strongly section boundaries prefer onset spikes
const CORRIDOR = 3;        // seconds a section may slide during refinement

// Auto-detect added/removed sections from the two decoded clips
export function alignEnvelopes(a, b) {
  // coarser rate for long files so the table stays around MAX_CELLS
  let rate = Math.min(ALIGN_RATE, a.featureRate);
  if (a.duration * b.duration * rate * rate > MAX_CELLS) {
    rate = Math.max(2, Math.floor(Math.sqrt(MAX_CELLS / (a.duration * b.duration))));
  }

  const sa = featuresAtRate(a, rate);
  const sb = featuresAtRate(b, rate);
  const ops = traceAlignment(sa, sb);
  const segs = foldTinySections(opsToSegments(ops, rate, a.duration, b.duration));
  return refineSections(segs, a, b);
}

// Build segments straight from uploader marks instead of guessing
// added marks live on the compare timeline, removed marks on the baseline one
export function segmentsFromEdits(edits, durA, durB) {
  const added = cleanEdits(edits.filter((e) => e.type === 'added'), durB);
  const removed = cleanEdits(edits.filter((e) => e.type === 'removed'), durA);

  const segs = [];
  let aPos = 0;
  let bPos = 0;
  let ai = 0;
  let ri = 0;

  while (ai < added.length || ri < removed.length) {
    const dAdd = ai < added.length ? added[ai].start - bPos : Infinity;
    const dRem = ri < removed.length ? removed[ri].start - aPos : Infinity;

    // both sides move together until the nearest mark
    const d = Math.max(0, Math.min(dAdd, dRem));
    if (d > 0.01) {
      segs.push({ type: 'match', aStart: aPos, aEnd: aPos + d, bStart: bPos, bEnd: bPos + d });
      aPos += d;
      bPos += d;
    }

    if (dAdd <= dRem) {
      const end = Math.max(added[ai].end, bPos);
      if (end - bPos > 0.01) segs.push({ type: 'added', bStart: bPos, bEnd: end });
      bPos = end;
      ai++;
    } else {
      const end = Math.max(removed[ri].end, aPos);
      if (end - aPos > 0.01) segs.push({ type: 'removed', aStart: aPos, aEnd: end });
      aPos = end;
      ri++;
    }
  }

  // leftover after the last mark, any length mismatch spills into a trailing section
  const tail = Math.min(durA - aPos, durB - bPos);
  if (tail > 0.01) {
    segs.push({ type: 'match', aStart: aPos, aEnd: aPos + tail, bStart: bPos, bEnd: bPos + tail });
    aPos += tail;
    bPos += tail;
  }
  if (durB - bPos > 0.01) segs.push({ type: 'added', bStart: bPos, bEnd: durB });
  if (durA - aPos > 0.01) segs.push({ type: 'removed', aStart: aPos, aEnd: durA });

  return segs;
}

// Marks on a version describe it against the previous one, flipping the types
// lets a reversed compare (newer on the left) reuse the same marks
export function invertEdits(edits) {
  return edits.map((e) => ({ ...e, type: e.type === 'added' ? 'removed' : 'added' }));
}

// Spectral frames at the alignment rate, grouped by time and re-normalized
// Vectors stay unit length (or zero for silence) so cost is just 1 - dot
function featuresAtRate(env, rate) {
  const bands = env.bandCount;
  const src = env.features;
  const srcFrames = src.length / bands;

  let data;
  let levels;
  let frames;
  if (rate === env.featureRate) {
    data = src;
    levels = env.levels;
    frames = srcFrames;
  } else {
    frames = Math.max(1, Math.round(env.duration * rate));
    data = new Float32Array(frames * bands);
    levels = new Float32Array(frames);
    const step = srcFrames / frames;
    for (let f = 0; f < frames; f++) {
      const from = Math.floor(f * step);
      const to = Math.max(Math.floor((f + 1) * step), from + 1);
      let norm = 0;
      let lvl = 0;
      for (let b = 0; b < bands; b++) {
        let sum = 0;
        for (let s = from; s < to && s < srcFrames; s++) sum += src[s * bands + b];
        data[f * bands + b] = sum;
        norm += sum * sum;
      }
      for (let s = from; s < to && s < srcFrames; s++) {
        if (env.levels[s] > lvl) lvl = env.levels[s];
      }
      levels[f] = lvl;
      norm = Math.sqrt(norm);
      if (norm > 1e-6) {
        for (let b = 0; b < bands; b++) data[f * bands + b] /= norm;
      }
    }
  }

  // silence flags so quiet stretches compare as equal instead of unrelated
  const quiet = new Uint8Array(frames);
  for (let f = 0; f < frames; f++) {
    let norm = 0;
    for (let b = 0; b < bands; b++) norm += data[f * bands + b] * data[f * bands + b];
    quiet[f] = norm < 0.5 ? 1 : 0;
  }
  return { data, levels, frames, bands, quiet };
}

// Cosine distance plus a loudness-difference term, silence matches silence
function pairCost(sa, sb, i, j) {
  if (sa.quiet[i] || sb.quiet[j]) return sa.quiet[i] === sb.quiet[j] ? 0 : 1;
  let dot = 0;
  const av = i * sa.bands;
  const bv = j * sb.bands;
  for (let b = 0; b < sa.bands; b++) dot += sa.data[av + b] * sb.data[bv + b];
  return 1 - Math.min(dot, 1) + LEVEL_W * Math.abs(sa.levels[i] - sb.levels[j]);
}

// Averaged over a small window, single frames are too noisy to compare
function frameCost(sa, sb, i, j) {
  let sum = 0;
  let count = 0;
  for (let k = -COST_WIN; k <= COST_WIN; k++) {
    const ai = i + k;
    const bj = j + k;
    if (ai < 0 || bj < 0 || ai >= sa.frames || bj >= sb.frames) continue;
    sum += pairCost(sa, sb, ai, bj);
    count++;
  }
  return count ? sum / count : 0;
}

// Needleman-Wunsch with affine gaps (Gotoh), three states per cell
// M = frames matched, X = skipping a frames (removed), Y = skipping b frames (added)
// Score rows roll to save memory, only the predecessor tables stay whole
// Returns ops walked start to end, 1 = match, 2 = a only, 3 = b only
function traceAlignment(sa, sb) {
  const n = sa.frames;
  const m = sb.frames;
  const w = m + 1;
  const INF = 1e9;

  let mPrev = new Float32Array(w);
  let xPrev = new Float32Array(w);
  let yPrev = new Float32Array(w);
  let mCur = new Float32Array(w);
  let xCur = new Float32Array(w);
  let yCur = new Float32Array(w);

  // predecessor state per cell, 0 = M, 1 = X, 2 = Y
  const fromM = new Uint8Array((n + 1) * w);
  const fromX = new Uint8Array((n + 1) * w);
  const fromY = new Uint8Array((n + 1) * w);

  mPrev[0] = 0;
  xPrev[0] = INF;
  yPrev[0] = INF;
  for (let j = 1; j <= m; j++) {
    mPrev[j] = INF;
    xPrev[j] = INF;
    yPrev[j] = GAP_OPEN + (j - 1) * GAP_EXTEND;
    fromY[j] = j === 1 ? 0 : 2;
  }

  for (let i = 1; i <= n; i++) {
    const row = i * w;
    mCur[0] = INF;
    yCur[0] = INF;
    xCur[0] = GAP_OPEN + (i - 1) * GAP_EXTEND;
    fromX[row] = i === 1 ? 0 : 1;

    for (let j = 1; j <= m; j++) {
      // match extends whichever state was best diagonally
      const c = frameCost(sa, sb, i - 1, j - 1);
      const dm = mPrev[j - 1];
      const dx = xPrev[j - 1];
      const dy = yPrev[j - 1];
      // ties prefer match so identical stretches stay glued together
      if (dm <= dx && dm <= dy) {
        mCur[j] = dm + c;
        fromM[row + j] = 0;
      } else if (dx <= dy) {
        mCur[j] = dx + c;
        fromM[row + j] = 1;
      } else {
        mCur[j] = dy + c;
        fromM[row + j] = 2;
      }

      // skip a frame of a, opening from M or Y pays full price, extending X is cheap
      const xOpen = mPrev[j] + GAP_OPEN;
      const xExt = xPrev[j] + GAP_EXTEND;
      const xCross = yPrev[j] + GAP_OPEN;
      if (xExt <= xOpen && xExt <= xCross) {
        xCur[j] = xExt;
        fromX[row + j] = 1;
      } else if (xOpen <= xCross) {
        xCur[j] = xOpen;
        fromX[row + j] = 0;
      } else {
        xCur[j] = xCross;
        fromX[row + j] = 2;
      }

      // skip a frame of b
      const yOpen = mCur[j - 1] + GAP_OPEN;
      const yExt = yCur[j - 1] + GAP_EXTEND;
      const yCross = xCur[j - 1] + GAP_OPEN;
      if (yExt <= yOpen && yExt <= yCross) {
        yCur[j] = yExt;
        fromY[row + j] = 2;
      } else if (yOpen <= yCross) {
        yCur[j] = yOpen;
        fromY[row + j] = 0;
      } else {
        yCur[j] = yCross;
        fromY[row + j] = 1;
      }
    }

    [mPrev, mCur] = [mCur, mPrev];
    [xPrev, xCur] = [xCur, xPrev];
    [yPrev, yCur] = [yCur, yPrev];
  }

  // best final state then walk the predecessors back
  let state = 0;
  if (xPrev[m] < mPrev[m] && xPrev[m] <= yPrev[m]) state = 1;
  else if (yPrev[m] < mPrev[m]) state = 2;

  const ops = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    const cell = i * w + j;
    if (state === 0) {
      ops.push(1);
      state = fromM[cell];
      i--;
      j--;
    } else if (state === 1) {
      ops.push(2);
      state = fromX[cell];
      i--;
    } else {
      ops.push(3);
      state = fromY[cell];
      j--;
    }
  }
  return ops.reverse();
}

// Collapse the op stream into second-based segments
function opsToSegments(ops, rate, durA, durB) {
  const segs = [];
  let aPos = 0;
  let bPos = 0;
  let run = 0;
  let runLen = 0;

  const flush = () => {
    if (!runLen) return;
    const len = runLen / rate;
    if (run === 1) {
      segs.push({
        type: 'match',
        aStart: aPos, aEnd: Math.min(aPos + len, durA),
        bStart: bPos, bEnd: Math.min(bPos + len, durB),
      });
      aPos += len;
      bPos += len;
    } else if (run === 2) {
      segs.push({ type: 'removed', aStart: aPos, aEnd: Math.min(aPos + len, durA) });
      aPos += len;
    } else {
      segs.push({ type: 'added', bStart: bPos, bEnd: Math.min(bPos + len, durB) });
      bPos += len;
    }
    runLen = 0;
  };

  for (const op of ops) {
    if (op !== run) {
      flush();
      run = op;
    }
    runLen++;
  }
  flush();
  return segs;
}

// Sub-MIN_SECTION added/removed runs are alignment jitter, not real edits,
// so they get absorbed into a neighbouring match instead of drawn as sections
function foldTinySections(segs) {
  const out = [];
  let carry = null; // tiny section waiting for the next match when nothing came before

  for (const seg of segs) {
    const dur = seg.type === 'added' ? seg.bEnd - seg.bStart : seg.type === 'removed' ? seg.aEnd - seg.aStart : 0;
    const last = out[out.length - 1];

    if (seg.type !== 'match' && dur < MIN_SECTION) {
      if (last?.type === 'match') {
        if (seg.type === 'added') last.bEnd = seg.bEnd;
        else last.aEnd = seg.aEnd;
      } else {
        carry = { ...(carry ?? {}), ...seg };
      }
      continue;
    }

    if (seg.type === 'match' && carry) {
      const merged = { ...seg };
      if (carry.bStart !== undefined) merged.bStart = Math.min(merged.bStart, carry.bStart);
      if (carry.aStart !== undefined) merged.aStart = Math.min(merged.aStart, carry.aStart);
      carry = null;
      out.push(merged);
      continue;
    }

    // adjacent same-type segments merge after folding
    if (last && last.type === seg.type && seg.type !== 'match') {
      if (seg.type === 'added') last.bEnd = seg.bEnd;
      else last.aEnd = seg.aEnd;
      continue;
    }
    if (last && last.type === 'match' && seg.type === 'match') {
      last.aEnd = seg.aEnd;
      last.bEnd = seg.bEnd;
      continue;
    }

    out.push({ ...seg });
  }
  if (carry) out.push(carry);
  return out;
}

// The DP only finds *a* cheapest path. Looped music makes many paths nearly
// tie, so a section can slide inside a self-similar stretch and still look
// optimal. This pass re-anchors each section by sliding it within a corridor
// and preferring spots where the matched frames agree and the gap side has an
// onset spike, a real edit boundary lands on a transient while a slid one
// lands mid-note
function refineSections(segs, envA, envB) {
  if (!envA.novelty || !envB.novelty) return segs;
  const rate = envA.featureRate;
  const fa = featuresAtRate(envA, rate);
  const fb = featuresAtRate(envB, rate);

  for (let i = 0; i < segs.length; i++) {
    const sec = segs[i];
    if (sec.type === 'match') continue;
    const m1 = segs[i - 1];
    const m2 = segs[i + 1];
    // only sections between two matches can slide, edge sections have no corridor
    if (m1?.type !== 'match' || m2?.type !== 'match') continue;

    // "other" = the file without the extra material, "gap" = the one with it
    const added = sec.type === 'added';
    const other = added ? fa : fb;
    const gap = added ? fb : fa;
    const nov = added ? envB.novelty : envA.novelty;

    // frame domain on the other timeline, matches map other[i] -> gap[i + off]
    const A0 = Math.round((added ? m1.aEnd : m1.bEnd) * rate);
    const g0 = Math.round((added ? sec.bStart : sec.aStart) * rate);
    const g1 = Math.round((added ? sec.bEnd : sec.aEnd) * rate);
    const off1 = g0 - A0;
    const off2 = off1 + (g1 - g0);

    const maxShift = Math.round(CORRIDOR * rate);
    const lo = -Math.min(maxShift, Math.round((m1.aEnd - m1.aStart) * rate));
    const hi = Math.min(maxShift, Math.round((m2.aEnd - m2.aStart) * rate));

    // onset bonus at the two splice points the shifted section would create
    const noveltyAt = (s) => -NOVELTY_W * ((nov[g0 + s] ?? 0) + (nov[g1 + s] ?? 0));

    // walk outward accumulating the match-cost change of each extra frame moved
    let best = 0;
    let bestScore = noveltyAt(0);
    let acc = 0;
    for (let s = 1; s <= hi; s++) {
      const f = A0 + s - 1;
      acc += pairAt(other, gap, f, f + off1) - pairAt(other, gap, f, f + off2);
      const score = acc + noveltyAt(s);
      if (score < bestScore) {
        bestScore = score;
        best = s;
      }
    }
    acc = 0;
    for (let s = -1; s >= lo; s--) {
      const f = A0 + s;
      acc += pairAt(other, gap, f, f + off2) - pairAt(other, gap, f, f + off1);
      const score = acc + noveltyAt(s);
      if (score < bestScore) {
        bestScore = score;
        best = s;
      }
    }
    if (!best) continue;

    // slide the section, the match before grows/shrinks and the one after does the opposite
    const d = best / rate;
    m1.aEnd += d;
    m1.bEnd += d;
    m2.aStart += d;
    m2.bStart += d;
    if (added) {
      sec.bStart += d;
      sec.bEnd += d;
    } else {
      sec.aStart += d;
      sec.aEnd += d;
    }
  }

  // a full-corridor slide can shrink a neighbouring match to nothing
  return segs.filter((s) => s.type !== 'match' || s.aEnd - s.aStart > 0.01);
}

// Single-frame cost with a bounds guard, refinement wants sharp edges so no window
function pairAt(sa, sb, i, j) {
  if (i < 0 || j < 0 || i >= sa.frames || j >= sb.frames) return 1;
  return pairCost(sa, sb, i, j);
}

// Clamp to the clip, drop nonsense, merge overlaps
function cleanEdits(edits, dur) {
  const valid = edits
    .map((e) => ({ start: Math.max(0, e.start), end: Math.min(e.end, dur) }))
    .filter((e) => e.end - e.start > 0.01)
    .sort((x, y) => x.start - y.start);

  const merged = [];
  for (const e of valid) {
    const last = merged[merged.length - 1];
    if (last && e.start <= last.end) last.end = Math.max(last.end, e.end);
    else merged.push(e);
  }
  return merged;
}
