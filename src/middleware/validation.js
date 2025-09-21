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
    username: Joi.string().alphanum().min(3).max(30).optional(),
    email: Joi.string().email().optional(),
    full_name: Joi.string().min(2).max(100).optional(),
    position: Joi.string().max(100).optional(),
    department: Joi.string().max(100).optional(),
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
    date: Joi.date().required(),
    start_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    end_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    location: Joi.string().max(200).optional(),
    attendees: Joi.array().items(Joi.string()).optional(),
    status: Joi.string().valid('scheduled', 'in_progress', 'completed', 'cancelled').optional(),
    priority: Joi.string().valid('low', 'medium', 'high').optional(),
    category: Joi.string().max(50).optional(),
    notes: Joi.string().max(1000).optional()
  }),

  updateAgenda: Joi.object({
    title: Joi.string().min(3).max(200).optional(),
    description: Joi.string().max(1000).optional(),
    date: Joi.date().optional(),
    start_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    end_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    location: Joi.string().max(200).optional(),
    attendees: Joi.array().items(Joi.string()).optional(),
    status: Joi.string().valid('scheduled', 'in_progress', 'completed', 'cancelled').optional(),
    priority: Joi.string().valid('low', 'medium', 'high').optional(),
    category: Joi.string().max(50).optional(),
    notes: Joi.string().max(1000).optional()
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

  userFilters: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    role: Joi.string().valid('user', 'admin', 'superadmin').optional(),
    search: Joi.string().max(100).optional()
  })
};

module.exports = {
  validate,
  schemas
};
