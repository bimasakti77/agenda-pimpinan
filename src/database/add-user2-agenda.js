const pool = require('../config/database');
const bcrypt = require('bcryptjs');

async function addUser2Agenda() {
  try {
    console.log('Adding agenda data for user2 (Pejabat Eselon 2)...');
    
    // Get user2 ID
    const userResult = await pool.query('SELECT id FROM users WHERE username = $1', ['user2']);
    if (userResult.rows.length === 0) {
      console.log('User2 not found. Please run seed first.');
      return;
    }
    const user2Id = userResult.rows[0].id;
    console.log(`User2 ID: ${user2Id}`);
    
    // Dummy agenda data for user2 (Pejabat Eselon 2)
    const user2Agenda = [
      {
        title: 'Rapat Koordinasi HR',
        description: 'Rapat koordinasi departemen HR untuk membahas kebijakan karyawan dan pengembangan SDM',
        date: new Date('2025-09-02'),
        start_time: '10:00:00',
        end_time: '12:00:00',
        location: 'Ruang HR',
        attendees: ['HR Team', 'Manager HR', 'Staff HR'],
        status: 'scheduled',
        priority: 'high',
        category: 'HR Meeting',
        notes: 'Siapkan laporan kinerja karyawan',
        created_by: user2Id
      },
      {
        title: 'Training Karyawan Baru',
        description: 'Program orientasi dan training untuk karyawan baru di departemen HR',
        date: new Date('2025-09-04'),
        start_time: '09:00:00',
        end_time: '16:00:00',
        location: 'Training Room',
        attendees: ['Karyawan Baru', 'HR Trainer', 'Supervisor'],
        status: 'scheduled',
        priority: 'medium',
        category: 'Training',
        notes: 'Siapkan materi training dan sertifikat',
        created_by: user2Id
      },
      {
        title: 'Evaluasi Kinerja Q3',
        description: 'Sesi evaluasi kinerja karyawan untuk kuartal ketiga',
        date: new Date('2025-09-06'),
        start_time: '14:00:00',
        end_time: '17:00:00',
        location: 'Ruang Meeting HR',
        attendees: ['Manager', 'Supervisor', 'HR Team'],
        status: 'scheduled',
        priority: 'high',
        category: 'Performance Review',
        notes: 'Siapkan form evaluasi dan data kinerja',
        created_by: user2Id
      },
      {
        title: 'Rapat Budget HR',
        description: 'Rapat perencanaan budget departemen HR untuk tahun depan',
        date: new Date('2025-09-09'),
        start_time: '11:00:00',
        end_time: '13:00:00',
        location: 'Ruang Rapat Utama',
        attendees: ['HR Manager', 'Finance Team', 'Director'],
        status: 'scheduled',
        priority: 'high',
        category: 'Budget Planning',
        notes: 'Siapkan proposal budget dan justifikasi',
        created_by: user2Id
      },
      {
        title: 'Workshop Employee Engagement',
        description: 'Workshop untuk meningkatkan engagement dan motivasi karyawan',
        date: new Date('2025-09-11'),
        start_time: '08:30:00',
        end_time: '15:30:00',
        location: 'Auditorium',
        attendees: ['All Employees', 'HR Team', 'External Trainer'],
        status: 'scheduled',
        priority: 'medium',
        category: 'Workshop',
        notes: 'Siapkan venue dan catering',
        created_by: user2Id
      },
      {
        title: 'Rapat Kebijakan Karyawan',
        description: 'Review dan update kebijakan perusahaan terkait karyawan',
        date: new Date('2025-09-13'),
        start_time: '15:00:00',
        end_time: '17:00:00',
        location: 'Ruang HR',
        attendees: ['HR Team', 'Legal Team', 'Management'],
        status: 'scheduled',
        priority: 'high',
        category: 'Policy Review',
        notes: 'Siapkan draft kebijakan terbaru',
        created_by: user2Id
      },
      {
        title: 'Recruitment Planning',
        description: 'Perencanaan rekrutmen untuk posisi yang dibutuhkan',
        date: new Date('2025-09-16'),
        start_time: '10:00:00',
        end_time: '12:00:00',
        location: 'Ruang Meeting HR',
        attendees: ['HR Team', 'Department Heads'],
        status: 'scheduled',
        priority: 'medium',
        category: 'Recruitment',
        notes: 'Siapkan job description dan requirements',
        created_by: user2Id
      },
      {
        title: 'Employee Satisfaction Survey',
        description: 'Peluncuran survey kepuasan karyawan dan analisis hasil',
        date: new Date('2025-09-19'),
        start_time: '09:00:00',
        end_time: '11:00:00',
        location: 'Ruang HR',
        attendees: ['HR Team', 'IT Support'],
        status: 'scheduled',
        priority: 'medium',
        category: 'Survey',
        notes: 'Siapkan platform survey dan komunikasi',
        created_by: user2Id
      },
      {
        title: 'Rapat Tim HR Harian',
        description: 'Rapat koordinasi harian tim HR untuk update progress',
        date: new Date('2025-09-22'),
        start_time: '08:00:00',
        end_time: '08:30:00',
        location: 'Ruang HR',
        attendees: ['HR Team'],
        status: 'scheduled',
        priority: 'low',
        category: 'Daily Meeting',
        notes: 'Update progress dan koordinasi tugas',
        created_by: user2Id
      },
      {
        title: 'Performance Appraisal Training',
        description: 'Training untuk supervisor dalam melakukan penilaian kinerja',
        date: new Date('2025-09-24'),
        start_time: '13:00:00',
        end_time: '16:00:00',
        location: 'Training Room',
        attendees: ['Supervisors', 'HR Team'],
        status: 'scheduled',
        priority: 'high',
        category: 'Training',
        notes: 'Siapkan materi training dan case study',
        created_by: user2Id
      },
      {
        title: 'Rapat Koordinasi Bulanan HR',
        description: 'Rapat koordinasi bulanan departemen HR dengan management',
        date: new Date('2025-09-26'),
        start_time: '14:00:00',
        end_time: '16:00:00',
        location: 'Ruang Rapat Utama',
        attendees: ['HR Manager', 'Management', 'HR Team'],
        status: 'scheduled',
        priority: 'high',
        category: 'Monthly Meeting',
        notes: 'Siapkan laporan bulanan dan action plan',
        created_by: user2Id
      },
      {
        title: 'Employee Wellness Program',
        description: 'Program kesehatan dan kesejahteraan karyawan',
        date: new Date('2025-09-29'),
        start_time: '10:00:00',
        end_time: '14:00:00',
        location: 'Company Hall',
        attendees: ['All Employees', 'HR Team', 'Health Provider'],
        status: 'scheduled',
        priority: 'medium',
        category: 'Wellness Program',
        notes: 'Siapkan booth dan materi kesehatan',
        created_by: user2Id
      }
    ];
    
    // Insert agenda data
    for (const agenda of user2Agenda) {
      const query = `
        INSERT INTO agenda (
          title, description, date, start_time, end_time, location,
          attendees, status, priority, category, notes, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id
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
      
      const result = await pool.query(query, values);
      console.log(`Added agenda: ${agenda.title} (ID: ${result.rows[0].id})`);
    }
    
    console.log(`Successfully added ${user2Agenda.length} agenda items for user2 (Pejabat Eselon 2)`);
    
  } catch (error) {
    console.error('Error adding user2 agenda:', error);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  addUser2Agenda();
}

module.exports = addUser2Agenda;
