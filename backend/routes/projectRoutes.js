import express from 'express';
import requireAuth from '../middleware/auth.js';
import requireProjectRole from '../middleware/projectRole.js';
import {
  createProject,
  listProjects,
  getProject,
  updateProject,
  deleteProject,
} from '../controllers/projectController.js';

const router = express.Router();

router.use(requireAuth);

router.post('/', createProject);
router.get('/', listProjects);
router.get('/:id', requireProjectRole(), getProject);
router.patch('/:id', requireProjectRole('owner'), updateProject);
router.delete('/:id', requireProjectRole('owner'), deleteProject);

export default router;
