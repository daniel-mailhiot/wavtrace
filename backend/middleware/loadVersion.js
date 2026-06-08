import mongoose from 'mongoose';
import Version from '../models/Version.js';

// Confirm :versionId belongs to req.project (set by requireProjectRole `middleware/projectRole.js`) 
// so a member can't reach another project's version
const loadVersion = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.versionId)) {
      return res.status(404).json({ message: 'Version not found' });
    }

    const version = await Version.findById(req.params.versionId);
    if (!version || !version.projectId.equals(req.project._id)) {
      return res.status(404).json({ message: 'Version not found' });
    }

    req.version = version;
    next();
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export default loadVersion;
