const pegawaiService = require('../services/pegawaiService');

class PegawaiController {
  // Get all pegawai for dropdown
  async getAllPegawai(req, res, next) {
    try {
      const startTime = Date.now();
      const pegawai = await pegawaiService.getAllPegawai();
      const duration = Date.now() - startTime;
      
      // Log successful request
      
      res.json({
        success: true,
        data: pegawai,
        meta: {
          count: pegawai.length,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('[PEGAWAI] Error in getAllPegawai:', error);
      next(error);
    }
  }

  // Get pegawai by NIP
  async getPegawaiByNip(req, res, next) {
    try {
      const { nip } = req.params;
      
      // Validate NIP format
      if (!nip || !/^\d{18}$/.test(nip)) {
        return res.status(400).json({
          success: false,
          message: 'NIP harus 18 digit angka',
          error: 'INVALID_NIP_FORMAT'
        });
      }
      
      const startTime = Date.now();
      const pegawai = await pegawaiService.getPegawaiByNip(nip);
      const duration = Date.now() - startTime;
      
      if (!pegawai) {
        return res.status(404).json({
          success: false,
          message: 'Pegawai tidak ditemukan',
          error: 'PEGAWAI_NOT_FOUND'
        });
      }
      
      
      res.json({
        success: true,
        data: pegawai,
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error(`[PEGAWAI] Error in getPegawaiByNip for NIP ${req.params.nip}:`, error);
      next(error);
    }
  }

  // Search pegawai
  async searchPegawai(req, res, next) {
    try {
      const { q, limit = 20 } = req.query;
      
      // Validate search query
      if (!q || q.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Query pencarian minimal 2 karakter',
          error: 'INVALID_SEARCH_QUERY'
        });
      }
      
      // Validate limit
      const searchLimit = Math.min(parseInt(limit) || 20, 100); // Max 100 results
      
      const startTime = Date.now();
      const pegawai = await pegawaiService.searchPegawai(q.trim(), searchLimit);
      const duration = Date.now() - startTime;
      
      res.json({
        success: true,
        data: pegawai,
        meta: {
          query: q.trim(),
          limit: searchLimit,
          count: pegawai.length,
          duration: `${duration}ms`,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error(`[PEGAWAI] Error in searchPegawai for query "${req.query.q}":`, error);
      next(error);
    }
  }
}

module.exports = new PegawaiController();
