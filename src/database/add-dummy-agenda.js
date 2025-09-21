const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'agenda_pimpinan',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
});

async function addDummyAgenda() {
  try {
    console.log('Menambahkan data dummy agenda...');
    
    // Get user IDs
    const userResult = await pool.query('SELECT id, role FROM users ORDER BY id');
    const users = userResult.rows;
    const adminUser = users.find(u => u.role === 'admin');
    const regularUser = users.find(u => u.role === 'user');
    
    if (!adminUser || !regularUser) {
      console.log('❌ User admin atau user tidak ditemukan');
      return;
    }
    
    // Clear existing agenda
    await pool.query('DELETE FROM agenda');
    console.log('✅ Data agenda lama dihapus');
    
    // Create dummy agenda data with specific September 2025 dates
    const dummyAgenda = [
      {
        title: 'Rapat Koordinasi Bulanan',
        description: 'Rapat koordinasi untuk membahas progress bulanan dan rencana ke depan',
        date: new Date('2025-09-01'), // 1 September 2025
        start_time: '09:00:00',
        end_time: '11:00:00',
        location: 'Ruang Rapat Utama',
        attendees: ['Manager A', 'Manager B', 'Supervisor C'],
        status: 'completed',
        priority: 'high',
        category: 'Meeting',
        notes: 'Siapkan laporan bulanan',
        created_by: adminUser.id
      },
      {
        title: 'Presentasi Proyek Baru',
        description: 'Presentasi proposal proyek baru kepada stakeholder',
        date: new Date('2025-09-03'), // 3 September 2025
        start_time: '14:00:00',
        end_time: '16:00:00',
        location: 'Auditorium',
        attendees: ['CEO', 'CTO', 'Project Manager'],
        status: 'completed',
        priority: 'high',
        category: 'Presentation',
        notes: 'Siapkan slide presentasi dan demo',
        created_by: regularUser.id
      },
      {
        title: 'Training Karyawan Baru',
        description: 'Program orientasi dan training untuk karyawan baru',
        date: new Date('2025-09-05'), // 5 September 2025
        start_time: '08:00:00',
        end_time: '17:00:00',
        location: 'Training Room',
        attendees: ['HR Manager', 'Department Heads'],
        status: 'completed',
        priority: 'medium',
        category: 'Training',
        notes: 'Siapkan materi training dan sertifikat',
        created_by: adminUser.id
      },
      {
        title: 'Review Kinerja Q3',
        description: 'Review kinerja dan evaluasi hasil Q3',
        date: new Date('2025-09-08'), // 8 September 2025
        start_time: '10:00:00',
        end_time: '12:00:00',
        location: 'Ruang Meeting 1',
        attendees: ['HR Director', 'Department Managers'],
        status: 'completed',
        priority: 'high',
        category: 'Review',
        notes: 'Hasil review sudah dikompilasi',
        created_by: adminUser.id
      },
      {
        title: 'Workshop Digital Marketing',
        description: 'Workshop tentang strategi digital marketing terbaru',
        date: new Date('2025-09-12'), // 12 September 2025
        start_time: '09:00:00',
        end_time: '15:00:00',
        location: 'Conference Hall',
        attendees: ['Marketing Team', 'Sales Team'],
        status: 'completed',
        priority: 'medium',
        category: 'Workshop',
        notes: 'Siapkan laptop dan materi workshop',
        created_by: regularUser.id
      },
      {
        title: 'Rapat Evaluasi Proyek',
        description: 'Evaluasi progress dan kendala proyek yang sedang berjalan',
        date: new Date('2025-09-15'), // 15 September 2025
        start_time: '13:00:00',
        end_time: '15:00:00',
        location: 'Ruang Rapat 2',
        attendees: ['Project Manager', 'Team Leads', 'Stakeholders'],
        status: 'completed',
        priority: 'high',
        category: 'Meeting',
        notes: 'Bawa laporan progress terbaru',
        created_by: adminUser.id
      },
      {
        title: 'Seminar Teknologi Terkini',
        description: 'Seminar tentang perkembangan teknologi terbaru di industri',
        date: new Date('2025-09-18'), // 18 September 2025
        start_time: '08:30:00',
        end_time: '16:30:00',
        location: 'Grand Ballroom',
        attendees: ['IT Team', 'R&D Team', 'Management'],
        status: 'completed',
        priority: 'low',
        category: 'Seminar',
        notes: 'Registrasi peserta sudah ditutup',
        created_by: regularUser.id
      },
      {
        title: 'Rapat Tim Harian',
        description: 'Rapat koordinasi harian untuk membahas tugas dan kendala',
        date: new Date('2025-09-20'), // 20 September 2025 (hari ini)
        start_time: '08:00:00',
        end_time: '08:30:00',
        location: 'Ruang Kerja Tim',
        attendees: ['Team Members'],
        status: 'completed',
        priority: 'low',
        category: 'Daily Meeting',
        notes: 'Rapat berjalan lancar',
        created_by: adminUser.id
      },
      {
        title: 'Rapat Strategis Q4',
        description: 'Rapat perencanaan strategis untuk kuartal keempat',
        date: new Date('2025-09-21'), // 21 September 2025
        start_time: '09:00:00',
        end_time: '12:00:00',
        location: 'Ruang Rapat Utama',
        attendees: ['Direktur', 'Manager Senior', 'Konsultan'],
        status: 'scheduled',
        priority: 'high',
        category: 'Strategic Meeting',
        notes: 'Siapkan data dan analisis Q3',
        created_by: adminUser.id
      },
      {
        title: 'Pelatihan Leadership',
        description: 'Program pelatihan kepemimpinan untuk manajer',
        date: new Date('2025-09-23'), // 23 September 2025
        start_time: '08:00:00',
        end_time: '17:00:00',
        location: 'Training Center',
        attendees: ['Managers', 'Team Leads'],
        status: 'scheduled',
        priority: 'medium',
        category: 'Training',
        notes: 'Materi pelatihan sudah disiapkan',
        created_by: regularUser.id
      },
      {
        title: 'Audit Internal',
        description: 'Audit internal untuk memastikan compliance dan kualitas',
        date: new Date('2025-09-25'), // 25 September 2025
        start_time: '09:00:00',
        end_time: '16:00:00',
        location: 'Ruang Audit',
        attendees: ['Auditor Internal', 'Department Heads'],
        status: 'scheduled',
        priority: 'high',
        category: 'Audit',
        notes: 'Siapkan dokumen yang diperlukan',
        created_by: adminUser.id
      },
      {
        title: 'Rapat Koordinasi Mingguan',
        description: 'Rapat koordinasi mingguan untuk membahas progress dan rencana',
        date: new Date('2025-09-28'), // 28 September 2025
        start_time: '10:00:00',
        end_time: '11:30:00',
        location: 'Ruang Meeting 2',
        attendees: ['Project Managers', 'Team Leads'],
        status: 'scheduled',
        priority: 'medium',
        category: 'Weekly Meeting',
        notes: 'Update progress semua proyek',
        created_by: regularUser.id
      }
    ];
    
    // Insert dummy agenda
    for (const agenda of dummyAgenda) {
      const query = `
        INSERT INTO agenda (
          title, description, date, start_time, end_time, location,
          attendees, status, priority, category, notes, created_by, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      `;
      
      const values = [
        agenda.title,
        agenda.description,
        agenda.date,
        agenda.start_time,
        agenda.end_time,
        agenda.location,
        JSON.stringify(agenda.attendees),
        agenda.status,
        agenda.priority,
        agenda.category,
        agenda.notes,
        agenda.created_by
      ];
      
      await pool.query(query, values);
      console.log(`✅ Agenda ditambahkan: ${agenda.title}`);
    }
    
    console.log(`\n🎉 Berhasil menambahkan ${dummyAgenda.length} data dummy agenda!`);
    
  } catch (error) {
    console.error('❌ Error adding dummy agenda:', error);
  } finally {
    await pool.end();
  }
}

// Run the function
addDummyAgenda();
