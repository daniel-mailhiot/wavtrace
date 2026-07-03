import express from 'express';
import requireAuth from '../middleware/auth.js';
import requireProjectRole from '../middleware/projectRole.js';
import loadVersion from '../middleware/loadVersion.js';
import loadComment from '../middleware/loadComment.js';
import handleUpload from '../middleware/upload.js';
import { uploadLimiter } from '../middleware/rateLimit.js';
import {
  createProject,
  listProjects,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  updateMember,
  removeMember
} from '../controllers/projectController.js';
import { listVersions, uploadVersion, updateVersion } from '../controllers/versionController.js';
import { listComments, createComment, updateComment, deleteComment } from '../controllers/commentController.js';

const router = express.Router();

router.use(requireAuth);

router.post('/', createProject);
router.get('/', listProjects);
router.get('/:id', requireProjectRole(), getProject);
router.patch('/:id', requireProjectRole('owner'), updateProject);
router.delete('/:id', requireProjectRole('owner'), deleteProject);

router.post('/:id/members', requireProjectRole('owner'), addMember);
router.patch('/:id/members/:userId', requireProjectRole('owner'), updateMember);
router.delete('/:id/members/:userId', requireProjectRole('owner'), removeMember);

router.get('/:id/versions', requireProjectRole(), listVersions);
// Role check runs before multer so non-owners are rejected before any files save
router.post('/:id/versions', uploadLimiter, requireProjectRole('owner'), handleUpload, uploadVersion);
router.patch('/:id/versions/:versionId', requireProjectRole('owner'), loadVersion, updateVersion);

router.get('/:id/versions/:versionId/comments', requireProjectRole(), loadVersion, listComments);
router.post('/:id/versions/:versionId/comments', requireProjectRole('owner', 'reviewer'), loadVersion, createComment);
router.patch('/:id/versions/:versionId/comments/:commentId', requireProjectRole(), loadVersion, loadComment, updateComment);
router.delete('/:id/versions/:versionId/comments/:commentId', requireProjectRole(), loadVersion, loadComment, deleteComment);

export default router;
