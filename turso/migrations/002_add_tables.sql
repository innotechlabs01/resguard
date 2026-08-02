-- Additional tables for the residential management system
-- Turso / libSQL version

-- Buildings table
CREATE TABLE IF NOT EXISTS buildings (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  total_units INTEGER NOT NULL,
  total_parking_spots INTEGER NOT NULL,
  visitor_parking_spots INTEGER NOT NULL,
  stripe_account_id TEXT,
  monthly_fee INTEGER NOT NULL,
  currency TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  building_id TEXT NOT NULL,
  building_name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('succeeded', 'pending', 'failed', 'refunded')),
  type TEXT NOT NULL CHECK (type IN ('subscription', 'overtime_fee', 'reservation', 'fine')),
  description TEXT NOT NULL,
  resident_unit TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (building_id) REFERENCES buildings(id)
);

-- Parking spots table
CREATE TABLE IF NOT EXISTS parking_spots (
  id TEXT PRIMARY KEY,
  building_id TEXT NOT NULL,
  code TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('available', 'occupied', 'reserved', 'overtime')),
  vehicle_plate TEXT,
  visitor_name TEXT,
  resident_unit TEXT,
  entry_time TEXT,
  max_duration INTEGER NOT NULL,
  time_remaining INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (building_id) REFERENCES buildings(id)
);

-- Visitors table
CREATE TABLE IF NOT EXISTS visitors (
  id TEXT PRIMARY KEY,
  building_id TEXT NOT NULL,
  name TEXT NOT NULL,
  document_id TEXT NOT NULL,
  document_photo TEXT,
  type TEXT NOT NULL CHECK (type IN ('pedestrian', 'vehicle')),
  vehicle_plate TEXT,
  vehicle_photo TEXT,
  destination_unit TEXT NOT NULL,
  resident_name TEXT NOT NULL,
  entry_time TEXT NOT NULL,
  exit_time TEXT,
  parking_spot TEXT,
  status TEXT NOT NULL CHECK (status IN ('inside', 'exited', 'pending')),
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (building_id) REFERENCES buildings(id)
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  building_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('parking_overtime', 'visitor_entry', 'visitor_exit', 'parking_request', 'emergency', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  read INTEGER NOT NULL DEFAULT 0,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  related_id TEXT,
  action_required INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (building_id) REFERENCES buildings(id)
);

-- Residents table
CREATE TABLE IF NOT EXISTS residents (
  id TEXT PRIMARY KEY,
  building_id TEXT NOT NULL,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  parking_spots TEXT,
  balance INTEGER NOT NULL DEFAULT 0,
  is_tenant INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (building_id) REFERENCES buildings(id)
);

-- Tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  building_id TEXT NOT NULL,
  name TEXT NOT NULL,
  document_id TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  unit TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  owner_unit TEXT NOT NULL,
  lease_start TEXT NOT NULL,
  lease_end TEXT NOT NULL,
  monthly_rent INTEGER NOT NULL,
  deposit_paid INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'pending', 'ended')),
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (building_id) REFERENCES buildings(id),
  FOREIGN KEY (owner_id) REFERENCES residents(id)
);

-- Tenant vehicles table
CREATE TABLE IF NOT EXISTS tenant_vehicles (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  plate TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  color TEXT NOT NULL,
  parking_spot TEXT,
  type TEXT NOT NULL CHECK (type IN ('car', 'motorcycle', 'bicycle')),
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Rental listings table
CREATE TABLE IF NOT EXISTS rental_listings (
  id TEXT PRIMARY KEY,
  building_id TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  owner_unit TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('apartment', 'parking')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price INTEGER NOT NULL,
  currency TEXT NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('monthly', 'daily')),
  available INTEGER NOT NULL DEFAULT 1,
  available_from TEXT NOT NULL DEFAULT (datetime('now')),
  rooms INTEGER,
  bathrooms INTEGER,
  area INTEGER,
  parking_code TEXT,
  images TEXT,
  amenities TEXT,
  contact_phone TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'rented', 'paused')),
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (building_id) REFERENCES buildings(id),
  FOREIGN KEY (owner_id) REFERENCES residents(id)
);

-- Marketplace products table
CREATE TABLE IF NOT EXISTS marketplace_products (
  id TEXT PRIMARY KEY,
  building_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  seller_name TEXT NOT NULL,
  seller_unit TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price INTEGER NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('food', 'services', 'products', 'crafts', 'other')),
  available INTEGER NOT NULL DEFAULT 1,
  images TEXT,
  contact_phone TEXT NOT NULL,
  whatsapp TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (building_id) REFERENCES buildings(id),
  FOREIGN KEY (seller_id) REFERENCES residents(id)
);

-- Communications table
CREATE TABLE IF NOT EXISTS communications (
  id TEXT PRIMARY KEY,
  building_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('announcement', 'maintenance', 'alert', 'event', 'circular')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  target_roles TEXT,
  includes_tenants INTEGER NOT NULL DEFAULT 0,
  sent_at TEXT NOT NULL DEFAULT (datetime('now')),
  read_by TEXT,
  attachments TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (building_id) REFERENCES buildings(id),
  FOREIGN KEY (author_id) REFERENCES residents(id)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_payments_building ON payments(building_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_type ON payments(type);
CREATE INDEX IF NOT EXISTS idx_parking_spots_building ON parking_spots(building_id);
CREATE INDEX IF NOT EXISTS idx_parking_spots_status ON parking_spots(status);
CREATE INDEX IF NOT EXISTS idx_visitors_building ON visitors(building_id);
CREATE INDEX IF NOT EXISTS idx_visitors_status ON visitors(status);
CREATE INDEX IF NOT EXISTS idx_alerts_building ON alerts(building_id);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(type);
CREATE INDEX IF NOT EXISTS idx_alerts_priority ON alerts(priority);
CREATE INDEX IF NOT EXISTS idx_residents_building ON residents(building_id);
CREATE INDEX IF NOT EXISTS idx_tenants_building ON tenants(building_id);
CREATE INDEX IF NOT EXISTS idx_tenant_vehicles_tenant ON tenant_vehicles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rental_listings_building ON rental_listings(building_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_building ON marketplace_products(building_id);
CREATE INDEX IF NOT EXISTS idx_communications_building ON communications(building_id);
CREATE INDEX IF NOT EXISTS idx_communications_sent_at ON communications(sent_at);