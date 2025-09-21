const agendaService = require('../services/agendaService');

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
      const agenda = await agendaService.createAgenda(req.body, req.user.id);
      res.status(201).json({
        success: true,
        message: 'Agenda created successfully',
        data: agenda.toJSON()
      });
    } catch (error) {
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
}

module.exports = new AgendaController();
