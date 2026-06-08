import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Project from '../models/Project.js';
import Version from '../models/Version.js';
import demoMetadata from './demoMetadata.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const audioDir = path.join(__dirname, 'demo-audio');

const DEMO_USERS = [
  { name: 'Kai', email: 'kai@wavtrace.demo' },
  { name: 'Ana', email: 'ana@wavtrace.demo' },
];

const DEMO_FILES = ['audio-demo-V1.wav', 'audio-demo-V2.wav', 'audio-demo-V3.wav'];

// Create the demo reviewers once and reuse them on later signups
export async function ensureDemoUsers() {
  const users = [];
  for (const u of DEMO_USERS) {
    let user = await User.findOne({ email: u.email });
    if (!user) {
      const passwordHash = await bcrypt.hash('demo-reviewer', 10);
      user = await User.create({ ...u, passwordHash });
    }
    users.push(user);
  }
  return users;
}

// Give a new signup a populated project so they can see the app without uploading anythin
export async function seedDemoProject(ownerUserId) {
  const [kai, ana] = await ensureDemoUsers();

  const project = await Project.create({
    name: 'Demo Project',
    members: [
      { userId: ownerUserId, role: 'owner' },
      { userId: kai._id, role: 'reviewer' },
      { userId: ana._id, role: 'reviewer' },
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
  await Version.insertMany(versions);

  return project;
}
