// import express from 'express';
// import pkg from '@slack/bolt';
// import dotenv from 'dotenv';
// import cors from 'cors';
// import multer from 'multer';
// import mongoose from 'mongoose';
// import pdfParse from 'pdf-parse';  // Add this import
// import { pipeline } from 'stream/promises';
// import { createWriteStream } from 'fs';
// import { readFile, unlink, mkdir } from 'fs/promises';
// import path from 'path';

// dotenv.config();

// const { App } = pkg;
// const app = express();

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Configure multer for PDF uploads
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/');
//   },
//   filename: (req, file, cb) => {
//     cb(null, `${Date.now()}-${file.originalname}`);
//   }
// });

// const upload = multer({ 
//   storage: storage,
//   limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype === 'application/pdf') {
//       cb(null, true);
//     } else {
//       cb(new Error('Only PDF files are allowed'));
//     }
//   }
// });


// try {
//   await mkdir('uploads', { recursive: true });
// } catch (err) {
//   if (err.code !== 'EEXIST') {
//     console.error('Error creating uploads directory:', err);
//   }
// }

// // MongoDB Schema
// const DocumentSchema = new mongoose.Schema({
//   content: { type: String,  default: ''  },
//   filename: { type: String, required: true },
//   uploadDate: { type: Date, default: Date.now },
//   metadata: {
//     pageCount: Number,
//     fileSize: Number,
//     processingStatus: {
//       type: String,
//       enum: ['pending', 'processing', 'completed', 'error'],
//       default: 'pending'
//     },
//     processingProgress: {
//       type: Number,
//       min: 0,
//       max: 100,
//       default: 0
//     },
//     error: String
//   }
// });

// const Document = mongoose.model('Document', DocumentSchema);

// // Error handling middleware
// const errorHandler = (err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({ 
//     error: 'Something went wrong!',
//     message: err.message 
//   });
// };

// // Helper function to process PDF in chunks
// async function processPDFInChunks(filePath, documentId) {
//   try {
//     const doc = await Document.findById(documentId);
//     if (!doc) throw new Error('Document not found');

//     // Check if file exists before processing
//     try {
//       await readFile(filePath);
//     } catch (error) {
//       throw new Error(`PDF file not found at ${filePath}`);
//     }

//     doc.metadata.processingStatus = 'processing';
//     await doc.save();

//     // Read and parse PDF
//     const dataBuffer = await readFile(filePath);
    
//     const options = {
//       // Max pages to parse to avoid memory issues
//       max: 0, // 0 means parse all pages
//       // Enable version and info
//       version: false,
//       // Enable text extraction
//       pagerender: undefined
//     };

//     const data = await pdfParse(dataBuffer, options);

//     // Store text content with page markers
//     const pageTexts = data.text.split('\n\n');
//     let textContent = '';
    
//     for (let i = 0; i < pageTexts.length; i++) {
//       if (pageTexts[i].trim()) {  // Only add non-empty pages
//         textContent += `Page ${i + 1}:\n${pageTexts[i].trim()}\n\n`;
        
//         // Update progress
//         doc.metadata.processingProgress = Math.round((i + 1) / pageTexts.length * 100);
//         await doc.save();
//       }
//     }

//     // Update document with extracted text
//     doc.content = textContent;
//     doc.metadata.processingStatus = 'completed';
//     doc.metadata.processingProgress = 100;
//     doc.metadata.pageCount = data.numpages;
//     await doc.save();

//     // Clean up the temporary file
//     try {
//       await unlink(filePath);
//     } catch (error) {
//       console.error('Error deleting temporary file:', error);
//       // Continue execution even if file deletion fails
//     }

//   } catch (error) {
//     console.error('PDF processing error:', error);
//     const doc = await Document.findById(documentId);
//     if (doc) {
//       doc.metadata.processingStatus = 'error';
//       doc.metadata.error = error.message;
//       await doc.save();
//     }
//     throw error;
//   }
// }

