const router = require('express').Router();
const verifyJWT = require('../middleware/auth');
const {
  getMyInvitations, acceptInvitation, declineInvitation,
} = require('../controllers/invitations.controller');

// Convites recebidos pelo aluno logado (vagas reservadas por gestores de curso)
router.get('/my', verifyJWT, getMyInvitations);
router.post('/:id/accept', verifyJWT, acceptInvitation);
router.post('/:id/decline', verifyJWT, declineInvitation);

module.exports = router;
