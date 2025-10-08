-- Migration: Update agenda_undangan table to add attendance status

-- Add attendance status column to agenda_undangan
ALTER TABLE agenda_undangan ADD COLUMN attendance_status VARCHAR(20) DEFAULT 'pending' 
CHECK (attendance_status IN ('pending', 'attending', 'not_attending', 'delegated'));

-- Add columns for delegation
ALTER TABLE agenda_undangan ADD COLUMN delegated_to_nama VARCHAR(255);
ALTER TABLE agenda_undangan ADD COLUMN notes TEXT;
ALTER TABLE agenda_undangan ADD COLUMN responded_at TIMESTAMP;

-- Add index for attendance status
CREATE INDEX idx_agenda_undangan_attendance_status ON agenda_undangan(attendance_status);

-- Add comments for documentation
COMMENT ON COLUMN agenda_undangan.attendance_status IS 'Attendance status: pending (no response), attending (will attend), not_attending (will not attend), delegated (represented by someone else)';
COMMENT ON COLUMN agenda_undangan.delegated_to_nama IS 'Name of the person who will represent this invitee';
COMMENT ON COLUMN agenda_undangan.notes IS 'Notes about the attendance response or delegation';
COMMENT ON COLUMN agenda_undangan.responded_at IS 'Timestamp when the attendance response was submitted';


