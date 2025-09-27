// Load environment variables
require('dotenv').config();

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Function to get password from user input
function getPasswordFromInput() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('🔐 Enter PostgreSQL password: ', (password) => {
      rl.close();
      resolve(password);
    });
  });
}

// Function to create database pool with custom config
function createDatabasePool(customConfig = {}) {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'agenda_pimpinan',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'admin',
    ...customConfig
  };
  
  console.log(`🔗 Connecting to database: ${config.host}:${config.port}/${config.database} as user: ${config.user}`);
  return new Pool(config);
}

async function runMigrations() {
  let pool;
  let client;
  
  try {
    // Try to create pool with environment variables first
    pool = createDatabasePool();
    client = await pool.connect();
    
    console.log('🚀 Starting database migrations...');
    
    // Test database connection first
    await client.query('SELECT 1');
    console.log('✅ Database connection successful');
    
    // Run the migration process
    await runMigrationProcess(client);
    
  } catch (error) {
    // If connection failed, try with manual password input
    if (error.message.includes('password authentication failed') || 
        error.message.includes('authentication failed')) {
      
      console.log('⚠️  Database authentication failed with environment variables');
      console.log('🔐 Please enter database credentials manually:');
      
      try {
        // Close existing connection if any
        if (client) {
          client.release();
        }
        if (pool) {
          await pool.end();
        }
        
        // Get password from user input
        const password = await getPasswordFromInput();
        
        // Create new pool with manual password
        pool = createDatabasePool({ password });
        client = await pool.connect();
        
        console.log('✅ Database connection successful with manual password');
        
        // Continue with migration process
        await runMigrationProcess(client);
        
      } catch (manualError) {
        console.error('❌ Manual authentication also failed:', manualError.message);
        throw manualError;
      }
    } else {
      console.error('❌ Migration failed:', error.message);
      console.error('🔍 Error details:', error);
      throw error;
    }
  } finally {
    if (client) {
      client.release();
    }
    if (pool) {
      await pool.end();
    }
  }
}

// Separate function for the actual migration process
async function runMigrationProcess(client) {
  try {
    // Create migrations table if it doesn't exist
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          filename VARCHAR(255) NOT NULL UNIQUE,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ Migrations table ready');
    } catch (error) {
      console.log('⚠️  Could not create migrations table:', error.message);
      // Continue without migrations table tracking
    }
    
    // Get list of migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      console.log('📁 Creating migrations directory...');
      fs.mkdirSync(migrationsDir, { recursive: true });
    }
    
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    if (migrationFiles.length === 0) {
      console.log('⚠️  No migration files found in migrations directory');
      return;
    }
    
    console.log(`📋 Found ${migrationFiles.length} migration files`);
    
    // Get already executed migrations
    let executedFilenames = [];
    try {
      const executedMigrations = await client.query(`
        SELECT filename FROM migrations ORDER BY executed_at
      `);
      executedFilenames = executedMigrations.rows.map(row => row.filename);
      console.log(`📝 Found ${executedFilenames.length} previously executed migrations`);
    } catch (error) {
      console.log('📝 No migrations table found or error reading it, will run all migrations');
      executedFilenames = [];
    }
    
    // Run pending migrations
    let executedCount = 0;
    
    for (const filename of migrationFiles) {
      if (executedFilenames.includes(filename)) {
        console.log(`⏭️  Skipping ${filename} (already executed)`);
        continue;
      }
      
      console.log(`🔄 Executing migration: ${filename}`);
      
      const migrationPath = path.join(migrationsDir, filename);
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      // Execute migration with better error handling
      try {
        await client.query(migrationSQL);
        console.log(`✅ Migration ${filename} executed successfully`);
        
        // Record migration as executed
        try {
          await client.query(`
            INSERT INTO migrations (filename) VALUES ($1)
          `, [filename]);
          console.log(`📝 Recorded ${filename} in migrations table`);
        } catch (recordError) {
          console.log(`⚠️  Could not record migration ${filename} in migrations table: ${recordError.message}`);
          // Continue even if recording fails
        }
        
        executedCount++;
      } catch (migrationError) {
        // Check if it's a "column already exists" error
        if (migrationError.message.includes('already exists') || 
            migrationError.message.includes('sudah ada')) {
          console.log(`⚠️  Migration ${filename} skipped - columns already exist`);
          
          // Still try to record it as executed to avoid future attempts
          try {
            await client.query(`
              INSERT INTO migrations (filename) VALUES ($1)
            `, [filename]);
            console.log(`📝 Recorded ${filename} as already executed`);
          } catch (recordError) {
            console.log(`⚠️  Could not record migration ${filename}: ${recordError.message}`);
          }
          
          executedCount++;
        } else {
          console.error(`❌ Migration ${filename} failed: ${migrationError.message}`);
          throw migrationError;
        }
      }
    }
    
    if (executedCount === 0) {
      console.log('✅ All migrations are up to date');
    } else {
      console.log(`🎉 Successfully executed ${executedCount} migrations`);
    }
    
  } catch (error) {
    console.error('❌ Migration process failed:', error.message);
    throw error;
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('🎉 Migration process completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration process failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigrations };