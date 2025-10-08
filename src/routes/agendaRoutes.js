const express = require('express');
const router = express.Router();
const agendaService = require('../services/agendaService');
const agendaController = require('../controllers/agendaController');
const { authenticate, authorize, canAccessResource } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { uploadSingle, handleUploadError } = require('../middleware/upload');

// @route   GET /api/agenda/stats/monthly
// @desc    Get monthly agenda statistics
// @access  Private
router.get('/stats/monthly', authenticate, async (req, res, next) => {
  try {
    const result = await agendaService.getMonthlyStats(req.user);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/agenda/stats/dashboard
// @desc    Get dashboard statistics
// @access  Private
router.get('/stats/dashboard', authenticate, async (req, res, next) => {
  try {
    const result = await agendaService.getDashboardStats(req.user);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Dashboard Stats error:', error);
    next(error);
  }
});

// @route   GET /api/agenda
// @desc    Get all agenda with filters
// @access  Private
router.get('/', authenticate, async (req, res, next) => {
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
});

// @route   GET /api/agenda/statistics
// @desc    Get agenda statistics
// @access  Private
router.get('/statistics', authenticate, async (req, res, next) => {
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
});

// @route   GET /api/agenda/upcoming
// @desc    Get upcoming agenda
// @access  Private
router.get('/upcoming', authenticate, async (req, res, next) => {
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
});

// @route   GET /api/agenda/calendar
// @desc    Get agenda calendar view
// @access  Private
router.get('/calendar', authenticate, async (req, res, next) => {
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
});

// @route   GET /api/agenda/search
// @desc    Search agenda
// @access  Private
router.get('/search', authenticate, async (req, res, next) => {
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
});

// @route   GET /api/agenda/conflicts
// @desc    Check for agenda conflicts
// @access  Private
router.get('/conflicts', authenticate, async (req, res, next) => {
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
});

// @route   GET /api/agenda/my-agendas
// @desc    Get my agendas (agendas created by current user)
// @access  Private
router.get('/my-agendas', authenticate, async (req, res, next) => {
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
});

// @route   GET /api/agenda/:id
// @desc    Get agenda by ID
// @access  Private
router.get('/:id', authenticate, async (req, res, next) => {
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
});

// @route   POST /api/agenda
// @desc    Create new agenda (with optional file upload)
// @access  Private
router.post('/', authenticate, uploadSingle, async (req, res, next) => {
  try {
    // Parse JSON data from form field
    let agendaData;
    try {
      agendaData = req.body.data ? JSON.parse(req.body.data) : req.body;
    } catch (parseError) {
      agendaData = req.body;
    }

    // Create agenda
    const agenda = await agendaService.createAgenda(agendaData, req.user.id);
    
    // Upload file if provided
    if (req.file) {
      try {
        await agendaService.uploadAgendaFile(
          agenda.id,
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype
        );
      } catch (fileError) {
        console.error('File upload error during agenda creation:', fileError);
        // Continue even if file upload fails
      }
    }

    // Fetch updated agenda with file info
    const updatedAgenda = await agendaService.getAgendaById(agenda.id);

    res.status(201).json({
      success: true,
      message: req.file ? 'Agenda dan file berhasil dibuat' : 'Agenda created successfully',
      data: updatedAgenda.toJSON()
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/agenda/:id
// @desc    Update agenda
// @access  Private
router.put('/:id', authenticate, validate(schemas.updateAgenda), async (req, res, next) => {
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
});

// @route   DELETE /api/agenda/:id
// @desc    Delete agenda
// @access  Private
router.delete('/:id', authenticate, async (req, res, next) => {
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
});

// @route   GET /api/agenda/status/:status
// @desc    Get agenda by status
// @access  Private
router.get('/status/:status', authenticate, async (req, res, next) => {
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
});

// @route   GET /api/agenda/priority/:priority
// @desc    Get agenda by priority
// @access  Private
router.get('/priority/:priority', authenticate, async (req, res, next) => {
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
});

// @route   POST /api/agenda/:id/upload
// @desc    Upload file for agenda
// @access  Private
router.post('/:id/upload', authenticate, uploadSingle, handleUploadError, async (req, res, next) => {
  try {
    const agendaId = req.params.id;
    
    // Check if user can access this agenda
    const agenda = await agendaService.getAgendaById(agendaId);
    if (!['admin', 'superadmin'].includes(req.user.role) && agenda.created_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only upload files to your own agenda.'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const result = await agendaService.uploadAgendaFile(
      agendaId,
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    res.json({
      success: true,
      message: result.message,
      data: result.fileInfo
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/agenda/:id/file
// @desc    Delete file from agenda
// @access  Private
router.delete('/:id/file', authenticate, async (req, res, next) => {
  try {
    const agendaId = req.params.id;
    
    // Check if user can access this agenda
    const agenda = await agendaService.getAgendaById(agendaId);
    if (!['admin', 'superadmin'].includes(req.user.role) && agenda.created_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete files from your own agenda.'
      });
    }

    const result = await agendaService.deleteAgendaFile(agendaId);

    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/agenda/:id/download
// @desc    Get file download URL
// @access  Private
router.get('/:id/download', authenticate, async (req, res, next) => {
  try {
    const agendaId = req.params.id;
    const { expiry = 3600 } = req.query; // Default 1 hour
    
    // Check if user can access this agenda
    const agenda = await agendaService.getAgendaById(agendaId);
    if (!['admin', 'superadmin'].includes(req.user.role) && agenda.created_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only download files from your own agenda.'
      });
    }

    const result = await agendaService.getFileDownloadUrl(agendaId, parseInt(expiry));

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});
// @route   POST /api/agenda/:id/send-invitations
// @desc    Send invitations for agenda
// @access  Private
router.post('/:id/send-invitations', authenticate, agendaController.sendInvitations);

module.exports = router;
