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

// Delete document
router.delete('/:id', async (req, res, next) => {
  try {
    const document = await Document.findByIdAndDelete(req.params.id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get document statistics
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await Document.aggregate([
      {
        $group: {
          _id: null,
          totalDocuments: { $sum: 1 },
          completedDocuments: {
            $sum: {
              $cond: [{ $eq: ["$metadata.processingStatus", "completed"] }, 1, 0]
            }
          },
          totalPages: { $sum: "$metadata.pageCount" },
          averageFileSize: { $avg: "$metadata.fileSize" }
        }
      }
    ]);

    res.json(stats[0] || {
      totalDocuments: 0,
      completedDocuments: 0,
      totalPages: 0,
      averageFileSize: 0
    });
  } catch (error) {
    next(error);
  }
});

// Search documents
router.get('/search', async (req, res, next) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const results = await Document.find(
      { content: { $regex: query, $options: 'i' } },
      { filename: 1, content: 1, uploadDate: 1 }
    );

    res.json(results);
  } catch (error) {
    next(error);
  }
});

export default router;