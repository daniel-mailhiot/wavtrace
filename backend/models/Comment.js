import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  versionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Version', required: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true, trim: true },
  startTime: { type: Number, required: true },
  // null = point comment, number = region end.
  endTime: { type: Number, default: null },
  resolved: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('Comment', commentSchema);
