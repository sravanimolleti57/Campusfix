import multer from 'multer';
import path from 'path';

// Use memory storage for streaming buffers directly to Cloudinary
const storage = multer.memoryStorage();

// Allowed image MIME types and file extensions (JPG, JPEG, PNG, WEBP)
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
const ALLOWED_EXTENSIONS = /\.(jpe?g|png|webp)$/i;

const fileFilter = (req, file, cb) => {
  const isMimeValid = ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase());
  const isExtValid = ALLOWED_EXTENSIONS.test(path.extname(file.originalname).toLowerCase());

  if (isMimeValid && isExtValid) {
    cb(null, true);
  } else {
    const error = new Error('INVALID_FILE_TYPE: Only JPG, JPEG, PNG, and WEBP formats are permitted');
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

// Base Multer instance (5MB max per file, up to 5 files)
const multerInstance = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5,
  },
});

/**
 * Reusable middleware that intercepts upload errors and returns structured JSON
 */
export const uploadImagesMiddleware = (req, res, next) => {
  multerInstance.any()(req, res, (err) => {
    if (!err) {
      return next();
    }

    // Handle Multer-specific error codes
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'Image size exceeds the 5MB maximum limit. Please upload a smaller image.',
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: 'Too many files attached. You can upload a maximum of 5 images.',
        });
      }
      return res.status(400).json({
        success: false,
        message: `File upload error: ${err.message}`,
      });
    }

    // Handle custom fileFilter errors (e.g. invalid MIME type)
    if (err.code === 'INVALID_FILE_TYPE' || err.message?.includes('INVALID_FILE_TYPE')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file format. Only JPG, JPEG, PNG, and WEBP image files are permitted.',
      });
    }

    // Other unexpected errors
    return res.status(400).json({
      success: false,
      message: err.message || 'Error occurred while processing image attachments.',
    });
  });
};

export const uploadComplaintImages = multerInstance;
