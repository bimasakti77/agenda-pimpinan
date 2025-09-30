-- Migration: Add file storage fields for MinIO integration
-- Date: 2024-01-15
-- Description: Add fields to store file information for invitation files stored in MinIO

-- Add file storage fields to agenda table
DO $$ 
BEGIN
  -- Add file_name column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'agenda' AND column_name = 'file_name') THEN
    ALTER TABLE agenda ADD COLUMN file_name VARCHAR(255);
    RAISE NOTICE 'Added file_name column';
  ELSE
    RAISE NOTICE 'file_name column already exists';
  END IF;

  -- Add file_path column (MinIO object key/path)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'agenda' AND column_name = 'file_path') THEN
    ALTER TABLE agenda ADD COLUMN file_path VARCHAR(500);
    RAISE NOTICE 'Added file_path column';
  ELSE
    RAISE NOTICE 'file_path column already exists';
  END IF;

  -- Add file_size column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'agenda' AND column_name = 'file_size') THEN
    ALTER TABLE agenda ADD COLUMN file_size BIGINT;
    RAISE NOTICE 'Added file_size column';
  ELSE
    RAISE NOTICE 'file_size column already exists';
  END IF;

  -- Add file_type column (MIME type)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'agenda' AND column_name = 'file_type') THEN
    ALTER TABLE agenda ADD COLUMN file_type VARCHAR(100);
    RAISE NOTICE 'Added file_type column';
  ELSE
    RAISE NOTICE 'file_type column already exists';
  END IF;

  -- Add file_uploaded_at column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'agenda' AND column_name = 'file_uploaded_at') THEN
    ALTER TABLE agenda ADD COLUMN file_uploaded_at TIMESTAMP;
    RAISE NOTICE 'Added file_uploaded_at column';
  ELSE
    RAISE NOTICE 'file_uploaded_at column already exists';
  END IF;

  -- Add file_bucket column (MinIO bucket name)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'agenda' AND column_name = 'file_bucket') THEN
    ALTER TABLE agenda ADD COLUMN file_bucket VARCHAR(100) DEFAULT 'agenda-files';
    RAISE NOTICE 'Added file_bucket column';
  ELSE
    RAISE NOTICE 'file_bucket column already exists';
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN agenda.file_name IS 'Original filename of the uploaded invitation file';
COMMENT ON COLUMN agenda.file_path IS 'MinIO object key/path where the file is stored';
COMMENT ON COLUMN agenda.file_size IS 'File size in bytes';
COMMENT ON COLUMN agenda.file_type IS 'MIME type of the uploaded file (e.g., application/pdf, image/jpeg)';
COMMENT ON COLUMN agenda.file_uploaded_at IS 'Timestamp when the file was uploaded to MinIO';
COMMENT ON COLUMN agenda.file_bucket IS 'MinIO bucket name where the file is stored (default: agenda-files)';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_agenda_file_name ON agenda(file_name);
CREATE INDEX IF NOT EXISTS idx_agenda_file_type ON agenda(file_type);
CREATE INDEX IF NOT EXISTS idx_agenda_file_uploaded_at ON agenda(file_uploaded_at);
CREATE INDEX IF NOT EXISTS idx_agenda_file_bucket ON agenda(file_bucket);

-- Add constraint to ensure file_path is unique when not null
-- Note: PostgreSQL doesn't support WHERE clause in UNIQUE constraint directly
-- We'll use a partial unique index instead
CREATE UNIQUE INDEX IF NOT EXISTS idx_agenda_file_path_unique 
ON agenda(file_path) 
WHERE file_path IS NOT NULL;
