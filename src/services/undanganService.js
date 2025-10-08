const pool = require('../config/database');

class UndanganService {
  // Get undangan by user ID
  async getUndanganByUser(userId, filters = {}, page = 1, limit = 10) {
    try {
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
        undangan: result.rows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error in getUndanganByUser:', error);
      throw error;
    }
  }

  // Get undangan by agenda ID
  async getUndanganByAgenda(agendaId) {
    try {
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
      return result.rows;
    } catch (error) {
      console.error('Error in getUndanganByAgenda:', error);
      throw error;
    }
  }

  // Update undangan status
  async updateUndanganStatus(undanganId, status, userId) {
    try {
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Check if user owns this undangan
        const checkQuery = 'SELECT * FROM undangan WHERE id = $1 AND user_id = $2';
        const checkResult = await client.query(checkQuery, [undanganId, userId]);
        
        if (checkResult.rows.length === 0) {
          throw new Error('Undangan tidak ditemukan atau tidak memiliki akses');
        }
        
        const undangan = checkResult.rows[0];
        
        // Update status with proper parameter handling
        let updateQuery = 'UPDATE undangan SET status = $1';
        const params = [status];
        let paramCount = 1;
        
        // Set timestamp based on status
        if (status === 'opened' && !undangan.opened_at) {
          paramCount++;
          updateQuery += `, opened_at = $${paramCount}`;
          params.push(new Date().toISOString());
        } else if (status === 'responded' && !undangan.responded_at) {
          paramCount++;
          updateQuery += `, responded_at = $${paramCount}`;
          params.push(new Date().toISOString());
        }
        
        paramCount++;
        updateQuery += ` WHERE id = $${paramCount}`;
        params.push(undanganId);
        
        console.log('Update query:', updateQuery);
        console.log('Update params:', params);
        
        await client.query(updateQuery, params);
        
        // Get updated undangan
        const result = await client.query('SELECT * FROM undangan WHERE id = $1', [undanganId]);
        
        await client.query('COMMIT');
        return result.rows[0];
        
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error in updateUndanganStatus:', error);
      throw error;
    }
  }

