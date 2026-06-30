const router = require('express').Router();

const verifyJWT = require('../middleware/auth');
const upload = require('../middleware/upload');
const { requireMinimumRole } = require('../middleware/roles');
const { ROLES } = require('../constants/roles');
const { uploadFile } = require('../controllers/upload.controller');

router.post(
  '/',
  verifyJWT,
  requireMinimumRole(ROLES.PROFESSOR),
  upload.single('file'),
  uploadFile,
);

module.exports = router;