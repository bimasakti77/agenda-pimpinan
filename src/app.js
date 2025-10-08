const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { errorHandler } = require('./middleware/errorHandler');
const { notFound } = require('./middleware/notFound');
const { initializeMinio } = require('./config/minio');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const agendaRoutes = require('./routes/agendaRoutes');
const configRoutes = require('./routes/configRoutes');
const pegawaiRoutes = require('./routes/pegawaiRoutes');
const undanganRoutes = require('./routes/undanganRoutes');

const app = express();

// Environment variables with defaults
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info'; // error, warn, info, debug
const CORS_ORIGINS = process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001';
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX) || 100;
const JSON_LIMIT = process.env.JSON_LIMIT || '10mb';

// Parse CORS origins from environment variable
const allowedOrigins = CORS_ORIGINS.split(',').map(origin => origin.trim());

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for preflight requests
    return req.method === 'OPTIONS';
  }
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    console.log('🌐 CORS check for origin:', origin);
    console.log('🌐 Environment:', NODE_ENV);
    console.log('🌐 Allowed origins:', allowedOrigins);
    
    // Allow requests with no origin (like mobile apps or curl requests) in development
    if (!origin && NODE_ENV === 'development') {
      console.log('✅ No origin in development - allowing');
      return callback(null, true);
    }
    
    // Require origin for all requests in production (security)
    if (!origin && NODE_ENV === 'production') {
      console.log('❌ No origin in production - rejecting');
      return callback(new Error('Origin required'));
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('✅ Origin allowed:', origin);
      callback(null, true);
    } else {
      console.log('❌ Origin not allowed:', origin);
      // In development, be more permissive
      if (NODE_ENV === 'development') {
        console.log('🔧 Development mode - allowing anyway');
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

// Handle preflight requests manually
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  console.log('🔍 Preflight request from origin:', origin);
  console.log('🔍 Allowed origins:', allowedOrigins);
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    console.log('✅ Origin allowed:', origin);
  } else {
    console.log('❌ Origin not allowed:', origin);
    // Still send CORS headers for debugging
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Logging configuration based on LOG_LEVEL
const setupLogging = () => {
  switch (LOG_LEVEL.toLowerCase()) {
    case 'error':
      // Only log errors (4xx and 5xx status codes)
      app.use(morgan('combined', {
        skip: (req, res) => res.statusCode < 400
      }));
      break;
    case 'warn':
      // Log warnings and errors (3xx, 4xx, 5xx status codes)
      app.use(morgan('combined', {
        skip: (req, res) => res.statusCode < 300
      }));
      break;
    case 'info':
      // Log all requests with basic info
      app.use(morgan('combined'));
      break;
    case 'debug':
      // Log everything with detailed info (development mode)
      app.use(morgan('dev'));
      break;
    default:
      // Default to info level
      app.use(morgan('combined'));
  }
  
  // Log current configuration
  console.log(`🔧 Logging Level: ${LOG_LEVEL.toUpperCase()}`);
  console.log(`🌍 Environment: ${NODE_ENV.toUpperCase()}`);
};

setupLogging();

// Body parsing middleware
app.use(express.json({ limit: JSON_LIMIT }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoints
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
    port: PORT
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
    port: PORT
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/agenda', agendaRoutes);
app.use('/api/config', configRoutes);
app.use('/api/pegawai', pegawaiRoutes);
app.use('/api/undangan', undanganRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Initialize MinIO
initializeMinio()
  .then(() => {
    console.log('✅ MinIO initialized successfully');
  })
  .catch((error) => {
    console.error('❌ MinIO initialization failed:', error.message);
    console.log('⚠️  Server will continue without MinIO file storage');
  });

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`CORS Origins: ${allowedOrigins.join(', ')}`);
  console.log(`Rate Limit: ${RATE_LIMIT_MAX} requests per ${RATE_LIMIT_WINDOW_MS / 1000 / 60} minutes`);
  console.log(`Server accessible from: http://localhost:${PORT} and http://172.27.9.77:${PORT}`);
});

module.exports = app;
