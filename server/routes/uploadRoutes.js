import express from 'express';
import { upload } from '../middleware/upload.js';
import Document from '../models/Document.js';
import { processPDFInChunks } from '../services/pdfService.js';

const router = express.Router();

router.post('/', upload.single('pdf'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const document = new Document({
      filename: req.file.originalname,
      metadata: {
        fileSize: req.file.size,
        processingStatus: 'pending',
        processingProgress: 0
      }
    });

    await document.save();

    // Process PDF in background
    processPDFInChunks(req.file.path, document._id).catch(async (error) => {
      console.error('PDF processing error:', error);
      await Document.findByIdAndUpdate(document._id, {
        'metadata.processingStatus': 'error',
        'metadata.error': error.message
      });
    });

    res.json({ 
      message: 'PDF upload started. Processing in background.',
      documentId: document._id,
      status: 'pending'
    });
  } catch (error) {
    next(error);
  }
});

export default router;