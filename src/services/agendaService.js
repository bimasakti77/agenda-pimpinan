const Agenda = require('../models/Agenda');

class AgendaService {
  // Create new agenda
  async createAgenda(agendaData, userId) {
    const agenda = await Agenda.create({
      ...agendaData,
      created_by: userId
    });

    return agenda;
  }

  // Get agenda by ID
  async getAgendaById(id) {
    const agenda = await Agenda.findById(id);
    if (!agenda) {
      throw new Error('Agenda not found');
    }
    return agenda;
  }

  // Get all agenda with filters
  async getAllAgenda(filters = {}, page = 1, limit = 10) {
    const result = await Agenda.findAll(filters, page, limit);
    return result;
  }

  // Update agenda
  async updateAgenda(id, updateData, userId) {
    const agenda = await Agenda.findById(id);
    if (!agenda) {
      throw new Error('Agenda not found');
    }

    await agenda.update(updateData, userId);
    return agenda;
  }

  // Delete agenda
  async deleteAgenda(id) {
    const agenda = await Agenda.findById(id);
    if (!agenda) {
      throw new Error('Agenda not found');
    }

    await agenda.delete();
    return { message: 'Agenda deleted successfully' };
  }

  // Get agenda statistics
  async getAgendaStatistics(filters = {}) {
    const stats = await Agenda.getStatistics(filters);
    return stats;
  }

  // Get agenda by date range
  async getAgendaByDateRange(startDate, endDate, userId = null) {
    const filters = {
      date_from: startDate,
      date_to: endDate
    };

    if (userId) {
      filters.created_by = userId;
    }

    const result = await Agenda.findAll(filters, 1, 1000); // Get all results
    return result.agenda;
  }

  // Get upcoming agenda
  async getUpcomingAgenda(userId = null, limit = 10) {
    const today = new Date();
    const filters = {
      date_from: today.toISOString().split('T')[0],
      status: 'scheduled'
    };

    if (userId) {
      filters.created_by = userId;
    }

    const result = await Agenda.findAll(filters, 1, limit);
    return result.agenda;
  }

  // Get agenda by status
  async getAgendaByStatus(status, userId = null) {
    const filters = { status };

    if (userId) {
      filters.created_by = userId;
    }

    const result = await Agenda.findAll(filters, 1, 1000);
    return result.agenda;
  }

  // Get agenda by priority
  async getAgendaByPriority(priority, userId = null) {
    const filters = { priority };

    if (userId) {
      filters.created_by = userId;
    }

    const result = await Agenda.findAll(filters, 1, 1000);
    return result.agenda;
  }

  // Search agenda
  async searchAgenda(searchTerm, userId = null) {
    const filters = { search: searchTerm };

    if (userId) {
      filters.created_by = userId;
    }

    const result = await Agenda.findAll(filters, 1, 1000);
    return result.agenda;
  }

  // Get agenda calendar view (grouped by date)
  async getAgendaCalendar(startDate, endDate, userId = null) {
    const agenda = await this.getAgendaByDateRange(startDate, endDate, userId);
    
    // Group agenda by date
    const calendar = {};
    agenda.forEach(item => {
      const date = item.date.toISOString().split('T')[0];
      if (!calendar[date]) {
        calendar[date] = [];
      }
      calendar[date].push(item);
    });

    return calendar;
  }

  // Check for agenda conflicts
  async checkAgendaConflicts(date, startTime, endTime, excludeId = null) {
    const filters = {
      date_from: date,
      date_to: date
    };

    const result = await Agenda.findAll(filters, 1, 1000);
    const conflicts = [];

    result.agenda.forEach(agenda => {
      if (excludeId && agenda.id === excludeId) return;

      const agendaStart = agenda.start_time;
      const agendaEnd = agenda.end_time;

      if (agendaStart && agendaEnd && startTime && endTime) {
        // Check for time overlap
        if (
          (startTime >= agendaStart && startTime < agendaEnd) ||
          (endTime > agendaStart && endTime <= agendaEnd) ||
          (startTime <= agendaStart && endTime >= agendaEnd)
        ) {
          conflicts.push(agenda);
        }
      }
    });

    return conflicts;
  }

  // Get monthly statistics for charts
  async getMonthlyStats(user) {
    const result = await Agenda.getMonthlyStats(user);
    return result;
  }

  // Get dashboard statistics
  async getDashboardStats(user) {
    const result = await Agenda.getDashboardStats(user);
    return result;
  }
}

module.exports = new AgendaService();
