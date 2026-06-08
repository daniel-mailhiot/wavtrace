import { spawn } from 'node:child_process';
import ffmpegStatic from 'ffmpeg-ffprobe-static';

// Bundled binaries so no system ffmpeg install is needed
const { ffmpegPath, ffprobePath } = ffmpegStatic;

// Collect a binary's output and resolve on close so stdout and stderr finish flushing
function run(bin, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(bin, args);
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (chunk) => { stdout += chunk; });
    proc.stderr.on('data', (chunk) => { stderr += chunk; });
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`${bin} exited with code ${code}`));
    });
  });
}

// File specs from ffprobe as json on stdout
async function probeFile(filePath) {
  const args = ['-v', 'quiet', '-print_format', 'json', '-show_format', '-show_streams', filePath];
  const { stdout } = await run(ffprobePath, args);
  const info = JSON.parse(stdout);

  const audio = info.streams.find((s) => s.codec_type === 'audio');
  if (!audio) throw new Error('No audio stream found');
  const { format } = info;

  return {
    durationSec: Number(format.duration),
    sampleRate: Number(audio.sample_rate),
    channels: audio.channels,
    // Lossy formats like mp3 report no real bit depth so this can be null
    bitDepth: Number(audio.bits_per_raw_sample) || Number(audio.bits_per_sample) || null,
    bitrate: Number(format.bit_rate),
    format: format.format_name,
  };
}

// Loudness from the ffmpeg loudnorm measurement pass printed as json on stderr
async function measureLoudness(filePath) {
  const args = ['-i', filePath, '-af', 'loudnorm=print_format=json', '-f', 'null', '-'];
  const { stderr } = await run(ffmpegPath, args);

  // Loudnorm appends its json block at the end of stderr
  const block = stderr.match(/\{[\s\S]*\}/);
  if (!block) throw new Error('No loudnorm output found');
  const loud = JSON.parse(block[0]);

  return {
    loudness: Number(loud.input_i),
    truePeak: Number(loud.input_tp),
    lra: Number(loud.input_lra),
    // True peak at or above 0 dBTP means the signal is clipping
    clipping: Number(loud.input_tp) >= 0,
  };
}

// File specs and loudness merged into one result from two separate passes
export async function analyzeAudio(filePath) {
  const specs = await probeFile(filePath);
  const loudness = await measureLoudness(filePath);
  return { ...specs, ...loudness };
}
