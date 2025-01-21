import multer from 'multer';
import { mkdir } from 'fs/promises';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

export const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

export const createUploadsDirectory = async () => {
  try {
    await mkdir('uploads', { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') {
      console.error('Error creating uploads directory:', err);
    }
  }
};