-- Migration: Add kirim_undangan field to agenda table
-- Description: Add field to track whether invitations have been sent for an agenda
-- Date: 2024-12-19

-- Add kirim_undangan field to agenda table
ALTER TABLE agenda 
ADD COLUMN kirim_undangan INTEGER DEFAULT 0;

-- Add comment to explain the field
COMMENT ON COLUMN agenda.kirim_undangan IS 'Status pengiriman undangan: 0 = belum dikirim, 1 = sudah dikirim';

-- Update existing agendas to have kirim_undangan = 0 (not sent)
UPDATE agenda SET kirim_undangan = 0 WHERE kirim_undangan IS NULL;
