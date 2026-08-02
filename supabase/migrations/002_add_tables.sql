-- Additional tables for the residential management system
-- Supabase / PostgreSQL version

-- Buildings table
CREATE TABLE IF NOT EXISTS public.buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  total_units INTEGER NOT NULL,
  total_parking_spots INTEGER NOT NULL,
  visitor_parking_spots INTEGER NOT NULL,
  stripe_account_id UUID,
  monthly_fee INTEGER NOT NULL,
  currency TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL,
  building_name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('succeeded', 'pending', 'failed', 'refunded')),
  type TEXT NOT NULL CHECK (type IN ('subscription', 'overtime_fee', 'reservation', 'fine')),
  description TEXT NOT NULL,
  resident_unit TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (building_id) REFERENCES public.buildings(id) ON DELETE CASCADE
);

-- Parking spots table
CREATE TABLE IF NOT EXISTS public.parking_spots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL,
  code TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('available', 'occupied', 'reserved', 'overtime')),
  vehicle_plate TEXT,
  visitor_name TEXT,
  resident_unit TEXT,
  entry_time TIMESTAMPTZ,
  max_duration INTEGER NOT NULL,
  time_remaining INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (building_id) REFERENCES public.buildings(id) ON DELETE CASCADE
);

-- Visitors table
CREATE TABLE IF NOT EXISTS public.visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL,
  name TEXT NOT NULL,
  document_id TEXT NOT NULL,
  document_photo TEXT,
  type TEXT NOT NULL CHECK (type IN ('pedestrian', 'vehicle')),
  vehicle_plate TEXT,
  vehicle_photo TEXT,
  destination_unit TEXT NOT NULL,
  resident_name TEXT NOT NULL,
  entry_time TIMESTAMPTZ NOT NULL,
  exit_time TIMESTAMPTZ,
  parking_spot UUID,
  status TEXT NOT NULL CHECK (status IN ('inside', 'exited', 'pending')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (building_id) REFERENCES public.buildings(id) ON DELETE CASCADE,
  FOREIGN KEY (parking_spot) REFERENCES public.parking_spots(id) ON DELETE SET NULL
);

-- Alerts table
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('parking_overtime', 'visitor_entry', 'visitor_exit', 'parking_request', 'emergency', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read BOOLEAN NOT NULL DEFAULT FALSE,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  related_id UUID,
  action_required BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (building_id) REFERENCES public.buildings(id) ON DELETE CASCADE
);

-- Residents table
CREATE TABLE IF NOT EXISTS public.residents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  parking_spots UUID[],
  balance INTEGER NOT NULL DEFAULT 0,
  is_tenant BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (building_id) REFERENCES public.buildings(id) ON DELETE CASCADE
);

-- Tenants table
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL,
  name TEXT NOT NULL,
  document_id TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  unit TEXT NOT NULL,
  owner_id UUID NOT NULL,
  owner_name TEXT NOT NULL,
  owner_unit TEXT NOT NULL,
  lease_start TIMESTAMPTZ NOT NULL,
  lease_end TIMESTAMPTZ NOT NULL,
  monthly_rent INTEGER NOT NULL,
  deposit_paid INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'pending', 'ended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (building_id) REFERENCES public.buildings(id) ON DELETE CASCADE,
  FOREIGN KEY (owner_id) REFERENCES public.residents(id) ON DELETE CASCADE
);

-- Tenant vehicles table
CREATE TABLE IF NOT EXISTS public.tenant_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  plate TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  color TEXT NOT NULL,
  parking_spot UUID,
  type TEXT NOT NULL CHECK (type IN ('car', 'motorcycle', 'bicycle')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (parking_spot) REFERENCES public.parking_spots(id) ON DELETE SET NULL
);

-- Rental listings table
CREATE TABLE IF NOT EXISTS public.rental_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL,
  owner_id UUID NOT NULL,
  owner_name TEXT NOT NULL,
  owner_unit TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('apartment', 'parking')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price INTEGER NOT NULL,
  currency TEXT NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('monthly', 'daily')),
  available BOOLEAN NOT NULL DEFAULT TRUE,
  available_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rooms INTEGER,
  bathrooms INTEGER,
  area INTEGER,
  parking_code TEXT,
  images UUID[],
  amenities TEXT[],
  contact_phone TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'rented', 'paused')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (building_id) REFERENCES public.buildings(id) ON DELETE CASCADE,
  FOREIGN KEY (owner_id) REFERENCES public.residents(id) ON DELETE CASCADE
);

-- Marketplace products table
CREATE TABLE IF NOT EXISTS public.marketplace_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  seller_name TEXT NOT NULL,
  seller_unit TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price INTEGER NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('food', 'services', 'products', 'crafts', 'other')),
  available BOOLEAN NOT NULL DEFAULT TRUE,
  images UUID[],
  contact_phone TEXT NOT NULL,
  whatsapp TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (building_id) REFERENCES public.buildings(id) ON DELETE CASCADE,
  FOREIGN KEY (seller_id) REFERENCES public.residents(id) ON DELETE CASCADE
);

-- Communications table
CREATE TABLE IF NOT EXISTS public.communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL,
  author_id UUID NOT NULL,
  author_name TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('announcement', 'maintenance', 'alert', 'event', 'circular')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  target_roles UUID[],
  includes_tenants BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_by UUID[],
  attachments UUID[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (building_id) REFERENCES public.buildings(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES public.residents(id) ON DELETE CASCADE
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_payments_building ON public.payments(building_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_type ON public.payments(type);
CREATE INDEX IF NOT EXISTS idx_parking_spots_building ON public.parking_spots(building_id);
CREATE INDEX IF NOT EXISTS idx_parking_spots_status ON public.parking_spots(status);
CREATE INDEX IF NOT EXISTS idx_visitors_building ON public.visitors(building_id);
CREATE INDEX IF NOT EXISTS idx_visitors_status ON public.visitors(status);
CREATE INDEX IF NOT EXISTS idx_alerts_building ON public.alerts(building_id);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON public.alerts(type);
CREATE INDEX IF NOT EXISTS idx_alerts_priority ON public.alerts(priority);
CREATE INDEX IF NOT EXISTS idx_residents_building ON public.residents(building_id);
CREATE INDEX IF NOT EXISTS idx_tenants_building ON public.tenants(building_id);
CREATE INDEX IF NOT EXISTS idx_tenant_vehicles_tenant ON public.tenant_vehicles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rental_listings_building ON public.rental_listings(building_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_building ON public.marketplace_products(building_id);
CREATE INDEX IF NOT EXISTS idx_communications_building ON public.communications(building_id);
CREATE INDEX IF NOT EXISTS idx_communications_sent_at ON public.communications(sent_at);