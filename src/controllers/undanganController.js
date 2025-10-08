const undanganService = require('../services/undanganService');

class UndanganController {
  // Get undangan by user ID
  async getUndanganByUser(req, res, next) {
    try {
      const userId = req.user.id;
      const { status, page = 1, limit = 10 } = req.query;
      
      const result = await undanganService.getUndanganByUser(userId, { status }, parseInt(page), parseInt(limit));
      
      res.json({
        success: true,
        data: {
          undangan: result.undangan,
          pagination: result.pagination
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get undangan by agenda ID
  async getUndanganByAgenda(req, res, next) {
    try {
      const agendaId = req.params.agendaId;
      const result = await undanganService.getUndanganByAgenda(agendaId);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // Update undangan status (open, respond)
  async updateUndanganStatus(req, res, next) {
    try {
      const { undanganId } = req.params;
      const { status } = req.body;
      const userId = req.user.id;
      
      // Validate status
      if (!['opened', 'responded'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status harus opened atau responded'
        });
      }
      
      const result = await undanganService.updateUndanganStatus(undanganId, status, userId);
      
      res.json({
        success: true,
        message: 'Status undangan berhasil diupdate',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // Delegate undangan to another user
  async delegateUndangan(req, res, next) {
    try {
      const { undanganId } = req.params;
      const { delegated_to_user_id, delegated_to_pegawai_id, delegated_to_nama, notes } = req.body;
      const userId = req.user.id;
      
      // Validate delegation data
      if (!delegated_to_user_id && !delegated_to_pegawai_id) {
        return res.status(400).json({
          success: false,
          message: 'Harus memilih user atau pegawai untuk delegasi'
        });
      }
      
      if (!delegated_to_nama) {
        return res.status(400).json({
          success: false,
          message: 'Nama delegasi harus diisi'
        });
      }
      
      const result = await undanganService.delegateUndangan(
        undanganId, 
        userId, 
        { delegated_to_user_id, delegated_to_pegawai_id, delegated_to_nama, notes }
      );
      
      res.json({
        success: true,
        message: 'Delegasi berhasil dilakukan',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // Get delegation chain for an undangan
  async getDelegationChain(req, res, next) {
    try {
      const { undanganId } = req.params;
      const result = await undanganService.getDelegationChain(undanganId);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // Check if user can delegate (validation)
  async checkDelegationEligibility(req, res, next) {
    try {
      const { undanganId } = req.params;
      const userId = req.user.id;
      
      const result = await undanganService.checkDelegationEligibility(undanganId, userId);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // Generate undangan for agenda (auto-generate)
  async generateUndanganForAgenda(req, res, next) {
    try {
      const { agendaId } = req.params;
      const { undanganList } = req.body;
      
      if (!undanganList || !Array.isArray(undanganList)) {
        return res.status(400).json({
          success: false,
          message: 'undanganList harus berupa array'
        });
      }
      
      const result = await undanganService.generateUndanganForAgenda(agendaId, undanganList);
      
      res.json({
        success: true,
        message: `Berhasil generate ${result.length} undangan`,
        data: {
          generatedCount: result.length,
          undangan: result
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UndanganController();
