const router = require('express').Router();

const verifyJWT = require('../middleware/auth');
const upload = require('../middleware/upload');
const requireRole = require('../middleware/roles');
const { uploadFile } = require('../controllers/upload.controller');

router.post(
  '/',
  verifyJWT,
  requireRole('admin', 'professor'),
  upload.single('file'),
  uploadFile,
);

module.exports = router;