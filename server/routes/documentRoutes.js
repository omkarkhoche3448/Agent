import express from 'express';
import Document from '../models/Document.js';

const router = express.Router();

// Get all documents
router.get('/', async (req, res, next) => {
  try {
    const documents = await Document.find({}, {
      filename: 1,
      uploadDate: 1,
      metadata: 1
    });
    res.json(documents);
  } catch (error) {
    next(error);
  }
});

// Get document by ID
router.get('/:id', async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json(document);
  } catch (error) {
    next(error);
  }
});

// Get document status
router.get('/:id/status', async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id, {
      metadata: 1,
      filename: 1,
      uploadDate: 1
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({
      status: document.metadata.processingStatus,
      progress: document.metadata.processingProgress,
      error: document.metadata.error,
      filename: document.filename,
      uploadDate: document.uploadDate
    });
  } catch (error) {
    next(error);
  }
});

export default router