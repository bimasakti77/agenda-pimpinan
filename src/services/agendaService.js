const Agenda = require('../models/Agenda');
const FileService = require('./fileService');

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

  // Get my agendas (agendas created by specific user)
  async getMyAgendas(userId, options = {}) {
    const { page = 1, limit = 50, search, status, priority } = options;
    
    const filters = {
      created_by: userId
    };
    
    if (search) {
      filters.search = search;
    }
    
    if (status) {
      filters.status = status;
    }
    
    if (priority) {
      filters.priority = priority;
    }
    
    const result = await Agenda.findAll(filters, page, limit);
    
    // Transform result to match expected format
    return {
      agendas: result.agenda, // Note: Agenda.findAll returns 'agenda', not 'agendas'
      pagination: result.pagination
    };
  }

  // Update agenda
  async updateAgenda(id, updateData, userId) {
    const agenda = await Agenda.findById(id);
    if (!agenda) {
      throw new Error('Agenda not found');
    }

    // If updating file, delete old file first
    if (updateData.file_path && agenda.file_path && updateData.file_path !== agenda.file_path) {
      try {
        await FileService.deleteFile(agenda.file_path);
      } catch (error) {
        console.warn('Failed to delete old file:', error.message);
      }
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

    // Delete associated file from MinIO
    if (agenda.file_path) {
      try {
        await FileService.deleteFile(agenda.file_path);
      } catch (error) {
        console.warn('Failed to delete file:', error.message);
      }
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

  // Upload file for agenda
  async uploadAgendaFile(agendaId, fileBuffer, originalName, mimeType) {
    const agenda = await Agenda.findById(agendaId);
    if (!agenda) {
      throw new Error('Agenda not found');
    }

    // Delete existing file if any
    if (agenda.file_path) {
      try {
        await FileService.deleteFile(agenda.file_path);
      } catch (error) {
        console.warn('Failed to delete existing file:', error.message);
      }
    }

    // Upload new file
    const uploadResult = await FileService.uploadFile(fileBuffer, originalName, mimeType, agendaId);
    
    if (uploadResult.success) {
      // Update agenda with file information
      const fileInfo = uploadResult.fileInfo;
      await agenda.update({
        file_name: fileInfo.fileName,
        file_path: fileInfo.filePath,
        file_size: fileInfo.fileSize,
        file_type: fileInfo.fileType,
        file_uploaded_at: fileInfo.uploadedAt,
        file_bucket: fileInfo.bucketName
      });

      return {
        success: true,
        message: 'File uploaded successfully',
        fileInfo: fileInfo
      };
    }

    throw new Error('Failed to upload file');
  }

  // Delete file from agenda
  async deleteAgendaFile(agendaId) {
    const agenda = await Agenda.findById(agendaId);
    if (!agenda) {
      throw new Error('Agenda not found');
    }

    if (!agenda.file_path) {
      throw new Error('No file attached to this agenda');
    }

    // Delete file from MinIO
    await FileService.deleteFile(agenda.file_path);

    // Update agenda to remove file information
    await agenda.update({
      file_name: null,
      file_path: null,
      file_size: null,
      file_type: null,
      file_uploaded_at: null,
      file_bucket: null
    });

    return {
      success: true,
      message: 'File deleted successfully'
    };
  }

  // Get file download URL
  async getFileDownloadUrl(agendaId, expiry = 3600) {
    const agenda = await Agenda.findById(agendaId);
    if (!agenda) {
      throw new Error('Agenda not found');
    }

    if (!agenda.file_path) {
      throw new Error('No file attached to this agenda');
    }

    // Use bucket from database, fallback to default
    const bucketName = agenda.file_bucket || process.env.MINIO_BUCKET_NAME || 'agenda-files';
    const downloadUrl = await FileService.getPresignedUrl(agenda.file_path, bucketName, expiry);
    
    return {
      success: true,
      downloadUrl: downloadUrl,
      fileName: agenda.file_name,
      fileSize: agenda.file_size,
      fileType: agenda.file_type,
      bucketName: bucketName
    };
  }
}

module.exports = new AgendaService();
