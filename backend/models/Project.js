import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['owner', 'reviewer', 'viewer'], required: true },
}, { _id: false });

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  members: { type: [memberSchema], default: [] },
}, { timestamps: true });

export default mongoose.model('Project', projectSchema);
