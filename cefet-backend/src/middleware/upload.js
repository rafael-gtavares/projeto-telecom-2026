const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const ALLOWED_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_EXTS = /\.(jpeg|jpg|png|webp)$/i;

const fileFilter = (req, file, cb) => {
  const extOk = ALLOWED_EXTS.test(path.extname(file.originalname));
  const mimeOk = ALLOWED_MIMES.includes(file.mimetype);
  if (extOk && mimeOk) cb(null, true);
  else cb(new Error('Apenas imagens PNG, JPG e WebP são permitidas'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

module.exports = upload;
