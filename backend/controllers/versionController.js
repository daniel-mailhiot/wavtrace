import Version from '../models/Version.js';
import { r2Configured, getDownloadUrl } from '../lib/r2.js';

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
