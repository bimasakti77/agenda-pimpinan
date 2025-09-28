const pool = require('../config/database');

class Agenda {
  constructor(data) {
    this.id = data.id;
    this.title = data.title;
    this.description = data.description;
    this.date = data.date;
    this.start_time = data.start_time;
    this.end_time = data.end_time;
    this.location = data.location;
    this.status = data.status;
    this.priority = data.priority;
    this.category = data.category;
    this.notes = data.notes;
    this.attendance_status = data.attendance_status;
    this.nomor_surat = data.nomor_surat;
    this.surat_undangan = data.surat_undangan;
    this.created_by = data.created_by;
    this.updated_by = data.updated_by;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create a new agenda
  static async create(agendaData) {
    const {
      title,
      description,
      date,
      start_time,
      end_time,
      location,
      status = 'scheduled',
      priority = 'medium',
      category,
      notes,
      attendance_status,
      nomor_surat,
      surat_undangan,
      undangan = [],
      created_by
    } = agendaData;
    
    const query = `
      INSERT INTO agenda (
        title, description, date, start_time, end_time, location,
        status, priority, category, notes, attendance_status, nomor_surat, surat_undangan, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;
    
    const values = [
      title, description, date, start_time, end_time, location,
      status, priority, category, notes, attendance_status, nomor_surat, surat_undangan, created_by
    ];
    
    const result = await pool.query(query, values);
    const agenda = new Agenda(result.rows[0]);
    
    // Insert undangan if provided
    if (undangan && undangan.length > 0) {
      await Agenda.addUndangan(agenda.id, undangan);
    }
    
    return agenda;
  }

  // Find agenda by ID
  static async findById(id) {
    const query = `
      SELECT a.*, u1.full_name as created_by_name, u2.full_name as updated_by_name
      FROM agenda a
      LEFT JOIN users u1 ON a.created_by = u1.id
      LEFT JOIN users u2 ON a.updated_by = u2.id
      WHERE a.id = $1
    `;
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const agenda = new Agenda(result.rows[0]);
    
    // Get undangan data without JOIN to avoid simpeg_Pegawai issues
    const undanganQuery = `
      SELECT 
        au.id,
        au.pegawai_id,
        au.nama,
        au.kategori,
        au.nip
      FROM agenda_undangan au
      WHERE au.agenda_id = $1
      ORDER BY au.kategori, au.nama
    `;
    const undanganResult = await pool.query(undanganQuery, [id]);
    agenda.undangan = undanganResult.rows;
    
    agenda.created_by_name = result.rows[0].created_by_name;
    agenda.updated_by_name = result.rows[0].updated_by_name;
    return agenda;
  }

  // Get all agenda with pagination and filters
  static async findAll(filters = {}, page = 1, limit = 10) {
    const {
      status,
      priority,
      category,
      date_from,
      date_to,
      created_by,
      search
    } = filters;
    
    const offset = (page - 1) * limit;
    let whereConditions = [];
    let values = [];
    let paramCount = 1;
    
    // Build WHERE conditions
    if (status) {
      whereConditions.push(`a.status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }
    
    if (priority) {
      whereConditions.push(`a.priority = $${paramCount}`);
      values.push(priority);
      paramCount++;
    }
    
    if (category) {
      whereConditions.push(`a.category = $${paramCount}`);
      values.push(category);
      paramCount++;
    }
    
    if (date_from) {
      whereConditions.push(`a.date >= $${paramCount}`);
      values.push(date_from);
      paramCount++;
    }
    
    if (date_to) {
      whereConditions.push(`a.date <= $${paramCount}`);
      values.push(date_to);
      paramCount++;
    }
    
    if (created_by) {
      whereConditions.push(`a.created_by = $${paramCount}`);
      values.push(created_by);
      paramCount++;
    }
    
    if (search) {
      whereConditions.push(`(a.title ILIKE $${paramCount} OR a.description ILIKE $${paramCount})`);
      values.push(`%${search}%`);
      paramCount++;
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    const query = `
      SELECT a.*, u1.full_name as created_by_name, u2.full_name as updated_by_name
      FROM agenda a
      LEFT JOIN users u1 ON a.created_by = u1.id
      LEFT JOIN users u2 ON a.updated_by = u2.id
      ${whereClause}
      ORDER BY a.date DESC, a.start_time DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    
    const countQuery = `
      SELECT COUNT(*) FROM agenda a ${whereClause}
    `;
    
    values.push(limit, offset);
    
    const [agendaResult, countResult] = await Promise.all([
      pool.query(query, values),
      pool.query(countQuery, values.slice(0, -2))
    ]);
    
    const agenda = await Promise.all(agendaResult.rows.map(async (row) => {
      const agendaItem = new Agenda(row);
      
      agendaItem.created_by_name = row.created_by_name;
      agendaItem.updated_by_name = row.updated_by_name;
      
      // Get undangan data for each agenda
      const undanganQuery = `
        SELECT 
          au.id,
          au.pegawai_id,
          au.nama,
          au.kategori,
          au.nip
        FROM agenda_undangan au
        WHERE au.agenda_id = $1
        ORDER BY au.kategori, au.nama
      `;
      const undanganResult = await pool.query(undanganQuery, [row.id]);
      agendaItem.undangan = undanganResult.rows;
      
      // Return as JSON object to ensure all fields are included
      return agendaItem.toJSON();
    }));
    
    const total = parseInt(countResult.rows[0].count);
    
    return {
      agenda,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Update agenda
  async update(updateData, updated_by) {
    const allowedFields = [
      'title', 'description', 'date', 'start_time', 'end_time',
      'location', 'status', 'priority', 'category', 'notes', 'attendance_status',
      'nomor_surat', 'surat_undangan'
    ];
    
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }
    
    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }
    
    updates.push(`updated_by = $${paramCount}`);
    updates.push(`updated_at = NOW()`);
    values.push(updated_by, this.id);
    
    const query = `UPDATE agenda SET ${updates.join(', ')} WHERE id = $${paramCount + 1} RETURNING *`;
    const result = await pool.query(query, values);
    
    // Update current instance
    Object.assign(this, result.rows[0]);
    return this;
  }

  // Delete agenda
  async delete() {
    const query = 'DELETE FROM agenda WHERE id = $1';
    await pool.query(query, [this.id]);
    return true;
  }

  // Get agenda statistics
  static async getStatistics(filters = {}) {
    const { date_from, date_to, created_by } = filters;
    
    let whereConditions = [];
    let values = [];
    let paramCount = 1;
    
    if (date_from) {
      whereConditions.push(`date >= $${paramCount}`);
      values.push(date_from);
      paramCount++;
    }
    
    if (date_to) {
      whereConditions.push(`date <= $${paramCount}`);
      values.push(date_to);
      paramCount++;
    }
    
    if (created_by) {
      whereConditions.push(`created_by = $${paramCount}`);
      values.push(created_by);
      paramCount++;
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
        COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority,
        COUNT(CASE WHEN priority = 'medium' THEN 1 END) as medium_priority,
        COUNT(CASE WHEN priority = 'low' THEN 1 END) as low_priority
      FROM agenda ${whereClause}
    `;
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Get agenda without sensitive data
  toJSON() {
    // Format date to avoid timezone issues
    let formattedDate = this.date;
    if (this.date instanceof Date) {
      // Convert to YYYY-MM-DD format to avoid timezone conversion
      const year = this.date.getFullYear();
      const month = String(this.date.getMonth() + 1).padStart(2, '0');
      const day = String(this.date.getDate()).padStart(2, '0');
      formattedDate = `${year}-${month}-${day}`;
    }
    
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      date: formattedDate,
      start_time: this.start_time,
      end_time: this.end_time,
      location: this.location,
      status: this.status,
      priority: this.priority,
      category: this.category,
      notes: this.notes,
      attendance_status: this.attendance_status,
      nomor_surat: this.nomor_surat,
      surat_undangan: this.surat_undangan,
      created_by: this.created_by,
      updated_by: this.updated_by,
      created_at: this.created_at,
      updated_at: this.updated_at,
      created_by_name: this.created_by_name,
      updated_by_name: this.updated_by_name,
      undangan: this.undangan || []
    };
  }

  // Get monthly statistics for charts
  static async getMonthlyStats(user) {
    let query = `
      SELECT 
        TO_CHAR(DATE_TRUNC('month', date), 'Mon') as month,
        EXTRACT(MONTH FROM DATE_TRUNC('month', date)) as month_num,
        COUNT(*) as agendas,
        COUNT(DISTINCT created_by) as users
      FROM agenda 
      WHERE EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
    `;

    // Add role-based filtering
    if (user.role === 'superadmin' || user.role === 'admin') {
      // Superadmin and Admin see all agenda data (no additional filter)
      query += ` GROUP BY DATE_TRUNC('month', date) ORDER BY DATE_TRUNC('month', date)`;
      var result = await pool.query(query);
    } else {
      // Regular user sees only their own agenda data
      query += ` AND created_by = $1 GROUP BY DATE_TRUNC('month', date) ORDER BY DATE_TRUNC('month', date)`;
      var result = await pool.query(query, [user.id]);
    }
    
    // Create array for all 12 months
    const months = [
      { month: 'Jan', month_num: 1, agendas: 0, users: 0 },
      { month: 'Feb', month_num: 2, agendas: 0, users: 0 },
      { month: 'Mar', month_num: 3, agendas: 0, users: 0 },
      { month: 'Apr', month_num: 4, agendas: 0, users: 0 },
      { month: 'May', month_num: 5, agendas: 0, users: 0 },
      { month: 'Jun', month_num: 6, agendas: 0, users: 0 },
      { month: 'Jul', month_num: 7, agendas: 0, users: 0 },
      { month: 'Aug', month_num: 8, agendas: 0, users: 0 },
      { month: 'Sep', month_num: 9, agendas: 0, users: 0 },
      { month: 'Oct', month_num: 10, agendas: 0, users: 0 },
      { month: 'Nov', month_num: 11, agendas: 0, users: 0 },
      { month: 'Dec', month_num: 12, agendas: 0, users: 0 }
    ];

    // Fill in actual data
    result.rows.forEach(row => {
      const monthIndex = row.month_num - 1;
      if (monthIndex >= 0 && monthIndex < 12) {
        months[monthIndex].agendas = parseInt(row.agendas);
        months[monthIndex].users = parseInt(row.users);
      }
    });

    return months;
  }

  // Get dashboard statistics
  static async getDashboardStats(user) {
    let agendaQuery = `
      SELECT 
        COUNT(*) as total_agendas,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_agendas,
        COUNT(CASE WHEN DATE_TRUNC('month', date) = DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as this_month_agendas
      FROM agenda 
      WHERE date >= DATE_TRUNC('year', CURRENT_DATE)
    `;

    let userQuery = `
      SELECT COUNT(*) as total_users FROM users
    `;

    // Add role-based filtering for agenda stats
    if (user.role === 'superadmin' || user.role === 'admin') {
      var agendaResult = await pool.query(agendaQuery);
    } else {
      agendaQuery += ` AND created_by = $1`;
      var agendaResult = await pool.query(agendaQuery, [user.id]);
    }

    const userResult = await pool.query(userQuery);

    const result = {
      totalAgendas: parseInt(agendaResult.rows[0].total_agendas),
      thisMonthAgendas: parseInt(agendaResult.rows[0].this_month_agendas),
      totalUsers: parseInt(userResult.rows[0].total_users),
      pendingAgendas: parseInt(agendaResult.rows[0].pending_agendas)
    };

    return result;
  }

  // Add undangan to agenda
  static async addUndangan(agendaId, undanganList) {
    if (!undanganList || undanganList.length === 0) {
      return [];
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const insertedUndangan = [];
      
      for (const undangan of undanganList) {
        const { pegawai_id, nama, kategori, nip } = undangan;
        
        const insertQuery = `
          INSERT INTO agenda_undangan (agenda_id, pegawai_id, nama, kategori, nip)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `;
        
        const result = await client.query(insertQuery, [agendaId, pegawai_id, nama, kategori, nip]);
        insertedUndangan.push(result.rows[0]);
      }
      
      await client.query('COMMIT');
      return insertedUndangan;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Update undangan for agenda
  static async updateUndangan(agendaId, undanganList) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Delete existing undangan
      await client.query('DELETE FROM agenda_undangan WHERE agenda_id = $1', [agendaId]);
      
      // Insert new undangan
      if (undanganList && undanganList.length > 0) {
        await Agenda.addUndangan(agendaId, undanganList);
      }
      
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get undangan for agenda
  static async getUndangan(agendaId) {
    const query = `
      SELECT 
        au.id,
        au.pegawai_id,
        au.nama,
        au.kategori,
        au.nip
      FROM agenda_undangan au
      WHERE au.agenda_id = $1
      ORDER BY au.kategori, au.nama
    `;
    
    const result = await pool.query(query, [agendaId]);
    return result.rows;
  }
}

module.exports = Agenda;
