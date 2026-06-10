const multer = require('multer');

const storage = multer.memoryStorage();

const ALLOWED_MIMES = [
  // Imagens
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',

  // PDF
  'application/pdf',

  // DOC
  'application/msword',

  // DOCX
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Apenas imagens (PNG, JPG, WebP), PDF e DOCX são permitidos',
      ),
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});


module.exports = upload;