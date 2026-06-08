import mongoose from 'mongoose';
import Comment from '../models/Comment.js';

// Load :commentId and confirm it belongs to req.version (set by loadVersion)
// Same chain idea as loadVersion so a comment from another version can't be reached here
const loadComment = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.commentId)) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const comment = await Comment.findById(req.params.commentId);
    if (!comment || !comment.versionId.equals(req.version._id)) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    req.comment = comment;
    next();
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export default loadComment;
