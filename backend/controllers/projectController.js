import Project from '../models/Project.js';

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
    const projects = await Project.find({ 'members.userId': req.user._id });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/projects/:id
export const getProject = (req, res) => {
  res.json(req.project);
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