// // Modify upload endpoint to ensure uploads directory exists
// app.post('/api/upload', upload.single('pdf'), async (req, res, next) => {
//   try {
//     // Ensure uploads directory exists
//     await mkdir('uploads', { recursive: true });

//     if (!req.file) {
//       return res.status(400).json({ error: 'No file uploaded' });
//     }

//     console.log('Uploaded file:', req.file);

//     const document = new Document({
//       filename: req.file.originalname,
//       metadata: {
//         fileSize: req.file.size,
//         processingStatus: 'pending',
//         processingProgress: 0
//       }
//     });

//     await document.save();

//     // Start processing in the background
//     processPDFInChunks(req.file.path, document._id).catch(async (error) => {
//       console.error('PDF processing error:', error);
//       await Document.findByIdAndUpdate(document._id, {
//         'metadata.processingStatus': 'error',
//         'metadata.error': error.message
//       });
//     });

//     res.json({ 
//       message: 'PDF upload started. Processing in background.',
//       documentId: document._id,
//       status: 'pending'
//     });
//   } catch (error) {
//     next(error);
//   }
// });
// // Get processing status
// app.get('/api/documents/:id/status', async (req, res, next) => {
//   try {
//     const document = await Document.findById(req.params.id, {
//       metadata: 1,
//       filename: 1,
//       uploadDate: 1
//     });

//     if (!document) {
//       return res.status(404).json({ error: 'Document not found' });
//     }

//     res.json({
//       status: document.metadata.processingStatus,
//       progress: document.metadata.processingProgress,
//       error: document.metadata.error,
//       filename: document.filename,
//       uploadDate: document.uploadDate
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// // Get all documents
// app.get('/api/documents', async (req, res, next) => {
//   try {
//     const documents = await Document.find({}, {
//       filename: 1,
//       uploadDate: 1,
//       metadata: 1
//     });
//     res.json(documents);
//   } catch (error) {
//     next(error);
//   }
// });

// // Get document by ID
// app.get('/api/documents/:id', async (req, res, next) => {
//   try {
//     const document = await Document.findById(req.params.id);
//     if (!document) {
//       return res.status(404).json({ error: 'Document not found' });
//     }
//     res.json(document);
//   } catch (error) {
//     next(error);
//   }
// });

// // Delete document
// app.delete('/api/documents/:id', async (req, res, next) => {
//   try {
//     const document = await Document.findByIdAndDelete(req.params.id);
//     if (!document) {
//       return res.status(404).json({ error: 'Document not found' });
//     }
//     res.json({ message: 'Document deleted successfully' });
//   } catch (error) {
//     next(error);
//   }
// });

// // Initialize Slack bot only if all required tokens are present
// let slackBot = null;
// if (process.env.SLACK_BOT_TOKEN && process.env.SLACK_SIGNING_SECRET && process.env.SLACK_APP_TOKEN) {
//   slackBot = new App({
//     token: process.env.SLACK_BOT_TOKEN,
//     signingSecret: process.env.SLACK_SIGNING_SECRET,
//     socketMode: true,
//     appToken: process.env.SLACK_APP_TOKEN
//   });

//   // Slack message handler
//   slackBot.message(async ({ message, say }) => {
//     try {
//       const documents = await Document.find({});
//       const combinedContent = documents.map(doc => doc.content).join(' ');
      
//       await say(`Received your message: ${message.text}`);
//     } catch (error) {
//       console.error('Error processing message:', error);
//       await say('Sorry, I encountered an error processing your request.');
//     }
//   });

//   // Start the Slack bot
//   (async () => {
//     try {
//       await slackBot.start();
//       console.log('⚡️ Slack Bolt app is running!');
//     } catch (error) {
//       console.error('Error starting Slack bot:', error);
//     }
//   })();
// } else {
//   console.log('Slack bot not initialized: Missing required environment variables');
// }

