import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Project from '../models/Project.js';
import Version from '../models/Version.js';
import Comment from '../models/Comment.js';
import demoMetadata from './demoMetadata.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const audioDir = path.join(__dirname, 'demo-audio');

const DEMO_USERS = [
  { name: 'Amy E', email: 'amy@wavtrace.com' },
  { name: 'Flinns K', email: 'flinns@wavtrace.com' },
];

const DEMO_FILES = ['audio-demo-V1.wav', 'audio-demo-V2.wav', 'audio-demo-V3.wav'];

const DEMO_COMMENTS = [
  [
    { by: 'amy', t: 0.5, text: 'Solid first pass. Melody is catchy, the mix just needs some polish.' },
  ],
  [
    { by: 'flinns', t: 0.31, text: 'The intro swell builds nicely now, much better pacing.' },
    { by: 'amy', region: [0.6, 0.7], text: 'Drums get a bit buried through this stretch. Bring them up?' },
  ],
  [
    { by: 'amy', t: 0.18, text: 'Low end is muddy here. Try a high-pass on the pad?' },
    { by: 'flinns', region: [0.42, 0.5], text: 'This part repeats a little too long. Trimming a few bars could keep momentum.' },
    { by: 'amy', t: 0.72, text: 'Vocal sits a touch too far back in the mix now.' },
    { by: 'amy', t: 0.93, text: "Everything else sounds great! I'll lock final version after changes." },
  ],
];

// Create the demo reviewers once and reuse them on later signups
export async function ensureDemoUsers() {
  const users = [];
  for (const u of DEMO_USERS) {
    let user = await User.findOne({ email: u.email });
    if (!user) {
      // Password from env lets me log in as a reviewer on the deployed app
      // Uses random throwaway password when cloning the repo instead of hardcoding the password
      const password = process.env.DEMO_REVIEWER_PASSWORD || crypto.randomBytes(32).toString('hex');
      const passwordHash = await bcrypt.hash(password, 10);
      user = await User.create({ ...u, passwordHash });
    }
    users.push(user);
  }
  return users;
}

// Give a new signup a populated project so they can see the app without uploading anythin
export async function seedDemoProject(ownerUserId) {
  const [amy, flinns] = await ensureDemoUsers();

  const project = await Project.create({
    name: 'Demo Project',
    members: [
      { userId: ownerUserId, role: 'owner' },
      { userId: amy._id, role: 'reviewer' },
      { userId: flinns._id, role: 'reviewer' },
    ],
  });

  // Versions point at the static demo files
  const versions = DEMO_FILES.map((file, i) => ({
    projectId: project._id,
    uploaderId: ownerUserId,
    versionNumber: i + 1,
    fileKey: `demo/${file}`,
    originalName: file,
    size: fs.statSync(path.join(audioDir, file)).size,
    mimeType: 'audio/wav',
    analysisStatus: 'ready',
    analysis: demoMetadata[file],
  }));
  // insertMany keeps order, so created[i] lines up with DEMO_COMMENTS[i]
  const created = await Version.insertMany(versions);

  // Convert each comment's fractions to seconds using its version's duration
  const authors = { amy, flinns };
  const comments = [];
  created.forEach((version, i) => {
    const dur = version.analysis.durationSec;
    for (const c of DEMO_COMMENTS[i]) {
      const isRegion = Boolean(c.region);
      comments.push({
        versionId: version._id,
        authorId: authors[c.by]._id,
        body: c.text,
        startTime: (isRegion ? c.region[0] : c.t) * dur,
        endTime: isRegion ? c.region[1] * dur : null,
      });
    }
  });
  await Comment.insertMany(comments);

  return project;
}
