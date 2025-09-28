-- Migration: Fix pegawai_id type to VARCHAR to match NIP format

-- Drop existing constraints first
ALTER TABLE agenda_undangan DROP CONSTRAINT IF EXISTS unique_internal_undangan;

-- Change pegawai_id column type from INTEGER to VARCHAR
ALTER TABLE agenda_undangan ALTER COLUMN pegawai_id TYPE VARCHAR(20);

-- Recreate the constraint with new type
ALTER TABLE agenda_undangan ADD CONSTRAINT unique_internal_undangan UNIQUE(agenda_id, pegawai_id);

-- Add comment for documentation
COMMENT ON COLUMN agenda_undangan.pegawai_id IS 'NIP from simpeg_Pegawai table (NULL for external invitations)';
