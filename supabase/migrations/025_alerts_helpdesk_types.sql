-- Relax alerts.type CHECK to admit help-desk alert types (Module 1 Phase C)
-- Created: 2026-09-06

ALTER TABLE alerts DROP CONSTRAINT IF EXISTS alerts_type_check;

ALTER TABLE alerts ADD CONSTRAINT alerts_type_check CHECK (
  type IN (
    'parking_overtime',
    'visitor_entry',
    'visitor_exit',
    'parking_request',
    'emergency',
    'system',
    'pqrs_new',
    'pqrs_resolved',
    'infraction_new',
    'infraction_reply_pending'
  )
);