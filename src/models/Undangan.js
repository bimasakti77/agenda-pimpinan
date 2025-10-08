const pool = require('../config/database');

class Undangan {
  constructor(data) {
    this.id = data.id;
    this.agenda_id = data.agenda_id;
    this.user_id = data.user_id;
    this.status = data.status;
    this.delegated_to_user_id = data.delegated_to_user_id;
    this.delegated_to_pegawai_id = data.delegated_to_pegawai_id;
    this.delegated_to_nama = data.delegated_to_nama;
    this.notes = data.notes;
    this.created_at = data.created_at;
    this.opened_at = data.opened_at;
    this.responded_at = data.responded_at;
  }

  // Create a new undangan
  static async create(undanganData) {
    const {
      agenda_id,
      user_id,
      status = 'new',
      delegated_to_user_id = null,
      delegated_to_pegawai_id = null,
      delegated_to_nama = null,
      notes = null
    } = undanganData;
    
    const query = `
      INSERT INTO undangan (
        agenda_id, user_id, status, delegated_to_user_id, 
        delegated_to_pegawai_id, delegated_to_nama, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [
      agenda_id, user_id, status, delegated_to_user_id,
      delegated_to_pegawai_id, delegated_to_nama, notes
    ];
    
    const result = await pool.query(query, values);
    return new Undangan(result.rows[0]);
  }

  // Find undangan by ID
  static async findById(id) {
    const query = `
      SELECT 
        u.*,
        a.title as agenda_judul,
        a.date as agenda_tanggal,
        a.start_time as agenda_waktu_mulai,
        a.end_time as agenda_waktu_selesai,
        a.location as agenda_lokasi,
        creator.username as created_by_username,
        delegated_user.username as delegated_to_username
      FROM undangan u
      JOIN agenda a ON u.agenda_id = a.id
      JOIN users creator ON a.created_by = creator.id
      LEFT JOIN users delegated_user ON u.delegated_to_user_id = delegated_user.id
      WHERE u.id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new Undangan(result.rows[0]);
  }

  // Get undangan by user ID
  static async findByUserId(userId, filters = {}, page = 1, limit = 10) {
    let query = `
      SELECT 
        u.*,
        a.title as agenda_judul,
        a.date as agenda_tanggal,
        a.start_time as agenda_waktu_mulai,
        a.end_time as agenda_waktu_selesai,
        a.location as agenda_lokasi,
        creator.username as created_by_username,
        delegated_user.username as delegated_to_username
      FROM undangan u
      JOIN agenda a ON u.agenda_id = a.id
      JOIN users creator ON a.created_by = creator.id
      LEFT JOIN users delegated_user ON u.delegated_to_user_id = delegated_user.id
      WHERE u.user_id = $1
    `;
    
    const params = [userId];
    let paramCount = 1;
    
    // Add status filter
    if (filters.status) {
      paramCount++;
      query += ` AND u.status = $${paramCount}`;
      params.push(filters.status);
    }
    
    query += ` ORDER BY u.created_at DESC`;
    
    // Add pagination
    const offset = (page - 1) * limit;
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(limit);
    
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);
    
