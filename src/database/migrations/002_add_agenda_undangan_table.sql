-- Migration: Add agenda_undangan table for managing agenda invitations

-- Create agenda_undangan table
CREATE TABLE agenda_undangan (
    id SERIAL PRIMARY KEY,
    agenda_id INTEGER NOT NULL REFERENCES agenda(id) ON DELETE CASCADE,
    pegawai_id INTEGER, -- ID from simpeg_Pegawai (NULL for external)
    nama VARCHAR(255) NOT NULL, -- Invitation name
    kategori VARCHAR(20) NOT NULL CHECK (kategori IN ('internal', 'eksternal')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints to prevent duplicates
    CONSTRAINT unique_internal_undangan UNIQUE(agenda_id, pegawai_id),
    CONSTRAINT unique_external_undangan UNIQUE(agenda_id, nama)
);

-- Add indexes for better performance
CREATE INDEX idx_agenda_undangan_agenda_id ON agenda_undangan(agenda_id);
CREATE INDEX idx_agenda_undangan_pegawai_id ON agenda_undangan(pegawai_id);
CREATE INDEX idx_agenda_undangan_kategori ON agenda_undangan(kategori);

-- Add comments for documentation
COMMENT ON TABLE agenda_undangan IS 'Table for storing agenda invitations (internal and external)';
COMMENT ON COLUMN agenda_undangan.agenda_id IS 'Reference to agenda table';
COMMENT ON COLUMN agenda_undangan.pegawai_id IS 'Reference to simpeg_Pegawai table (NULL for external invitations)';
COMMENT ON COLUMN agenda_undangan.nama IS 'Name of the invited person';
COMMENT ON COLUMN agenda_undangan.kategori IS 'Type of invitation: internal (from simpeg_Pegawai) or eksternal (external person)';
