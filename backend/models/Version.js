import mongoose from 'mongoose';

const versionSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  uploaderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  versionNumber: { type: Number, required: true },
  fileKey: { type: String, required: true },
  originalName: { type: String, required: true },
  size: { type: Number, required: true },
  mimeType: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model('Version', versionSchema);
