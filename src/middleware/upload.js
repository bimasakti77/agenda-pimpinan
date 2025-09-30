const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Configure multer for memory storage (we'll upload directly to MinIO)
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed. Allowed types: PDF, Images, Word, Excel, Text`), false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Only allow 1 file per upload
  }
});

// Middleware for single file upload
const uploadSingle = upload.single('file');

// Error handling middleware for multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Only 1 file allowed per upload.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name. Use "file" as the field name.'
      });
    }
  }
  
  if (error.message.includes('File type')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
};

// Generate unique filename
const generateUniqueFilename = (originalname) => {
  const ext = path.extname(originalname);
  const name = path.basename(originalname, ext);
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  
  return `${name}_${timestamp}_${randomString}${ext}`;
};

// Generate MinIO object key (path)
const generateObjectKey = (filename, agendaId) => {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  
  return `agenda/${year}/${month}/${agendaId}/${filename}`;
};

module.exports = {
  uploadSingle,
  handleUploadError,
  generateUniqueFilename,
  generateObjectKey
};

