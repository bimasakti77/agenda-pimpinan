const PegawaiKemenkum = require('../models/PegawaiKemenkum');

class PegawaiService {
  // Get all pegawai for dropdown
  async getAllPegawai() {
    const pegawai = await PegawaiKemenkum.findAll();
    return pegawai;
  }

  // Get pegawai by NIP
  async getPegawaiByNip(nip) {
    const pegawai = await PegawaiKemenkum.findByNip(nip);
    if (!pegawai) {
      throw new Error('Pegawai not found');
    }
    return pegawai;
  }

  // Search pegawai
  async searchPegawai(searchTerm, limit = 20) {
    if (!searchTerm || searchTerm.length < 2) {
      return [];
    }
    const pegawai = await PegawaiKemenkum.search(searchTerm, limit);
    return pegawai;
  }
}

module.exports = new PegawaiService();
