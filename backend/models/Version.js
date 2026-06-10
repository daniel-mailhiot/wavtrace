import mongoose from 'mongoose';

const versionSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  uploaderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  versionNumber: { type: Number, required: true },
  // null when the file was analyzed but not kept (only allowlisted accounts keep files in R2)
  fileKey: { type: String, default: null },
  originalName: { type: String, required: true },
  size: { type: Number, required: true },
  mimeType: { type: String, required: true },
  analysisStatus: { type: String, enum: ['processing', 'ready', 'failed'], default: 'processing' },
  // ffmpeg numbers frontend formats for display
  analysis: {
    durationSec: Number, sampleRate: Number, channels: Number,
    bitDepth: Number, bitrate: Number, format: String,
    loudness: Number, truePeak: Number, lra: Number, clipping: Boolean,
  },
}, { timestamps: true });

export default mongoose.model('Version', versionSchema);
