const Joi = require('joi');

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    next();
  };
};

// Validation schemas
const schemas = {
  // User validation schemas
  register: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    full_name: Joi.string().min(2).max(100).required(),
    position: Joi.string().max(100).optional(),
    department: Joi.string().max(100).optional()
  }),

  login: Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required()
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required()
  }),

  updateProfile: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).optional(),
    email: Joi.string().email().optional(),
    full_name: Joi.string().min(2).max(100).optional(),
    position: Joi.string().max(100).optional(),
    department: Joi.string().max(100).optional()
  }),

  updateUser: Joi.object({
    full_name: Joi.string().min(2).max(100).optional(),
    role: Joi.string().valid('user', 'admin', 'superadmin').optional(),
    is_active: Joi.boolean().optional()
  }),

  resetPassword: Joi.object({
    newPassword: Joi.string().min(6).required()
  }),

  // Agenda validation schemas
  createAgenda: Joi.object({
    title: Joi.string().min(3).max(200).required(),
    description: Joi.string().max(1000).optional(),
    date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
    start_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    end_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    location: Joi.string().max(200).optional(),
    status: Joi.string().valid('scheduled', 'in_progress', 'completed', 'cancelled').optional(),
    priority: Joi.string().valid('low', 'medium', 'high').optional(),
    category: Joi.string().max(50).optional(),
    notes: Joi.string().max(1000).optional(),
    attendance_status: Joi.string().valid('attending', 'not_attending', 'represented').optional(),
    nomor_surat: Joi.string().max(100).required(),
    surat_undangan: Joi.string().max(2000).required(),
    undangan: Joi.array().items(
      Joi.object({
        pegawai_id: Joi.string().allow(null), // NIP from simpeg_Pegawai table
        nama: Joi.string().min(1).max(255).required(),
        kategori: Joi.string().valid('internal', 'eksternal').required(),
        nip: Joi.string().allow(null), // NIP from simpeg_Pegawai
        // Allow additional fields that might be sent from frontend
        pegawai_jabatan: Joi.string().optional(),
        pegawai_nama: Joi.string().optional()
      }).custom((value, helpers) => {
        // Custom validation for undangan
        if (value.kategori === 'internal' && !value.pegawai_id) {
          return helpers.error('any.invalid', { message: 'pegawai_id is required for internal kategori' });
        }
        if (value.kategori === 'eksternal' && value.pegawai_id) {
          return helpers.error('any.invalid', { message: 'pegawai_id should be null for eksternal kategori' });
        }
        return value;
      })
    ).min(1).required().custom((value, helpers) => {
      // Check for duplicates
      const seen = new Set();
      for (const item of value) {
        const key = item.kategori === 'internal' ? `internal_${item.pegawai_id}` : `eksternal_${item.nama}`;
        if (seen.has(key)) {
          return helpers.error('any.invalid', { message: 'Duplicate undangan found' });
        }
        seen.add(key);
      }
      return value;
    })
  }),

  updateAgenda: Joi.object({
    title: Joi.string().min(3).max(200).optional(),
    description: Joi.string().max(1000).optional(),
    date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
    start_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    end_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    location: Joi.string().max(200).optional(),
    status: Joi.string().valid('scheduled', 'in_progress', 'completed', 'cancelled').optional(),
    priority: Joi.string().valid('low', 'medium', 'high').optional(),
    category: Joi.string().max(50).optional(),
    notes: Joi.string().max(1000).optional(),
    attendance_status: Joi.string().valid('attending', 'not_attending', 'represented').optional(),
    nomor_surat: Joi.string().max(100).optional(),
    surat_undangan: Joi.string().max(2000).optional(),
    undangan: Joi.array().items(
      Joi.object({
        pegawai_id: Joi.string().allow(null), // NIP from simpeg_Pegawai table
        nama: Joi.string().min(1).max(255).required(),
        kategori: Joi.string().valid('internal', 'eksternal').required(),
        nip: Joi.string().allow(null), // NIP from simpeg_Pegawai
        // Allow additional fields that might be sent from frontend
        pegawai_jabatan: Joi.string().optional(),
        pegawai_nama: Joi.string().optional()
      }).custom((value, helpers) => {
        // Custom validation for undangan
        if (value.kategori === 'internal' && !value.pegawai_id) {
          return helpers.error('any.invalid', { message: 'pegawai_id is required for internal kategori' });
        }
        if (value.kategori === 'eksternal' && value.pegawai_id) {
          return helpers.error('any.invalid', { message: 'pegawai_id should be null for eksternal kategori' });
        }
        return value;
      })
    ).min(1).optional().custom((value, helpers) => {
      if (!value || value.length === 0) return value;
      // Check for duplicates
      const seen = new Set();
      for (const item of value) {
        const key = item.kategori === 'internal' ? `internal_${item.pegawai_id}` : `eksternal_${item.nama}`;
        if (seen.has(key)) {
          return helpers.error('any.invalid', { message: 'Duplicate undangan found' });
        }
        seen.add(key);
      }
      return value;
    })
  }),

  // Query validation schemas
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
  }),

  agendaFilters: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    status: Joi.string().valid('scheduled', 'in_progress', 'completed', 'cancelled').optional(),
    priority: Joi.string().valid('low', 'medium', 'high').optional(),
    category: Joi.string().max(50).optional(),
    date_from: Joi.date().optional(),
    date_to: Joi.date().optional(),
    created_by: Joi.number().integer().optional(),
    search: Joi.string().max(100).optional()
  }),

  createUser: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    full_name: Joi.string().min(2).max(100).required(),
    position: Joi.string().max(100).optional(),
    department: Joi.string().max(100).optional(),
    role: Joi.string().valid('user', 'admin', 'superadmin').default('user'),
    nip: Joi.string().pattern(/^\d{18}$/).optional()
  }),

  userFilters: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    role: Joi.string().valid('user', 'admin', 'superadmin').optional(),
    is_active: Joi.boolean().optional(),
    search: Joi.string().max(100).optional()
  })
};

module.exports = {
  validate,
  schemas
};
