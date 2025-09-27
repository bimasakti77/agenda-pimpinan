-- Migration: Add nomor_surat and surat_undangan fields to agenda table
-- Date: 2024-01-15
-- Description: Add two new required fields for agenda: nomor_surat and surat_undangan

-- Add nomor_surat column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'agenda' AND column_name = 'nomor_surat') THEN
    ALTER TABLE agenda ADD COLUMN nomor_surat VARCHAR(100) NOT NULL DEFAULT '';
    RAISE NOTICE 'Added nomor_surat column';
  ELSE
    RAISE NOTICE 'nomor_surat column already exists';
  END IF;
END $$;

-- Add surat_undangan column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'agenda' AND column_name = 'surat_undangan') THEN
    ALTER TABLE agenda ADD COLUMN surat_undangan TEXT NOT NULL DEFAULT '';
    RAISE NOTICE 'Added surat_undangan column';
  ELSE
    RAISE NOTICE 'surat_undangan column already exists';
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN agenda.nomor_surat IS 'Nomor surat undangan (contoh: 001/KUMHAM/2024)';
COMMENT ON COLUMN agenda.surat_undangan IS 'Isi surat undangan dalam format teks bebas';

-- Update existing records with default values (if any exist)
UPDATE agenda SET 
  nomor_surat = 'TEMP-' || id || '-' || EXTRACT(YEAR FROM created_at),
  surat_undangan = 'Surat undangan untuk: ' || title
WHERE nomor_surat = '' OR surat_undangan = '';

-- Create index on nomor_surat for better query performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_agenda_nomor_surat ON agenda(nomor_surat);
