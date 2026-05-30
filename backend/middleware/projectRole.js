import mongoose from 'mongoose';
import Project from '../models/Project.js';

// Load project and check user's role on it
const requireProjectRole = (...allowedRoles) => async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const membership = project.members.find(
      (m) => m.userId.toString() === req.user._id.toString()
    );
    if (!membership) {
      return res.status(403).json({ message: 'Not a project member' });
    }

    if (allowedRoles.length && !allowedRoles.includes(membership.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    // Pass the loaded project on
    req.project = project;
    req.membership = membership;
    next();
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export default requireProjectRole;