  // Delegate undangan
  async delegateUndangan(undanganId, userId, delegationData) {
    try {
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Check if user owns this undangan and can delegate
        const checkQuery = `
          SELECT * FROM undangan 
          WHERE id = $1 AND user_id = $2
        `;
        const checkResult = await client.query(checkQuery, [undanganId, userId]);
        
        if (checkResult.rows.length === 0) {
          throw new Error('Undangan tidak ditemukan atau tidak memiliki akses');
        }
        
        const undangan = checkResult.rows[0];
        
        // Check delegation level
        if (undangan.delegation_level >= 2) {
          throw new Error('Delegasi hanya bisa dilakukan maksimal 2 kali. Jika tidak bisa hadir, silakan konfirmasi ke penyelenggara.');
        }
        
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
            delegation_level = delegation_level + 1,
            delegation_chain = COALESCE(delegation_chain, '[]'::jsonb) || $5::jsonb,
            status = 'responded',
            responded_at = NOW()
          WHERE id = $6
        `;
        
        const delegationChain = JSON.stringify([userId, delegationData.delegated_to_user_id || delegationData.delegated_to_pegawai_id]);
        
        await client.query(updateQuery, [
          delegationData.delegated_to_user_id,
          delegationData.delegated_to_pegawai_id,
          delegationData.delegated_to_nama,
          delegationData.notes,
          delegationChain,
          undanganId
        ]);
        
        // If delegated to a user, create new undangan for the delegate
        if (delegationData.delegated_to_user_id) {
          const newUndanganQuery = `
            INSERT INTO undangan (
              agenda_id, 
              user_id, 
              status, 
              delegation_level,
              original_user_id,
              delegation_chain,
              created_at
            ) VALUES ($1, $2, 'new', $3, $4, $5, NOW())
          `;
          
          const newDelegationLevel = undangan.delegation_level + 1;
          const newDelegationChain = JSON.stringify([undangan.original_user_id || undangan.user_id, userId, delegationData.delegated_to_user_id]);
          
          await client.query(newUndanganQuery, [
            undangan.agenda_id,
            delegationData.delegated_to_user_id,
            newDelegationLevel,
            undangan.original_user_id || undangan.user_id,
            newDelegationChain
          ]);
        }
        
        // Get updated undangan
        const result = await client.query('SELECT * FROM undangan WHERE id = $1', [undanganId]);
        
        await client.query('COMMIT');
        return result.rows[0];
        
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error in delegateUndangan:', error);
      throw error;
    }
  }

  // Get delegation chain
  async getDelegationChain(undanganId) {
    try {
      const query = `
        SELECT 
          u.*,
          usr.username,
          usr.email,
          delegated_user.username as delegated_to_username,
          delegated_user.email as delegated_to_email
        FROM undangan u
        JOIN users usr ON u.user_id = usr.id
        LEFT JOIN users delegated_user ON u.delegated_to_user_id = delegated_user.id
        WHERE u.id = $1
      `;
      
      const result = await pool.query(query, [undanganId]);
      
      if (result.rows.length === 0) {
        throw new Error('Undangan tidak ditemukan');
      }
      
      const undangan = result.rows[0];
      
      // Parse delegation chain
      let delegationChain = [];
      if (undangan.delegation_chain) {
        try {
          delegationChain = JSON.parse(undangan.delegation_chain);
        } catch (e) {
          delegationChain = [];
        }
      }
      
      return {
        undangan,
        delegationChain,
        canDelegate: undangan.delegation_level < 2
      };
    } catch (error) {
      console.error('Error in getDelegationChain:', error);
      throw error;
    }
  }

  // Check delegation eligibility
  async checkDelegationEligibility(undanganId, userId) {
    try {
      const query = `
        SELECT 
          delegation_level,
          delegated_to_user_id,
          delegated_to_pegawai_id
        FROM undangan 
        WHERE id = $1 AND user_id = $2
      `;
      
      const result = await pool.query(query, [undanganId, userId]);
      
      if (result.rows.length === 0) {
        return {
          canDelegate: false,
          reason: 'Undangan tidak ditemukan atau tidak memiliki akses'
        };
      }
      
      const undangan = result.rows[0];
      
      if (undangan.delegation_level >= 2) {
        return {
          canDelegate: false,
          reason: 'Delegasi hanya bisa dilakukan maksimal 2 kali. Jika tidak bisa hadir, silakan konfirmasi ke penyelenggara.',
          delegationLevel: undangan.delegation_level
        };
      }
      
      if (undangan.delegated_to_user_id || undangan.delegated_to_pegawai_id) {
        return {
          canDelegate: false,
          reason: 'Undangan ini sudah didelegasi sebelumnya'
        };
      }
      
      return {
        canDelegate: true,
        delegationLevel: undangan.delegation_level,
        maxDelegationLevel: 2
      };
    } catch (error) {
      console.error('Error in checkDelegationEligibility:', error);
      throw error;
    }
  }

  // Auto-generate undangan for agenda participants
  async generateUndanganForAgenda(agendaId, undanganList) {
    try {
      console.log(`\n🔧 ===== UNDANGAN SERVICE: generateUndanganForAgenda =====`);
      console.log(`📋 Agenda ID: ${agendaId}`);
      console.log(`📊 Participants to process: ${undanganList ? undanganList.length : 0}`);
      
      const generatedUndangan = [];
      
      if (!undanganList || undanganList.length === 0) {
        console.log('⚠️ No participants to process - returning empty array');
        return generatedUndangan;
      }

      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        console.log('🔗 Database transaction started');
        
        for (let i = 0; i < undanganList.length; i++) {
          const peserta = undanganList[i];
          console.log(`\n👤 Processing participant ${i + 1}/${undanganList.length}:`);
          console.log(`   - Nama: ${peserta.nama}`);
          console.log(`   - Kategori: ${peserta.kategori}`);
          console.log(`   - NIP: ${peserta.nip}`);
          console.log(`   - Pegawai ID: ${peserta.pegawai_id}`);
          
          // Only process internal participants
          if (peserta.kategori === 'internal' && peserta.pegawai_id && peserta.nip) {
            console.log(`   ✅ Valid internal participant - checking for user account...`);
            
            // Check if pegawai has user account
            const userQuery = 'SELECT id, username, full_name FROM users WHERE nip = $1 AND is_active = true';
            const userResult = await client.query(userQuery, [peserta.nip]);
            
            if (userResult.rows.length > 0) {
              const user = userResult.rows[0];
              console.log(`   ✅ Found user account:`);
              console.log(`      - User ID: ${user.id}`);
              console.log(`      - Username: ${user.username}`);
              console.log(`      - Full Name: ${user.full_name}`);
              
              // Check if undangan already exists
              const existingQuery = 'SELECT id FROM undangan WHERE agenda_id = $1 AND user_id = $2';
              const existingResult = await client.query(existingQuery, [agendaId, user.id]);
              
              if (existingResult.rows.length === 0) {
                console.log(`   🔄 Creating new undangan...`);
                
                // Create new undangan
                const insertQuery = `
                  INSERT INTO undangan (agenda_id, user_id, status, created_at)
                  VALUES ($1, $2, 'new', NOW())
                  RETURNING *
                `;
                
                const insertResult = await client.query(insertQuery, [agendaId, user.id]);
                const newUndangan = insertResult.rows[0];
                generatedUndangan.push(newUndangan);
                
                console.log(`   ✅ Successfully created undangan ID: ${newUndangan.id}`);
              } else {
                console.log(`   ⚠️ Undangan already exists for this user - skipping`);
              }
            } else {
              console.log(`   ℹ️ No user account found for NIP: ${peserta.nip}`);
            }
          } else {
            console.log(`   ⏭️ Skipping participant (not internal or missing NIP)`);
            if (peserta.kategori !== 'internal') {
              console.log(`      Reason: Kategori is '${peserta.kategori}', not 'internal'`);
            }
            if (!peserta.pegawai_id) {
              console.log(`      Reason: Missing pegawai_id`);
            }
            if (!peserta.nip) {
              console.log(`      Reason: Missing NIP`);
            }
          }
        }
        
        await client.query('COMMIT');
        console.log(`\n🎉 ===== UNDANGAN GENERATION COMPLETED =====`);
        console.log(`✅ Successfully generated ${generatedUndangan.length} undangan for agenda ${agendaId}`);
        console.log(`📊 Total participants processed: ${undanganList.length}`);
        console.log(`📊 Undangan created: ${generatedUndangan.length}`);
        
        if (generatedUndangan.length > 0) {
          console.log(`\n📋 Generated undangan details:`);
          generatedUndangan.forEach((undangan, index) => {
            console.log(`   ${index + 1}. Undangan ID: ${undangan.id}, User ID: ${undangan.user_id}, Status: ${undangan.status}`);
          });
        }
        
        return generatedUndangan;
        
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`\n❌ ===== UNDANGAN GENERATION FAILED =====`);
        console.error(`Error in generateUndanganForAgenda:`, error.message);
        console.error(`Stack trace:`, error.stack);
        throw error;
      } finally {
        client.release();
        console.log('🔗 Database connection released');
      }
    } catch (error) {
      console.error('\n💥 ===== UNDANGAN SERVICE ERROR =====');
      console.error('Error in generateUndanganForAgenda:', error);
      throw error;
    }
  }

  // Create single undangan
  async createUndangan(undanganData) {
    try {
      const query = `
        INSERT INTO undangan (agenda_id, user_id, status, created_at)
        VALUES ($1, $2, $3, NOW())
        RETURNING *
      `;
      
      const result = await pool.query(query, [
        undanganData.agenda_id,
        undanganData.user_id,
        undanganData.status || 'new'
      ]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error in createUndangan:', error);
      throw error;
    }
  }
}

module.exports = new UndanganService();
