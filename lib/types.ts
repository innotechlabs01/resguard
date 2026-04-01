// Security Dashboard Types

export type UserRole = 'super_admin' | 'admin' | 'vigilante' | 'usuario'

export interface User {
  id: string
  clerkUserId?: string
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
  buildingId: string
  guardName: string
  shiftStart: Date
  shiftEnd?: Date
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
  outstandingBalance: number
  lastPaymentDate?: Date
  subscriptionStatus: 'active' | 'past_due' | 'canceled' | 'trialing'
}

export interface ChatMessage {
  id: string
  buildingId: string
  userId?: string
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
  buildingId: string
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

// Bold Payment Types

export type BoldPaymentStatus = 'ACTIVE' | 'PROCESSING' | 'PAID' | 'REJECTED' | 'CANCELLED' | 'EXPIRED'
export type BoldAmountType = 'OPEN' | 'CLOSE'
export type BoldPaymentMethod = 'CREDIT_CARD' | 'PSE' | 'BOTON_BANCOLOMBIA' | 'NEQUI'

export interface BoldPaymentLink {
  id: string
  boldLinkId: string
  url: string
  amount: number
  amountType: BoldAmountType
  description: string
  status: BoldPaymentStatus
  paymentMethod?: BoldPaymentMethod
  transactionId?: string
  createdAt: Date
  expirationDate?: Date
}

export interface BoldPaymentMethodsResponse {
  payload: {
    payment_methods: {
      CREDIT_CARD?: { max: number; min: number }
      PSE?: { max: number; min: number }
      BOTON_BANCOLOMBIA?: { max: number; min: number }
      NEQUI?: { max: number; min: number }
    }
  }
  errors: string[]
}

export interface BoldCreateLinkRequest {
  amount_type: BoldAmountType
  amount?: {
    currency: string
    total_amount: number
    tip_amount?: number
    taxes?: Array<{
      type: 'VAT' | 'CONSUMPTION'
      base: number
      value: number
    }>
  }
  reference?: string
  description?: string
  expiration_date?: number
  payment_methods?: BoldPaymentMethod[]
  payer_email?: string
  image_url?: string
}

export interface BoldCreateLinkResponse {
  payload: {
    payment_link: string
    url: string
  }
  errors: string[]
}

export interface BoldPaymentStatusResponse {
  api_version: number
  id: string
  total: number
  subtotal: number
  tip_amount: number
  taxes: Array<{
    type: string
    base: number
    value: number
  }>
  status: BoldPaymentStatus
  expiration_date: number | null
  creation_date: number
  description: string | null
  payment_method: string | null
  transaction_id: string | null
  amount_type: BoldAmountType
  is_sandbox: boolean
  reference: string
}

// Assembly and Voting Types
export interface Assembly {
  id: string
  buildingId: string
  title: string
  description: string
  date: Date
  time: string
  location: string
  status: 'scheduled' | 'active' | 'completed' | 'cancelled'
  createdAt: Date
  createdBy: string
}

export interface AssemblyVote {
  id: string
  assemblyId: string
  title: string
  description: string
  options: VoteOption[]
  status: 'pending' | 'active' | 'closed'
  requiredQuorum?: number
  createdAt: Date
  createdBy: string
}

export interface VoteOption {
  id: string
  label: string
  votes: number
}

export interface VoteResponse {
  id: string
  voteId: string
  userId: string
  userName: string
  unit: string
  optionId: string
  votedAt: Date
}

// Intercom (Citofono) Types
export interface IntercomUnit {
  id: string
  buildingId: string
  unitNumber: string
  ownerId?: string
  ownerName?: string
  ownerPhone?: string
  ownerEmail?: string
  tenantId?: string
  tenantName?: string
  tenantPhone?: string
  tenantEmail?: string
}

export interface IntercomCall {
  id: string
  buildingId: string
  unitId: string
  unitNumber: string
  callerType: 'visitor' | 'delivery' | 'other'
  callerName?: string
  callerMessage?: string
  status: 'pending' | 'approved' | 'rejected' | 'expired'
  createdAt: Date
  respondedAt?: Date
  respondedBy?: string
  responseNote?: string
}

export interface IntercomNotification {
  id: string
  callId: string
  userId: string
  userName: string
  buildingId: string
  unitId: string
  unitNumber: string
  title: string
  body: string
  status: 'pending' | 'read' | 'action_taken'
  createdAt: Date
}
