-- Migración: agregar campo de último pago a tenants
-- El propietario registra cuándo pagó el inquilino

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS last_payment_date DATE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS payment_notes TEXT;
