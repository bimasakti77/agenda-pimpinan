const express = require('express');
const router = express.Router();
const pegawaiController = require('../controllers/pegawaiController');
const { authenticate } = require('../middleware/auth');
const { cache } = require('../middleware/cache');

// GET /api/pegawai - Get all pegawai for dropdown (no auth required for testing)
router.get('/', pegawaiController.getAllPegawai);

// Apply authentication middleware to other routes
router.use(authenticate);

// GET /api/pegawai/search?q=term - Search pegawai (cached for 5 minutes)
router.get('/search', cache(5 * 60 * 1000), pegawaiController.searchPegawai);

// GET /api/pegawai/nip/:nip - Get pegawai by NIP (cached for 15 minutes)
router.get('/nip/:nip', cache(15 * 60 * 1000), pegawaiController.getPegawaiByNip);

module.exports = router;