// // Connect to MongoDB
// mongoose.connect(process.env.MONGODB_URI)
//   .then(() => console.log('Connected to MongoDB'))
//   .catch(err => console.error('MongoDB connection error:', err));

// // Use error handling middleware
// app.use(errorHandler);

// // Start the Express server
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });



import express from 'express';
import pkg from '@slack/bolt';
import dotenv from 'dotenv';
import cors from 'cors';
import multer from 'multer';
import mongoose from 'mongoose';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import { readFile, unlink, mkdir } from 'fs/promises';
import path from 'path';


import pdfjs from 'pdfjs-dist/build/pdf.js';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.js';

dotenv.config();

const { App } = pkg;
const app = express();


// Set up pdfjs worker
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;



// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Create uploads directory
try {
  await mkdir('uploads', { recursive: true });
} catch (err) {
  if (err.code !== 'EEXIST') {
    console.error('Error creating uploads directory:', err);
  }
}

// MongoDB Schema
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

const Document = mongoose.model('Document', DocumentSchema);

// Helper function to process PDF
async function processPDFInChunks(filePath, documentId) {
  try {
    const doc = await Document.findById(documentId);
    if (!doc) throw new Error('Document not found');

    doc.metadata.processingStatus = 'processing';
    await doc.save();

    // Read the PDF file
    const dataBuffer = await readFile(filePath);
    
    // Load PDF document using pdf.js
    const loadingTask = pdfjs.getDocument({ data: dataBuffer });
    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;
    let textContent = '';

    // Process each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const content = await page.getTextContent();
      const pageText = content.items.map(item => item.str).join(' ');
      
      textContent += `Page ${pageNum}:\n${pageText}\n\n`;
      
      // Update progress
      doc.metadata.processingProgress = Math.round((pageNum / numPages) * 100);
      await doc.save();

      // Give the event loop a chance to handle other requests
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    // Update document with extracted text
    doc.content = textContent;
    doc.metadata.processingStatus = 'completed';
    doc.metadata.processingProgress = 100;
    doc.metadata.pageCount = numPages;
    await doc.save();

    // Clean up the temporary file
    try {
      await unlink(filePath);
    } catch (error) {
      console.error('Error deleting temporary file:', error);
    }

  } catch (error) {
    console.error('PDF processing error:', error);
    const doc = await Document.findById(documentId);
    if (doc) {
      doc.metadata.processingStatus = 'error';
      doc.metadata.error = error.message;
      await doc.save();
    }
    throw error;
  }
}

// API Endpoints
app.post('/api/upload', upload.single('pdf'), async (req, res, next) => {
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

    // Start processing in the background
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

app.get('/api/documents/:id/status', async (req, res, next) => {
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

app.get('/api/documents', async (req, res, next) => {
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

app.get('/api/documents/:id', async (req, res, next) => {
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

app.delete('/api/documents/:id', async (req, res, next) => {
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

// Initialize Slack bot
let slackBot = null;
if (process.env.SLACK_BOT_TOKEN && process.env.SLACK_SIGNING_SECRET && process.env.SLACK_APP_TOKEN) {
  slackBot = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    socketMode: true,
    appToken: process.env.SLACK_APP_TOKEN
  });

  slackBot.message(async ({ message, say }) => {
    try {
      const documents = await Document.find({});
      const combinedContent = documents.map(doc => doc.content).join(' ');
      await say(`Received your message: ${message.text}`);
    } catch (error) {
      console.error('Error processing message:', error);
      await say('Sorry, I encountered an error processing your request.');
    }
  });

  (async () => {
    try {
      await slackBot.start();
      console.log('⚡️ Slack Bolt app is running!');
    } catch (error) {
      console.error('Error starting Slack bot:', error);
    }
  })();
} else {
  console.log('Slack bot not initialized: Missing required environment variables');
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});