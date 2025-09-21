const pool = require('../config/database');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');
    
    // Check if users already exist
    const existingUsers = await pool.query('SELECT COUNT(*) FROM users');
    if (parseInt(existingUsers.rows[0].count) > 0) {
      console.log('Database already has users. Skipping seed.');
      return;
    }
    
    // Create default users
    const defaultUsers = [
      {
        username: 'superadmin',
        email: 'superadmin@agenda.com',
        password: 'superadmin123',
        role: 'superadmin',
        full_name: 'GM',
        position: 'General Manager',
        department: 'Management'
      },
      {
        username: 'admin',
        email: 'admin@agenda.com',
        password: 'admin123',
        role: 'admin',
        full_name: 'Administrator',
        position: 'Administrator',
        department: 'Management'
      },
      {
        username: 'user1',
        email: 'user1@agenda.com',
        password: 'user123',
        role: 'user',
        full_name: 'Pejabat Eselon',
        position: 'Pejabat Eselon',
        department: 'Operations'
      },
      {
        username: 'user2',
        email: 'user2@agenda.com',
        password: 'user123',
        role: 'user',
        full_name: 'Pejabat Eselon 2',
        position: 'Pejabat Eselon',
        department: 'HR'
      }
    ];
    
    // Insert users
    for (const userData of defaultUsers) {
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
      
      await pool.query(`
        INSERT INTO users (username, email, password, role, full_name, position, department)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        userData.username,
        userData.email,
        hashedPassword,
        userData.role,
        userData.full_name,
        userData.position,
        userData.department
      ]);
      
      console.log(`✓ Created user: ${userData.username}`);
    }
    
    // Get user IDs for agenda creation
    const userResult = await pool.query('SELECT id, role FROM users');
    const userRows = userResult.rows;
    const adminUser = userRows.find(u => u.role === 'admin');
    const regularUser = userRows.find(u => u.role === 'user');
    
    // Create sample agenda
    const sampleAgenda = [
      {
        title: 'Rapat Koordinasi Bulanan',
        description: 'Rapat koordinasi untuk membahas progress bulanan dan rencana ke depan',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        start_time: '09:00:00',
        end_time: '11:00:00',
        location: 'Ruang Rapat Utama',
        attendees: ['Manager A', 'Manager B', 'Supervisor C'],
        status: 'scheduled',
        priority: 'high',
        category: 'Meeting',
        notes: 'Siapkan laporan bulanan',
        created_by: adminUser.id
      },
      {
        title: 'Presentasi Proyek Baru',
        description: 'Presentasi proposal proyek baru kepada stakeholder',
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        start_time: '14:00:00',
        end_time: '16:00:00',
        location: 'Auditorium',
        attendees: ['CEO', 'CTO', 'Project Manager'],
        status: 'scheduled',
        priority: 'high',
        category: 'Presentation',
        notes: 'Siapkan slide presentasi dan demo',
        created_by: regularUser.id
      },
      {
        title: 'Training Karyawan Baru',
        description: 'Program orientasi dan training untuk karyawan baru',
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        start_time: '08:00:00',
        end_time: '17:00:00',
        location: 'Training Room',
        attendees: ['HR Manager', 'Department Heads'],
        status: 'scheduled',
        priority: 'medium',
        category: 'Training',
        notes: 'Siapkan materi training dan sertifikat',
        created_by: adminUser.id
      },
      {
        title: 'Review Kinerja Q1',
        description: 'Review kinerja dan evaluasi hasil Q1',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        start_time: '10:00:00',
        end_time: '12:00:00',
        location: 'Conference Room',
        attendees: ['All Managers'],
        status: 'completed',
        priority: 'high',
        category: 'Review',
        notes: 'Hasil review sudah didokumentasikan',
        created_by: adminUser.id
      }
    ];
    
    // Insert sample agenda
    for (const agendaData of sampleAgenda) {
      await pool.query(`
        INSERT INTO agenda (
          title, description, date, start_time, end_time, location,
          attendees, status, priority, category, notes, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        agendaData.title,
        agendaData.description,
        agendaData.date,
        agendaData.start_time,
        agendaData.end_time,
        agendaData.location,
        JSON.stringify(agendaData.attendees),
        agendaData.status,
        agendaData.priority,
        agendaData.category,
        agendaData.notes,
        agendaData.created_by
      ]);
      
      console.log(`✓ Created agenda: ${agendaData.title}`);
    }
    
    console.log('Database seeding completed successfully!');
    console.log('\nDefault login credentials:');
    console.log('Super Admin: superadmin@agenda.com / superadmin123');
    console.log('Admin: admin@agenda.com / admin123');
    console.log('User: user1@agenda.com / user123');
    
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
