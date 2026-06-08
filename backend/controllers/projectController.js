import Project from '../models/Project.js';
import User from '../models/User.js';
import Version from '../models/Version.js';

// POST /api/projects
export const createProject = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Name required' });
    }

    // Creator is first member and owner
    const project = await Project.create({
      name,
      members: [{ userId: req.user._id, role: 'owner' }],
    });

    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/projects
export const listProjects = async (req, res) => {
  try {
    // Member name + email for display
    const projects = await Project.find({ 'members.userId': req.user._id })
      .populate('members.userId', 'name email')
      .sort({ updatedAt: -1 });

    const withCounts = await Promise.all(
      projects.map(async (p) => ({
        ...p.toObject(),
        versionCount: await Version.countDocuments({ projectId: p._id }),
      }))
    );

    res.json(withCounts);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/projects/:id
export const getProject = async (req, res) => {
  try {
    await req.project.populate('members.userId', 'name email');
    res.json(req.project);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/projects/:id
export const updateProject = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Name required' });
    }

    req.project.name = name;
    await req.project.save();
    res.json(req.project);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/projects/:id
export const deleteProject = async (req, res) => {
  try {
    await req.project.deleteOne();
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/projects/:id/members
export const addMember = async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email || !role) {
      return res.status(400).json({ message: 'Email and role required' });
    }
    if (!['reviewer', 'viewer'].includes(role)) {
      return res.status(400).json({ message: 'Role must be reviewer or viewer' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // One user, one role per project
    const exists = req.project.members.find(
      (m) => m.userId.toString() === user._id.toString()
    );
    if (exists) {
      return res.status(409).json({ message: 'User already a member' });
    }

    req.project.members.push({ userId: user._id, role });
    await req.project.save();
    // Populate name + email so the response matches the read endpoints
    await req.project.populate('members.userId', 'name email');
    res.status(201).json(req.project);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/projects/:id/members/:userId
export const updateMember = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['reviewer', 'viewer'].includes(role)) {
      return res.status(400).json({ message: 'Role must be reviewer or viewer' });
    }

    const member = req.project.members.find(
      (m) => m.userId.toString() === req.params.userId
    );
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    member.role = role;
    await req.project.save();
    await req.project.populate('members.userId', 'name email');
    res.json(req.project);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/projects/:id/members/:userId
export const removeMember = async (req, res) => {
  try {
    // Owner can't remove themselves
    if (req.params.userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Owner cannot remove themselves' });
    }

    const before = req.project.members.length;
    req.project.members = req.project.members.filter(
      (m) => m.userId.toString() !== req.params.userId
    );
    if (req.project.members.length === before) {
      return res.status(404).json({ message: 'Member not found' });
    }

    await req.project.save();
    await req.project.populate('members.userId', 'name email');
    res.json(req.project);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
