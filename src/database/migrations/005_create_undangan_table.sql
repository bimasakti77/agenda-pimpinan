-- Migration: Create undangan table for invitation system

-- Create undangan table
CREATE TABLE undangan (
    id SERIAL PRIMARY KEY,
    agenda_id INTEGER NOT NULL REFERENCES agenda(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'opened', 'responded')),
    delegated_to_user_id INTEGER REFERENCES users(id), -- untuk delegasi ke user lain
    delegated_to_pegawai_id INTEGER, -- pegawai pengganti dari SIMPEG
    delegated_to_nama VARCHAR(255), -- nama pengganti
    notes TEXT, -- catatan dari user yang mendelegasi
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    opened_at TIMESTAMP, -- saat undangan dibuka
    responded_at TIMESTAMP, -- saat user merespons
    
    -- Constraints to prevent duplicates
    CONSTRAINT unique_agenda_user UNIQUE(agenda_id, user_id)
);

-- Add indexes for better performance
CREATE INDEX idx_undangan_agenda_id ON undangan(agenda_id);
CREATE INDEX idx_undangan_user_id ON undangan(user_id);
CREATE INDEX idx_undangan_status ON undangan(status);
CREATE INDEX idx_undangan_created_at ON undangan(created_at);

-- Add comments for documentation
COMMENT ON TABLE undangan IS 'Table for storing invitation records and their status';
COMMENT ON COLUMN undangan.agenda_id IS 'Reference to agenda table';
COMMENT ON COLUMN undangan.user_id IS 'Reference to users table - who received the invitation';
COMMENT ON COLUMN undangan.status IS 'Invitation status: new (unread), opened (read), responded (confirmed)';
COMMENT ON COLUMN undangan.delegated_to_user_id IS 'Reference to users table - who the invitation was delegated to';
COMMENT ON COLUMN undangan.delegated_to_pegawai_id IS 'Pegawai ID from SIMPEG if delegated to non-user';
COMMENT ON COLUMN undangan.delegated_to_nama IS 'Name of the delegate person';
COMMENT ON COLUMN undangan.notes IS 'Notes from the person who delegated';


