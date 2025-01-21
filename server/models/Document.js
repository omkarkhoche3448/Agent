import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema({
  content: { type: String, default: '' },
  filename: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now },
  metadata: {
    pageCount: Number,
    fileSize: Number,
    processingStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'error'],
      default: 'pending'
    },
    processingProgress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    error: String
  }
});

export default mongoose.model('Document', DocumentSchema);