const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'agenda_pimpinan',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
  query_timeout: 30000, // Query timeout 30 seconds
  statement_timeout: 30000, // Statement timeout 30 seconds
});

// Test database connection
pool.on('connect', () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Connected to PostgreSQL database');
  }
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;
