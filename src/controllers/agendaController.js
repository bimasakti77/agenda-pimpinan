const agendaService = require('../services/agendaService');
const undanganService = require('../services/undanganService');

class AgendaController {
  // Get all agenda with filters
  async getAllAgenda(req, res, next) {
    try {
      const { page = 1, limit = 10, ...filters } = req.query;
      
      // If user is not admin, only show their own agenda
      if (!['admin', 'superadmin'].includes(req.user.role)) {
        filters.created_by = req.user.id;
      }
      
      const result = await agendaService.getAllAgenda(filters, parseInt(page), parseInt(limit));
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // Get my agendas (agendas created by current user)
  async getMyAgendas(req, res, next) {
    try {
      const { page = 1, limit = 50, search, status, priority } = req.query;
      const result = await agendaService.getMyAgendas(req.user.id, {
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        status,
        priority
      });
      
      res.json({
        success: true,
        data: {
          agendas: result.agendas,
          pagination: result.pagination
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get agenda by ID
  async getAgendaById(req, res, next) {
    try {
      const agenda = await agendaService.getAgendaById(req.params.id);
      
      // Check if user can access this agenda
      if (!['admin', 'superadmin'].includes(req.user.role) && agenda.created_by !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only access your own agenda.'
        });
      }
      
      res.json({
        success: true,
        data: agenda.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  // Create new agenda
  async createAgenda(req, res, next) {
    try {
      console.log('\n🚀 ===== AGENDA CREATION STARTED =====');
      console.log('👤 Created by user:', req.user.id, req.user.username);
      console.log('📅 Agenda title:', req.body.title);
      
      // Debug log untuk cek data yang diterima
      console.log('\n🔍 DEBUG: Request body structure:');
      console.log('📋 Undangan data:', JSON.stringify(req.body.undangan, null, 2));
      console.log('📊 Undangan count:', req.body.undangan ? req.body.undangan.length : 0);
      
      const agenda = await agendaService.createAgenda(req.body, req.user.id);
      console.log('✅ Agenda created successfully with ID:', agenda.id);
      
      console.log('\n🏁 ===== AGENDA CREATION COMPLETED =====\n');
      
      res.status(201).json({
        success: true,
        message: 'Agenda created successfully',
        data: agenda.toJSON()
      });
    } catch (error) {
      console.error('\n💥 ===== AGENDA CREATION ERROR =====');
      console.error('Error:', error.message);
      next(error);
    }
  }

  // Update agenda
  async updateAgenda(req, res, next) {
    try {
      const agenda = await agendaService.getAgendaById(req.params.id);
      
      // Check if user can update this agenda
      if (!['admin', 'superadmin'].includes(req.user.role) && agenda.created_by !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only update your own agenda.'
        });
      }
      
      const updatedAgenda = await agendaService.updateAgenda(req.params.id, req.body, req.user.id);
      
      res.json({
        success: true,
        message: 'Agenda updated successfully',
        data: updatedAgenda.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete agenda
  async deleteAgenda(req, res, next) {
    try {
      const agenda = await agendaService.getAgendaById(req.params.id);
      
      // Check if user can delete this agenda
      if (!['admin', 'superadmin'].includes(req.user.role) && agenda.created_by !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only delete your own agenda.'
        });
      }
      
      const result = await agendaService.deleteAgenda(req.params.id);
      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  // Get agenda statistics
  async getAgendaStatistics(req, res, next) {
    try {
      const filters = {};
      
      // If user is not admin, only show their own statistics
      if (!['admin', 'superadmin'].includes(req.user.role)) {
        filters.created_by = req.user.id;
      }
      
      const stats = await agendaService.getAgendaStatistics(filters);
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  // Get upcoming agenda
  async getUpcomingAgenda(req, res, next) {
    try {
      const { limit = 10 } = req.query;
      const userId = ['admin', 'superadmin'].includes(req.user.role) ? null : req.user.id;
      
      const agenda = await agendaService.getUpcomingAgenda(userId, parseInt(limit));
      res.json({
        success: true,
        data: agenda
      });
    } catch (error) {
      next(error);
    }
  }

  // Get agenda calendar view
  async getAgendaCalendar(req, res, next) {
    try {
      const { start_date, end_date } = req.query;
      
      if (!start_date || !end_date) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required'
        });
      }
      
      const userId = ['admin', 'superadmin'].includes(req.user.role) ? null : req.user.id;
      const calendar = await agendaService.getAgendaCalendar(start_date, end_date, userId);
      
      res.json({
        success: true,
        data: calendar
      });
    } catch (error) {
      next(error);
    }
  }

  // Search agenda
  async searchAgenda(req, res, next) {
    try {
      const { q } = req.query;
      
      if (!q) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }
      
      const userId = ['admin', 'superadmin'].includes(req.user.role) ? null : req.user.id;
      const agenda = await agendaService.searchAgenda(q, userId);
      
      res.json({
        success: true,
        data: agenda
      });
    } catch (error) {
      next(error);
    }
  }

  // Check for agenda conflicts
  async checkAgendaConflicts(req, res, next) {
    try {
      const { date, start_time, end_time, exclude_id } = req.query;
      
      if (!date || !start_time || !end_time) {
        return res.status(400).json({
          success: false,
          message: 'Date, start time, and end time are required'
        });
      }
      
      const conflicts = await agendaService.checkAgendaConflicts(date, start_time, end_time, exclude_id);
      
      res.json({
        success: true,
        data: {
          hasConflicts: conflicts.length > 0,
          conflicts
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get agenda by status
  async getAgendaByStatus(req, res, next) {
    try {
      const { status } = req.params;
      const userId = ['admin', 'superadmin'].includes(req.user.role) ? null : req.user.id;
      
      const agenda = await agendaService.getAgendaByStatus(status, userId);
      res.json({
        success: true,
        data: agenda
      });
    } catch (error) {
      next(error);
    }
  }

  // Get agenda by priority
  async getAgendaByPriority(req, res, next) {
    try {
      const { priority } = req.params;
      const userId = ['admin', 'superadmin'].includes(req.user.role) ? null : req.user.id;
      
      const agenda = await agendaService.getAgendaByPriority(priority, userId);
      res.json({
        success: true,
        data: agenda
      });
    } catch (error) {
      next(error);
    }
  }

  // Send invitations for agenda
  async sendInvitations(req, res, next) {
    try {
      console.log('\n🚀 ===== SEND INVITATIONS STARTED =====');
      console.log('👤 Requested by user:', req.user.id, req.user.username);
      console.log('📅 Agenda ID:', req.params.id);
      
      const agenda = await agendaService.getAgendaById(req.params.id);
      
      // Check if user can send invitations for this agenda
      if (!['admin', 'superadmin'].includes(req.user.role) && agenda.created_by !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only send invitations for your own agenda.'
        });
      }

      // Check if invitations already sent
      if (agenda.kirim_undangan === 1) {
        return res.status(400).json({
          success: false,
          message: 'Invitations have already been sent for this agenda.'
        });
      }

      // Check if agenda has participants
      if (!agenda.undangan || agenda.undangan.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No participants found for this agenda. Please add participants first.'
        });
      }

      console.log(`📊 Processing ${agenda.undangan.length} participants...`);
      
      // Generate undangan for internal participants
      const generatedUndangan = await undanganService.generateUndanganForAgenda(
        agenda.id, 
        agenda.undangan
      );
      
      // Update agenda status to invitations sent
      await agendaService.updateAgenda(req.params.id, { kirim_undangan: 1 }, req.user.id);
      
      console.log(`\n🎉 ===== SEND INVITATIONS COMPLETED =====`);
      console.log(`✅ Successfully sent ${generatedUndangan.length} invitations for agenda ${agenda.id}`);
      
      res.json({
        success: true,
        message: `Successfully sent ${generatedUndangan.length} invitations`,
        data: {
          agenda_id: agenda.id,
          invitations_sent: generatedUndangan.length,
          total_participants: agenda.undangan.length
        }
      });
    } catch (error) {
      console.error('\n💥 ===== SEND INVITATIONS ERROR =====');
      console.error('Error:', error.message);
      next(error);
    }
  }
}

module.exports = new AgendaController();
