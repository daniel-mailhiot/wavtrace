import Version from '../models/Version.js';

//Static path for demo audio with signed R2 urls once real uploads work
function urlFor(fileKey) {
  if (fileKey.startsWith('demo/')) {
    return `/demo-audio/${fileKey.slice('demo/'.length)}`;
  }
  return null;
}

// GET /api/projects/:id/versions
export const listVersions = async (req, res) => {
  try {
    // req.project is already scoped to this member by requireProjectRole
    const versions = await Version.find({ projectId: req.project._id })
      .populate('uploaderId', 'name')
      .sort({ versionNumber: -1 });

    const withUrls = versions.map((v) => ({ ...v.toObject(), url: urlFor(v.fileKey) }));
    res.json(withUrls);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
