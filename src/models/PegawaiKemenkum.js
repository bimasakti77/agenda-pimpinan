const pool = require('../config/database');

class PegawaiKemenkum {
  constructor(data) {
    this.NIP = data.NIP;
    this.NIK = data.NIK;
    this.Nama = data.Nama;
    this.GelarDepan = data.GelarDepan;
    this.GelarBelakang = data.GelarBelakang;
    this.EmailDinas = data.EmailDinas;
    this.Telepon = data.Telepon;
    this.TempatLahir = data.TempatLahir;
    this.TglLahir = data.TglLahir;
    this.JenisKelamin = data.JenisKelamin;
    this.Agama = data.Agama;
    this.StatusKawin = data.StatusKawin;
    this.Foto = data.Foto;
    this.PendidikanTerakhir = data.PendidikanTerakhir;
    this.SatkerID = data.SatkerID;
    this.KodeJabatan = data.KodeJabatan;
    this.Jabatan = data.Jabatan;
    this.TipePegawai = data.TipePegawai;
    this.StatusPegawai = data.StatusPegawai;
    this.Pangkat = data.Pangkat;
    this.RowNumber = data.RowNumber;
  }

  // Get all pegawai for dropdown
  static async findAll() {
    const query = `
      SELECT "NIP", "Nama", "Jabatan", "SatkerID", "Pangkat", "StatusPegawai"
      FROM "simpeg_Pegawai" 
      WHERE "StatusPegawai" = 'PNS'
      ORDER BY "Nama" ASC
    `;
    const result = await pool.query(query);
    return result.rows.map(row => new PegawaiKemenkum(row));
  }

  // Find pegawai by NIP
  static async findByNip(nip) {
    const query = 'SELECT * FROM "simpeg_Pegawai" WHERE "NIP" = $1';
    const result = await pool.query(query, [nip]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new PegawaiKemenkum(result.rows[0]);
  }

  // Search pegawai by name or NIP
  static async search(searchTerm) {
    const query = `
      SELECT "NIP", "Nama", "Jabatan", "SatkerID", "Pangkat", "StatusPegawai"
      FROM "simpeg_Pegawai" 
      WHERE "StatusPegawai" = 'PNS' 
      AND ("Nama" ILIKE $1 OR "NIP" ILIKE $1)
      ORDER BY "Nama" ASC
      LIMIT 50
    `;
    const searchPattern = `%${searchTerm}%`;
    const result = await pool.query(query, [searchPattern]);
    return result.rows.map(row => new PegawaiKemenkum(row));
  }

  // Get full name with title
  getFullName() {
    const gelarDepan = this.GelarDepan ? `${this.GelarDepan} ` : '';
    const gelarBelakang = this.GelarBelakang ? `, ${this.GelarBelakang}` : '';
    return `${gelarDepan}${this.Nama}${gelarBelakang}`;
  }

  // Get display name for dropdown
  getDisplayName() {
    return `${this.getFullName()} (${this.NIP})`;
  }

  // Get position info
  getPositionInfo() {
    return `${this.Jabatan || 'Tidak ada jabatan'}${this.Pangkat ? ` - ${this.Pangkat}` : ''}`;
  }
}

module.exports = PegawaiKemenkum;
