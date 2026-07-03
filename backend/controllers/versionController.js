import { readFile, unlink } from 'node:fs/promises';
import Version from '../models/Version.js';
import { analyzeAudio } from '../lib/audioAnalysis.js';
import { r2Configured, getDownloadUrl, canStoreFiles, uploadObject, deleteObject } from '../lib/r2.js';

// Demo files come from the static folder (idea was so register doesn't fill R2 storage - might revisit later)
// Real uploads get a signed R2 url and a null fileKey means the file was analyzed but never stored
async function urlFor(fileKey) {
  if (!fileKey) return null;
  if (fileKey.startsWith('demo/')) {
    return `/demo-audio/${fileKey.slice('demo/'.length)}`;
  }
  return r2Configured ? getDownloadUrl(fileKey) : null;
}

// GET /api/projects/:id/versions
export const listVersions = async (req, res) => {
  try {
    // req.project is already scoped to this member by requireProjectRole
    const versions = await Version.find({ projectId: req.project._id })
      .populate('uploaderId', 'name')
      .sort({ versionNumber: -1 });

    // urlFor is async since signing R2 urls returns a promise
    const withUrls = await Promise.all(
      versions.map(async (v) => ({ ...v.toObject(), url: await urlFor(v.fileKey) }))
    );
    res.json(withUrls);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/projects/:id/versions
export const uploadVersion = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Audio file required' });
    }

    // Cap per project
    const count = await Version.countDocuments({ projectId: req.project._id });
    if (count >= 30) {
      await unlink(req.file.path).catch(() => {});
      return res.status(400).json({ message: 'Version limit reached (max 30 per project)' });
    }

    // Optional description, multer puts the text fields on req.body
    const description = (req.body.description || '').trim();
    if (description.length > 300) {
      await unlink(req.file.path).catch(() => {});
      return res.status(400).json({ message: 'Description is too long (max 300 characters)' });
    }

    const latest = await Version.findOne({ projectId: req.project._id }).sort({ versionNumber: -1 });
    const versionNumber = latest ? latest.versionNumber + 1 : 1;

    // Only allowlisted accounts keep the file in R2 and everyone else gets analysis only
    let fileKey = null;
    if (canStoreFiles(req.user.email)) {
      // Timestamp in the key so re-uploading the same filename doesn't overwrite
      const safeName = req.file.originalname.toLowerCase().replace(/[^a-z0-9._-]/g, '_').slice(0, 80);
      fileKey = `projects/${req.project._id}/${Date.now()}-${safeName}`;
      try {
        await uploadObject(fileKey, await readFile(req.file.path), req.file.mimetype);
      } catch (err) {
        // Storage broke, fail instead of saving the version as analysis-only
        console.error('R2 upload failed:', err.message);
        await unlink(req.file.path).catch(() => {});
        return res.status(500).json({ message: 'File storage failed' });
      }
    }

    const version = await Version.create({
      projectId: req.project._id,
      uploaderId: req.user._id,
      versionNumber,
      fileKey,
      originalName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
      description,
      analysisStatus: 'processing',
    });

    // Respond before analyzing
    res.status(201).json(version);
    analyzeInBackground(version._id, req.file.path, fileKey);
  } catch (err) {
    if (req.file) await unlink(req.file.path).catch(() => {});
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/projects/:id/versions/:versionId
// Add or edit the description after upload
export const updateVersion = async (req, res) => {
  try {
    // Empty string allowed so the note can be cleared
    const description = (req.body.description || '').trim();
    if (description.length > 300) {
      return res.status(400).json({ message: 'Description is too long (max 300 characters)' });
    }

    req.version.description = description;
    await req.version.save();
    res.json(req.version);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Runs after the response is already sent
// Catch everything itself since an unhandled rejection crashs the server
async function analyzeInBackground(versionId, tempPath, fileKey) {
  try {
    const analysis = await analyzeAudio(tempPath);
    await Version.findByIdAndUpdate(versionId, { analysisStatus: 'ready', analysis });
  } catch (err) {
    console.error('Analysis failed:', err.message);
    try {
      await Version.findByIdAndUpdate(versionId, { analysisStatus: 'failed', fileKey: null });
      if (fileKey && fileKey.startsWith('projects/')) {
        await deleteObject(fileKey);
      }
    } catch (cleanupErr) {
      console.error('Cleanup after failed analysis also failed:', cleanupErr.message);
    }
  } finally {
    await unlink(tempPath).catch(() => {});
  }
}
