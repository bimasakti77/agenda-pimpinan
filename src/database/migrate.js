const pool = require('../config/database');

const migrations = [
  {
    name: 'create_users_table',
    query: `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin')),
        full_name VARCHAR(100) NOT NULL,
        position VARCHAR(100),
        department VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `
  },
  {
    name: 'create_agenda_table',
    query: `
      CREATE TABLE IF NOT EXISTS agenda (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        date DATE NOT NULL,
        start_time TIME,
        end_time TIME,
        location VARCHAR(200),
        attendees JSONB DEFAULT '[]',
        status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
        priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
        category VARCHAR(50),
        notes TEXT,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `
  },
  {
    name: 'create_indexes',
    query: `
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_agenda_date ON agenda(date);
      CREATE INDEX IF NOT EXISTS idx_agenda_status ON agenda(status);
      CREATE INDEX IF NOT EXISTS idx_agenda_priority ON agenda(priority);
      CREATE INDEX IF NOT EXISTS idx_agenda_created_by ON agenda(created_by);
      CREATE INDEX IF NOT EXISTS idx_agenda_category ON agenda(category);
    `
  },
  {
    name: 'create_updated_at_trigger_function',
    query: `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `
  },
  {
    name: 'create_updated_at_triggers',
    query: `
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
      
      DROP TRIGGER IF EXISTS update_agenda_updated_at ON agenda;
      CREATE TRIGGER update_agenda_updated_at
        BEFORE UPDATE ON agenda
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `
  }
];

async function runMigrations() {
  try {
    console.log('Starting database migrations...');
    
    // Create migrations table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Get executed migrations
    const executedMigrations = await pool.query('SELECT name FROM migrations');
    const executedNames = executedMigrations.rows.map(row => row.name);
    
    // Run pending migrations
    for (const migration of migrations) {
      if (!executedNames.includes(migration.name)) {
        console.log(`Running migration: ${migration.name}`);
        await pool.query(migration.query);
        await pool.query('INSERT INTO migrations (name) VALUES ($1)', [migration.name]);
        console.log(`✓ Migration ${migration.name} completed`);
      } else {
        console.log(`- Migration ${migration.name} already executed`);
      }
    }
    
    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
