const pool = require('../config/database');
const bcrypt = require('bcryptjs');

// Dummy users data
const dummyUsers = [
  {
    username: 'user001',
    email: 'user001@example.com',
    full_name: 'Ahmad Wijaya',
    position: 'Staff Administrasi',
    department: 'Bagian Umum',
    role: 'user',
    is_active: false
  },
  {
    username: 'user002',
    email: 'user002@example.com',
    full_name: 'Siti Nurhaliza',
    position: 'Staff Keuangan',
    department: 'Bagian Keuangan',
    role: 'user',
    is_active: false
  },
  {
    username: 'user003',
    email: 'user003@example.com',
    full_name: 'Budi Santoso',
    position: 'Staff IT',
    department: 'Bagian Teknologi Informasi',
    role: 'user',
    is_active: false
  },
  {
    username: 'user004',
    email: 'user004@example.com',
    full_name: 'Dewi Kartika',
    position: 'Staff HRD',
    department: 'Bagian Sumber Daya Manusia',
    role: 'user',
    is_active: false
  },
  {
    username: 'user005',
    email: 'user005@example.com',
    full_name: 'Rizki Pratama',
    position: 'Staff Legal',
    department: 'Bagian Hukum',
    role: 'user',
    is_active: false
  },
  {
    username: 'user006',
    email: 'user006@example.com',
    full_name: 'Maya Sari',
    position: 'Staff Sekretariat',
    department: 'Bagian Sekretariat',
    role: 'user',
    is_active: false
  },
  {
    username: 'user007',
    email: 'user007@example.com',
    full_name: 'Fajar Nugroho',
    position: 'Staff Perencanaan',
    department: 'Bagian Perencanaan',
    role: 'user',
    is_active: false
  },
  {
    username: 'user008',
    email: 'user008@example.com',
    full_name: 'Indah Permata',
    position: 'Staff Pengawasan',
    department: 'Bagian Pengawasan',
    role: 'user',
    is_active: false
  },
  {
    username: 'user009',
    email: 'user009@example.com',
    full_name: 'Agus Setiawan',
    position: 'Staff Pelayanan',
    department: 'Bagian Pelayanan Masyarakat',
    role: 'user',
    is_active: false
  },
  {
    username: 'user010',
    email: 'user010@example.com',
    full_name: 'Rina Wulandari',
    position: 'Staff Dokumentasi',
    department: 'Bagian Dokumentasi',
    role: 'user',
    is_active: false
  }
];

async function addDummyUsers() {
  try {
    console.log('🚀 Starting to add dummy users...');
    
    // Hash password for all users (default password: "password123")
    const saltRounds = 12;
    const defaultPassword = 'password123';
    const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const userData of dummyUsers) {
      try {
        // Check if user already exists
        const existingUser = await pool.query(
          'SELECT id FROM users WHERE username = $1 OR email = $2',
          [userData.username, userData.email]
        );
        
        if (existingUser.rows.length > 0) {
          console.log(`⚠️  User ${userData.username} already exists, skipping...`);
          continue;
        }
        
        // Insert new user
        const query = `
          INSERT INTO users (username, email, password, full_name, position, department, role, is_active, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
          RETURNING id, username, full_name, role, is_active
        `;
        
        const values = [
          userData.username,
          userData.email,
          hashedPassword,
          userData.full_name,
          userData.position,
          userData.department,
          userData.role,
          userData.is_active
        ];
        
        const result = await pool.query(query, values);
        const newUser = result.rows[0];
        
        console.log(`✅ Added user: ${newUser.full_name} (${newUser.username}) - Role: ${newUser.role}, Status: ${newUser.is_active ? 'Active' : 'Inactive'}`);
        successCount++;
        
      } catch (error) {
        console.error(`❌ Error adding user ${userData.username}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`✅ Successfully added: ${successCount} users`);
    console.log(`❌ Errors: ${errorCount} users`);
    console.log(`📝 Total processed: ${dummyUsers.length} users`);
    
    // Show all users with role 'user' and inactive status
    console.log('\n👥 Current inactive users:');
    const inactiveUsers = await pool.query(
      'SELECT id, username, full_name, role, is_active FROM users WHERE role = $1 AND is_active = $2 ORDER BY created_at DESC',
      ['user', false]
    );
    
    if (inactiveUsers.rows.length > 0) {
      inactiveUsers.rows.forEach(user => {
        console.log(`   - ${user.full_name} (${user.username}) - Status: ${user.is_active ? 'Active' : 'Inactive'}`);
      });
    } else {
      console.log('   No inactive users found.');
    }
    
  } catch (error) {
    console.error('❌ Error in addDummyUsers:', error);
  } finally {
    await pool.end();
    console.log('\n🔚 Database connection closed.');
  }
}

// Run the script
if (require.main === module) {
  addDummyUsers();
}

module.exports = addDummyUsers;
