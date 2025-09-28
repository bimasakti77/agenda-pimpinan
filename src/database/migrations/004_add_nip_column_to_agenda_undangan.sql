-- Migration: Add nip column to agenda_undangan table

-- Add nip column to store NIP from simpeg_Pegawai
ALTER TABLE agenda_undangan
ADD COLUMN nip VARCHAR(20);

-- Add comment for documentation
COMMENT ON COLUMN agenda_undangan.nip IS 'NIP of the invited internal employee (from simpeg_Pegawai), NULL for external invitations';

-- Update existing records to populate nip from pegawai_id
-- Since pegawai_id currently contains NIP values, copy them to nip column
UPDATE agenda_undangan 
SET nip = pegawai_id 
WHERE pegawai_id IS NOT NULL;
