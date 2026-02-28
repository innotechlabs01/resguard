// Security Dashboard Types

export type UserRole = 'super_admin' | 'admin' | 'vigilante' | 'usuario'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  buildingId?: string // For admin and vigilante - which building they belong to
  avatar?: string
}

export interface BuildingStats {
  id: string
  name: string
  address: string
  totalUnits: number
  occupiedUnits: number
  totalParkingSpots: number
  visitorParkingSpots: number
  activeVisitors: number
  pendingAlerts: number
  monthlyRevenue: number
  outstandingBalance: number
  status: 'active' | 'inactive' | 'maintenance'
  lastPaymentDate?: Date
  subscriptionStatus: 'active' | 'past_due' | 'canceled' | 'trialing'
}

export interface Payment {
  id: string
  buildingId: string
  buildingName: string
  amount: number
  currency: string
  status: 'succeeded' | 'pending' | 'failed' | 'refunded'
  type: 'subscription' | 'overtime_fee' | 'reservation' | 'fine'
  description: string
  residentUnit?: string
  createdAt: Date
}

export interface SystemStats {
  totalBuildings: number
  activeBuildings: number
  totalResidents: number
  totalRevenue: number
  monthlyRecurringRevenue: number
  pendingPayments: number
  systemAlerts: number
}

export interface ParkingSpot {
  id: string
  code: string
  status: 'available' | 'occupied' | 'reserved' | 'overtime'
  vehiclePlate?: string
  visitorName?: string
  residentUnit?: string
  entryTime?: Date
  maxDuration: number // in minutes
  timeRemaining?: number // in minutes
}

export interface Visitor {
  id: string
  name: string
  documentId: string
  documentPhoto?: string
  type: 'pedestrian' | 'vehicle'
  vehiclePlate?: string
  vehiclePhoto?: string
  destinationUnit: string
  residentName: string
  entryTime: Date
  exitTime?: Date
  parkingSpot?: string
  status: 'inside' | 'exited' | 'pending'
}

export interface Alert {
  id: string
  type: 'parking_overtime' | 'visitor_entry' | 'visitor_exit' | 'parking_request' | 'emergency' | 'system'
  title: string
  message: string
  timestamp: Date
  read: boolean
  priority: 'low' | 'medium' | 'high' | 'critical'
  relatedId?: string
  actionRequired?: boolean
}

export interface ShiftReport {
  id: string
  guardName: string
  shiftStart: Date
  shiftEnd: Date
  incidents: string[]
  notes: string
  audioTranscription?: string
}

export interface Building {
  id: string
  name: string
  address: string
  totalUnits: number
  totalParkingSpots: number
  visitorParkingSpots: number
  stripeAccountId?: string
  monthlyFee: number
  currency: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface Tenant {
  id: string
  name: string
  documentId: string
  phone: string
  email: string
  unit: string
  buildingId: string
  ownerId: string // resident who rents
  ownerName: string
  ownerUnit: string
  leaseStart: Date
  leaseEnd: Date
  monthlyRent: number
  depositPaid: number
  status: 'active' | 'pending' | 'ended'
  vehicles: TenantVehicle[]
}

export interface TenantVehicle {
  id: string
  plate: string
  brand: string
  model: string
  color: string
  parkingSpot?: string // which parking spot they use
  type: 'car' | 'motorcycle' | 'bicycle'
}

export interface RentalListing {
  id: string
  type: 'apartment' | 'parking'
  ownerId: string
  ownerName: string
  ownerUnit: string
  buildingId: string
  title: string
  description: string
  price: number
  currency: string
  period: 'monthly' | 'daily'
  available: boolean
  availableFrom: Date
  rooms?: number
  bathrooms?: number
  area?: number
  parkingCode?: string
  images?: string[]
  amenities?: string[]
  contactPhone: string
  status: 'active' | 'rented' | 'paused'
}

export interface MarketplaceProduct {
  id: string
  sellerId: string
  sellerName: string
  sellerUnit: string
  buildingId: string
  title: string
  description: string
  price: number
  category: 'food' | 'services' | 'products' | 'crafts' | 'other'
  available: boolean
  images?: string[]
  contactPhone: string
  whatsapp?: string
  createdAt: Date
}

export interface Communication {
  id: string
  buildingId: string
  authorId: string
  authorName: string
  title: string
  message: string
  type: 'announcement' | 'maintenance' | 'alert' | 'event' | 'circular'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  targetRoles: UserRole[]
  includesTenants: boolean
  sentAt: Date
  readBy: string[]
  attachments?: string[]
}

export interface Resident {
  id: string
  name: string
  unit: string
  phone: string
  email: string
  parkingSpots: string[]
  balance: number
  isTenant?: boolean
  tenantInfo?: {
    ownerId: string
    ownerName: string
    leaseEnd: Date
  }
  hasRentalListing?: boolean
  hasMarketplaceListing?: boolean
}
