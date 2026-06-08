import Comment from '../models/Comment.js';

// GET /api/projects/:id/versions/:versionId/comments
export const listComments = async (req, res) => {
  try {
    // req.version is scoped and verified by loadVersion
    const comments = await Comment.find({ versionId: req.version._id })
      .populate('authorId', 'name')
      .sort({ startTime: 1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/projects/:id/versions/:versionId/comments
export const createComment = async (req, res) => {
  try {
    const { body, startTime, endTime } = req.body;
    if (!body || !body.trim()) {
      return res.status(400).json({ message: 'Comment text required' });
    }
    if (typeof startTime !== 'number') {
      return res.status(400).json({ message: 'startTime required' });
    }

    const comment = await Comment.create({
      versionId: req.version._id,
      authorId: req.user._id,
      body: body.trim(),
      startTime,
      // null = point comment, a number = region end
      endTime: typeof endTime === 'number' ? endTime : null,
    });

    // Populate the author name so the response matches listComments
    await comment.populate('authorId', 'name');
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/projects/:id/versions/:versionId/comments/:commentId
export const deleteComment = async (req, res) => {
  try {
    // Any member can reach this route but only the author can delete
    if (!req.comment.authorId.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only the author can delete this comment' });
    }

    await req.comment.deleteOne();
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
