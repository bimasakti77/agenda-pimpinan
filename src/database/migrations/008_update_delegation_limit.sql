-- Migration: Update delegation limit to allow 2 levels

-- Drop existing constraint if it exists
ALTER TABLE undangan DROP CONSTRAINT IF EXISTS max_delegation_level;

-- Add new constraint to allow 2 level delegation
ALTER TABLE undangan ADD CONSTRAINT max_delegation_level CHECK (delegation_level <= 2);

-- Update comment for delegation level
COMMENT ON COLUMN undangan.delegation_level IS 'Level of delegation: 0 (original), 1 (first delegation), 2 (second delegation - maximum allowed)';