    const result = await pool.query(query, params);
    
    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM undangan u
      WHERE u.user_id = $1
    `;
    const countParams = [userId];
    
    if (filters.status) {
      countQuery += ` AND u.status = $2`;
      countParams.push(filters.status);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);
    
    return {
      undangan: result.rows.map(row => new Undangan(row)),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get undangan by agenda ID
  static async findByAgendaId(agendaId) {
    const query = `
      SELECT 
        u.*,
        usr.username,
        usr.email,
        delegated_user.username as delegated_to_username
      FROM undangan u
      JOIN users usr ON u.user_id = usr.id
      LEFT JOIN users delegated_user ON u.delegated_to_user_id = delegated_user.id
      WHERE u.agenda_id = $1
      ORDER BY u.created_at ASC
    `;
    
    const result = await pool.query(query, [agendaId]);
    return result.rows.map(row => new Undangan(row));
  }

  // Update undangan status
  async updateStatus(status, userId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if user owns this undangan
      const checkQuery = 'SELECT * FROM undangan WHERE id = $1 AND user_id = $2';
      const checkResult = await client.query(checkQuery, [this.id, userId]);
      
      if (checkResult.rows.length === 0) {
        throw new Error('Undangan tidak ditemukan atau tidak memiliki akses');
      }
      
      const undangan = checkResult.rows[0];
      
      // Update status
      let updateQuery = 'UPDATE undangan SET status = $1';
      const params = [status];
      let paramCount = 1;
      
      // Set timestamp based on status
      if (status === 'opened' && !undangan.opened_at) {
        paramCount++;
        updateQuery += `, opened_at = NOW()`;
      } else if (status === 'responded' && !undangan.responded_at) {
        paramCount++;
        updateQuery += `, responded_at = NOW()`;
      }
      
      paramCount++;
      updateQuery += ` WHERE id = $${paramCount}`;
      params.push(this.id);
      
      await client.query(updateQuery, params);
      
      // Get updated undangan
      const result = await client.query('SELECT * FROM undangan WHERE id = $1', [this.id]);
      
      await client.query('COMMIT');
      
      // Update current instance
      Object.assign(this, result.rows[0]);
      return this;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Delegate undangan
  async delegate(delegationData, userId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if user owns this undangan
      const checkQuery = 'SELECT * FROM undangan WHERE id = $1 AND user_id = $2';
      const checkResult = await client.query(checkQuery, [this.id, userId]);
      
      if (checkResult.rows.length === 0) {
        throw new Error('Undangan tidak ditemukan atau tidak memiliki akses');
      }
      
      const undangan = checkResult.rows[0];
      
      // Check if already delegated
      if (undangan.delegated_to_user_id || undangan.delegated_to_pegawai_id) {
        throw new Error('Undangan ini sudah didelegasi sebelumnya');
      }
      
      // Prevent self-delegation
      if (delegationData.delegated_to_user_id === userId) {
        throw new Error('Tidak bisa mendelegasi ke diri sendiri');
      }
      
      // Update undangan with delegation
      const updateQuery = `
        UPDATE undangan 
        SET 
          delegated_to_user_id = $1,
          delegated_to_pegawai_id = $2,
          delegated_to_nama = $3,
          notes = $4,
          status = 'responded',
          responded_at = NOW()
        WHERE id = $5
      `;
      
      await client.query(updateQuery, [
        delegationData.delegated_to_user_id,
        delegationData.delegated_to_pegawai_id,
        delegationData.delegated_to_nama,
        delegationData.notes,
        this.id
      ]);
      
      // If delegated to a user, create new undangan for the delegate
      if (delegationData.delegated_to_user_id) {
        const newUndanganQuery = `
          INSERT INTO undangan (
            agenda_id, 
            user_id, 
            status, 
            created_at
          ) VALUES ($1, $2, 'new', NOW())
        `;
        
        await client.query(newUndanganQuery, [
          undangan.agenda_id,
          delegationData.delegated_to_user_id
        ]);
      }
      
      // Get updated undangan
      const result = await client.query('SELECT * FROM undangan WHERE id = $1', [this.id]);
      
      await client.query('COMMIT');
      
      // Update current instance
      Object.assign(this, result.rows[0]);
      return this;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get undangan without sensitive data
  toJSON() {
    return {
      id: this.id,
      agenda_id: this.agenda_id,
      user_id: this.user_id,
      status: this.status,
      delegated_to_user_id: this.delegated_to_user_id,
      delegated_to_pegawai_id: this.delegated_to_pegawai_id,
      delegated_to_nama: this.delegated_to_nama,
      notes: this.notes,
      created_at: this.created_at,
      opened_at: this.opened_at,
      responded_at: this.responded_at
    };
  }
}

module.exports = Undangan;

