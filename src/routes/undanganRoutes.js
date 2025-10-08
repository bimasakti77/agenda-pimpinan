const express = require('express');
const router = express.Router();
const undanganController = require('../controllers/undanganController');
const { authenticate } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

// Get undangan by user (current user's invitations)
router.get('/my-invitations', undanganController.getUndanganByUser);

// Get undangan by agenda ID (for agenda creator/admin)
router.get('/agenda/:agendaId', undanganController.getUndanganByAgenda);

// Update undangan status (open, respond)
router.patch('/:undanganId/status', undanganController.updateUndanganStatus);

// Delegate undangan to another user
router.post('/:undanganId/delegate', undanganController.delegateUndangan);

// Get delegation chain for an undangan
router.get('/:undanganId/delegation-chain', undanganController.getDelegationChain);

// Check if user can delegate (validation endpoint)
router.get('/:undanganId/can-delegate', undanganController.checkDelegationEligibility);

// Generate undangan for agenda (auto-generate)
router.post('/generate/:agendaId', undanganController.generateUndanganForAgenda);

module.exports = router;
