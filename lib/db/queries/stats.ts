import 'server-only'
import { queryOne, queryMany, executeInsert } from './helpers'
import { getSupabaseAdmin } from '@/lib/db/supabase'

export interface AdminTenantMetric {
  adminId: string
  adminName: string
  adminEmail: string
  organizationId: string | null
  organizationName: string
  tenantType: 'hogar' | 'grupo' | 'comunidad' | 'inmobiliaria' | 'legacy'
  buildingCount: number
  totalResidents: number
  monthlyRevenue: number
  outstandingBalance: number
  subscriptionStatus: string
  buildingNames: string[]
}

export interface PlatformHealth {
  totalActiveDevices: number
  devicesByType: {
    ios: number
    android: number
    web: number
    unknown: number
    raw: Record<string, number>
  }
  mobileDevices: number
  webDevices: number
  recentAlertsCount: number
  unreadHighAlertsCount: number
  recentAuditErrorsCount: number
  lastUpdated: string
}

export interface DbSystemStats {
  id: string
  total_buildings: number
  active_buildings: number
  total_residents: number
  total_revenue: number
  monthly_recurring_revenue: number
  pending_payments: number
  system_alerts: number
  updated_at: string
}

export async function getSystemStatsById(id: string): Promise<DbSystemStats | null> {
  return queryOne<DbSystemStats>(
    'SELECT * FROM system_stats WHERE id = ?',
    [id]
  )
}

export async function getSystemStats(): Promise<DbSystemStats | null> {
  // Intenta leer snapshot guardado
  const snapshot = await queryOne<DbSystemStats>(
    'SELECT * FROM system_stats ORDER BY updated_at DESC LIMIT 1',
    []
  )
  if (snapshot) return snapshot

  // Cálculo en tiempo real desde tablas base
  const buildings = await queryMany<{id:string, subscription_status:string, monthly_fee:number, outstanding_balance:number}>(
    'SELECT id, subscription_status, monthly_fee, outstanding_balance FROM buildings',
    []
  )
  const users = await queryMany<{id:string, role:string, building_id:string|null}>(
    'SELECT id, role, building_id FROM users',
    []
  )

  const totalBuildings = buildings.length
  const activeBuildings = buildings.filter(b => b.subscription_status === 'active').length
  const totalResidents = users.filter(u => u.role === 'usuario' || u.role === 'residente').length
  const monthlyRecurringRevenue = buildings
    .filter(b => b.subscription_status === 'active')
    .reduce((sum, b) => sum + Number(b.monthly_fee || 0), 0)
  const totalRevenue = buildings.reduce((sum, b) => sum + Number(b.monthly_fee || 0), 0)
  const pendingPayments = buildings.reduce((sum, b) => sum + Number(b.outstanding_balance || 0), 0)

  const alerts = await queryMany<{read:number, action_required:number, priority:string}>(
    'SELECT read, action_required, priority FROM alerts',
    []
  )
  const systemAlerts = alerts.filter(a => a.read === 0 && (a.priority === 'critical' || a.priority === 'high' || a.action_required === 1)).length

  return {
    id: crypto.randomUUID(),
    total_buildings: totalBuildings,
    active_buildings: activeBuildings,
    total_residents: totalResidents,
    total_revenue: totalRevenue,
    monthly_recurring_revenue: monthlyRecurringRevenue,
    pending_payments: pendingPayments,
    system_alerts: systemAlerts,
    updated_at: new Date().toISOString()
  }
}

export async function createSystemStats(stats: {
  total_buildings: number
  active_buildings: number
  total_residents: number
  total_revenue: number
  monthly_recurring_revenue: number
  pending_payments: number
  system_alerts: number
}): Promise<void> {
  const id = crypto.randomUUID()
  await executeInsert(
    'INSERT INTO system_stats (id, total_buildings, active_buildings, total_residents, total_revenue, monthly_recurring_revenue, pending_payments, system_alerts, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, stats.total_buildings, stats.active_buildings, stats.total_residents, stats.total_revenue, stats.monthly_recurring_revenue, stats.pending_payments, stats.system_alerts, new Date().toISOString()]
  )
}

export async function updateSystemStats(id: string, updates: Partial<DbSystemStats>): Promise<void> {
  const fields: string[] = []
  const values: (string | number | null)[] = []
  if (updates.total_buildings !== undefined) { fields.push('total_buildings = ?'); values.push(updates.total_buildings) }
  if (updates.active_buildings !== undefined) { fields.push('active_buildings = ?'); values.push(updates.active_buildings) }
  if (updates.total_residents !== undefined) { fields.push('total_residents = ?'); values.push(updates.total_residents) }
  if (updates.total_revenue !== undefined) { fields.push('total_revenue = ?'); values.push(updates.total_revenue) }
  if (updates.monthly_recurring_revenue !== undefined) { fields.push('monthly_recurring_revenue = ?'); values.push(updates.monthly_recurring_revenue) }
  if (updates.pending_payments !== undefined) { fields.push('pending_payments = ?'); values.push(updates.pending_payments) }
  if (updates.system_alerts !== undefined) { fields.push('system_alerts = ?'); values.push(updates.system_alerts) }
  if (fields.length === 0) return
  values.push(id)
  await executeInsert(
    `UPDATE system_stats SET ${fields.join(', ')} WHERE id = ?`,
    values
  )
}

export async function deleteSystemStats(id: string): Promise<void> {
  await executeInsert(
    'DELETE FROM system_stats WHERE id = ?',
    [id]
  )
}

interface RawBuildingRow {
  id: string
  name: string
  organization_id: string | null
  monthly_fee: number | null
  outstanding_balance: number | null
  subscription_status: string | null
}

interface RawUserRow {
  id: string
  name: string | null
  email: string | null
  role: string
  building_id: string | null
  organization_id: string | null
}

interface RawOrgRow {
  id: string
  name: string
  type: 'hogar' | 'grupo' | 'comunidad' | 'inmobiliaria'
  owner_user_id: string | null
  status: string | null
  contact_email: string | null
}

interface RawOrgMemberRow {
  organization_id: string
  user_id: string
  role: string
  status: string
}

interface RawSubscriptionRow {
  organization_id: string | null
  building_id: string | null
  status: string
}

export async function getAdminTenantMetrics(): Promise<AdminTenantMetric[]> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return []

  const [buildingsRes, usersRes, orgsRes, membersRes, subsRes] = await Promise.all([
    supabase
      .from('buildings')
      .select('id, name, organization_id, monthly_fee, outstanding_balance, subscription_status'),
    supabase
      .from('users')
      .select('id, name, email, role, building_id, organization_id'),
    supabase
      .from('organizations')
      .select('id, name, type, owner_user_id, status, contact_email'),
    supabase
      .from('organization_members')
      .select('organization_id, user_id, role, status')
      .eq('status', 'active'),
    supabase
      .from('subscriptions')
      .select('organization_id, building_id, status'),
  ])

  const buildings = (buildingsRes.data || []) as RawBuildingRow[]
  const users = (usersRes.data || []) as RawUserRow[]
  const orgs = (orgsRes.error ? [] : orgsRes.data || []) as RawOrgRow[]
  const members = (membersRes.error ? [] : membersRes.data || []) as RawOrgMemberRow[]
  const subscriptions = (subsRes.error ? [] : subsRes.data || []) as RawSubscriptionRow[]

  const userById = new Map<string, RawUserRow>()
  for (const u of users) {
    userById.set(u.id, u)
  }

  const isResident = (u: RawUserRow) => u.role === 'usuario' || u.role === 'residente'
  const metrics: AdminTenantMetric[] = []
  const coveredBuildingIds = new Set<string>()
  const coveredAdminIds = new Set<string>()

  // 1. Group by organization
  for (const org of orgs) {
    const orgBuildings = buildings.filter(b => b.organization_id === org.id)
    for (const b of orgBuildings) {
      coveredBuildingIds.add(b.id)
    }
    const orgBuildingIds = new Set(orgBuildings.map(b => b.id))

    const orgMembers = members.filter(m => m.organization_id === org.id)
    const titularMember = orgMembers.find(m => m.role === 'titular') || orgMembers.find(m => m.role === 'admin')
    const primaryAdmin =
      (org.owner_user_id ? userById.get(org.owner_user_id) : undefined) ||
      (titularMember ? userById.get(titularMember.user_id) : undefined) ||
      users.find(u => u.organization_id === org.id && u.role === 'admin')

    if (primaryAdmin) {
      coveredAdminIds.add(primaryAdmin.id)
    }

    const residentIds = new Set<string>()
    for (const u of users) {
      if (!isResident(u)) continue
      if (u.organization_id === org.id || (u.building_id && orgBuildingIds.has(u.building_id))) {
        residentIds.add(u.id)
      }
    }

    const monthlyRevenue = orgBuildings.reduce((sum, b) => sum + Number(b.monthly_fee || 0), 0)
    const outstandingBalance = orgBuildings.reduce((sum, b) => sum + Number(b.outstanding_balance || 0), 0)

    const orgSub = subscriptions.find(s => s.organization_id === org.id)
    const hasPastDueBuilding = orgBuildings.some(b => b.subscription_status === 'past_due')
    const subscriptionStatus =
      orgSub?.status ||
      (hasPastDueBuilding ? 'past_due' : org.status || orgBuildings[0]?.subscription_status || 'active')

    metrics.push({
      adminId: primaryAdmin?.id || `org-${org.id}`,
      adminName: primaryAdmin?.name || org.name,
      adminEmail: primaryAdmin?.email || org.contact_email || 'Sin correo',
      organizationId: org.id,
      organizationName: org.name,
      tenantType: org.type || 'hogar',
      buildingCount: orgBuildings.length,
      totalResidents: residentIds.size,
      monthlyRevenue,
      outstandingBalance,
      subscriptionStatus,
      buildingNames: orgBuildings.map(b => b.name),
    })
  }

  // 2. Legacy buildings without organization (grouped by their admin user or building)
  const legacyBuildings = buildings.filter(b => !coveredBuildingIds.has(b.id))
  const legacyByAdmin = new Map<string, { admin: RawUserRow | null; buildings: RawBuildingRow[] }>()

  for (const b of legacyBuildings) {
    const admin = users.find(u => u.role === 'admin' && u.building_id === b.id) || null
    const key = admin ? admin.id : `unassigned-${b.id}`
    if (admin) coveredAdminIds.add(admin.id)
    const existing = legacyByAdmin.get(key)
    if (existing) {
      existing.buildings.push(b)
    } else {
      legacyByAdmin.set(key, { admin, buildings: [b] })
    }
  }

  for (const [key, entry] of legacyByAdmin.entries()) {
    const bIds = new Set(entry.buildings.map(b => b.id))
    const totalResidents = users.filter(u => isResident(u) && u.building_id && bIds.has(u.building_id)).length
    const monthlyRevenue = entry.buildings.reduce((sum, b) => sum + Number(b.monthly_fee || 0), 0)
    const outstandingBalance = entry.buildings.reduce((sum, b) => sum + Number(b.outstanding_balance || 0), 0)
    const hasPastDue = entry.buildings.some(b => b.subscription_status === 'past_due')
    const subscriptionStatus = hasPastDue ? 'past_due' : (entry.buildings[0]?.subscription_status || 'active')

    metrics.push({
      adminId: key,
      adminName: entry.admin?.name || 'Sin administrador asignado',
      adminEmail: entry.admin?.email || '—',
      organizationId: null,
      organizationName: 'Sin organización (Legacy)',
      tenantType: 'legacy',
      buildingCount: entry.buildings.length,
      totalResidents,
      monthlyRevenue,
      outstandingBalance,
      subscriptionStatus,
      buildingNames: entry.buildings.map(b => b.name),
    })
  }

  // 3. Admins without buildings or organization
  for (const u of users) {
    if (u.role === 'admin' && !coveredAdminIds.has(u.id)) {
      metrics.push({
        adminId: u.id,
        adminName: u.name || 'Administrador',
        adminEmail: u.email || '—',
        organizationId: u.organization_id,
        organizationName: 'Sin edificios asignados',
        tenantType: 'legacy',
        buildingCount: 0,
        totalResidents: 0,
        monthlyRevenue: 0,
        outstandingBalance: 0,
        subscriptionStatus: 'trialing',
        buildingNames: [],
      })
    }
  }

  return metrics.sort((a, b) => b.monthlyRevenue - a.monthlyRevenue || b.buildingCount - a.buildingCount)
}

export async function getPlatformHealth(): Promise<PlatformHealth> {
  const fallback: PlatformHealth = {
    totalActiveDevices: 0,
    devicesByType: { ios: 0, android: 0, web: 0, unknown: 0, raw: {} },
    mobileDevices: 0,
    webDevices: 0,
    recentAlertsCount: 0,
    unreadHighAlertsCount: 0,
    recentAuditErrorsCount: 0,
    lastUpdated: new Date().toISOString(),
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) return fallback

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [tokensRes, alertsRes, auditRes] = await Promise.all([
    supabase
      .from('device_tokens')
      .select('device_type, is_active')
      .eq('is_active', true),
    supabase
      .from('alerts')
      .select('id, priority, read, action_required, created_at')
      .gte('created_at', sevenDaysAgo),
    supabase
      .from('audit_log')
      .select('id, action, created_at')
      .gte('created_at', sevenDaysAgo),
  ])

  let ios = 0
  let android = 0
  let web = 0
  let unknown = 0
  const raw: Record<string, number> = {}

  if (!tokensRes.error && tokensRes.data) {
    for (const row of tokensRes.data as Array<{ device_type?: string | null }>) {
      const typeKey = (row.device_type || 'unknown').toLowerCase().trim() || 'unknown'
      raw[typeKey] = (raw[typeKey] || 0) + 1

      if (typeKey.includes('ios') || typeKey.includes('iphone') || typeKey.includes('ipad')) {
        ios += 1
      } else if (typeKey.includes('android')) {
        android += 1
      } else if (typeKey.includes('web') || typeKey.includes('pwa') || typeKey.includes('browser') || typeKey.includes('desktop')) {
        web += 1
      } else {
        unknown += 1
      }
    }
  }

  const alertsData = (!alertsRes.error && alertsRes.data ? alertsRes.data : []) as Array<{
    priority: string
    read: boolean
    action_required: boolean
  }>
  const recentAlertsCount = alertsData.length
  const unreadHighAlertsCount = alertsData.filter(
    a => !a.read && (a.priority === 'critical' || a.priority === 'high' || a.action_required)
  ).length

  const auditData = (!auditRes.error && auditRes.data ? auditRes.data : []) as Array<{
    action: string
  }>
  const recentAuditErrorsCount = auditData.filter(a => {
    const act = (a.action || '').toLowerCase()
    return act.includes('error') || act.includes('fail') || act.includes('block') || act.includes('deny')
  }).length

  const mobileDevices = ios + android
  const totalActiveDevices = ios + android + web + unknown

  return {
    totalActiveDevices,
    devicesByType: { ios, android, web, unknown, raw },
    mobileDevices,
    webDevices: web,
    recentAlertsCount,
    unreadHighAlertsCount,
    recentAuditErrorsCount,
    lastUpdated: new Date().toISOString(),
  }
}

export interface OrganizationCrmAdmin {
  id: string
  name: string
  email: string
  role: string
  status: string
}

export interface OrganizationCrmBuilding {
  id: string
  name: string
  address: string
  total_units: number
  monthly_fee: number
  outstanding_balance: number
  subscription_status: string
}

export interface OrganizationCrmSubscription {
  id: string
  status: string
  plan_id: string | null
  plan_code: string | null
  plan_name: string | null
  max_buildings: number | null
  max_admin_users: number | null
  max_units: number | null
  price_cop: number | null
  current_period_end: string | null
  blocked_at: string | null
}

export interface OrganizationCrmItem {
  id: string
  name: string
  type: 'hogar' | 'grupo' | 'comunidad' | 'inmobiliaria'
  status: 'active' | 'suspended' | 'blocked' | 'canceled'
  owner_user_id: string | null
  contact_email: string | null
  contact_phone: string | null
  created_at: string
  updated_at: string
  owner: OrganizationCrmAdmin | null
  admins: OrganizationCrmAdmin[]
  buildings: OrganizationCrmBuilding[]
  buildings_count: number
  residents_count: number
  monthly_revenue: number
  outstanding_balance: number
  subscription: OrganizationCrmSubscription | null
}

interface RawCrmOrgRow {
  id: string
  name: string
  type: 'hogar' | 'grupo' | 'comunidad' | 'inmobiliaria'
  status: 'active' | 'suspended' | 'blocked' | 'canceled'
  owner_user_id: string | null
  contact_email: string | null
  contact_phone: string | null
  created_at: string
  updated_at: string
}

interface RawCrmBuildingRow {
  id: string
  name: string
  address: string | null
  organization_id: string | null
  total_units: number | null
  monthly_fee: number | null
  outstanding_balance: number | null
  subscription_status: string | null
}

interface RawCrmSubRow {
  id: string
  organization_id: string | null
  building_id: string | null
  status: string
  plan_id: string | null
  current_period_end: string | null
  blocked_at: string | null
  created_at: string
  plans?: {
    code?: string | null
    name?: string | null
    max_buildings?: number | null
    max_admin_users?: number | null
    max_units?: number | null
    price_cop?: number | null
  } | null
}

/**
 * Fetches all organizations enriched with owner/admins, buildings, residents count,
 * revenue/mora totals, and current subscription/plan limits for Super Admin CRM.
 */
export async function getSuperAdminOrganizationsCrm(): Promise<OrganizationCrmItem[]> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return []

  const [orgsRes, buildingsRes, usersRes, membersRes, subsRes] = await Promise.all([
    supabase
      .from('organizations')
      .select('id, name, type, status, owner_user_id, contact_email, contact_phone, created_at, updated_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('buildings')
      .select('id, name, address, organization_id, total_units, monthly_fee, outstanding_balance, subscription_status'),
    supabase
      .from('users')
      .select('id, name, email, role, building_id, organization_id'),
    supabase
      .from('organization_members')
      .select('organization_id, user_id, role, status'),
    supabase
      .from('subscriptions')
      .select('id, organization_id, building_id, status, plan_id, current_period_end, blocked_at, created_at, plans(code, name, max_buildings, max_admin_users, max_units, price_cop)')
      .order('created_at', { ascending: false }),
  ])

  if (orgsRes.error || !orgsRes.data) return []

  const orgs = orgsRes.data as RawCrmOrgRow[]
  const buildings = (buildingsRes.error ? [] : buildingsRes.data || []) as RawCrmBuildingRow[]
  const users = (usersRes.error ? [] : usersRes.data || []) as RawUserRow[]
  const members = (membersRes.error ? [] : membersRes.data || []) as RawOrgMemberRow[]
  const subscriptions = (subsRes.error ? [] : subsRes.data || []) as RawCrmSubRow[]

  const userById = new Map<string, RawUserRow>()
  for (const u of users) {
    userById.set(u.id, u)
  }

  const isResident = (u: RawUserRow) => u.role === 'usuario' || u.role === 'residente'

  return orgs.map((org): OrganizationCrmItem => {
    const orgBuildings = buildings.filter(b => b.organization_id === org.id)
    const orgBuildingIds = new Set(orgBuildings.map(b => b.id))

    const orgMembers = members.filter(m => m.organization_id === org.id)
    const adminMembers: OrganizationCrmAdmin[] = []
    const seenAdminIds = new Set<string>()

    const addAdmin = (u: RawUserRow | undefined, memberRole: string, memberStatus: string) => {
      if (!u || seenAdminIds.has(u.id)) return
      seenAdminIds.add(u.id)
      adminMembers.push({
        id: u.id,
        name: u.name || 'Sin nombre',
        email: u.email || 'Sin correo',
        role: memberRole,
        status: memberStatus,
      })
    }

    if (org.owner_user_id) {
      addAdmin(userById.get(org.owner_user_id), 'titular', 'active')
    }
    for (const m of orgMembers) {
      if (m.role === 'titular' || m.role === 'admin') {
        addAdmin(userById.get(m.user_id), m.role, m.status)
      }
    }
    for (const u of users) {
      if (u.organization_id === org.id && u.role === 'admin') {
        addAdmin(u, 'admin', 'active')
      }
    }

    const owner =
      adminMembers.find(a => a.id === org.owner_user_id) ||
      adminMembers.find(a => a.role === 'titular') ||
      adminMembers[0] ||
      null

    const residentIds = new Set<string>()
    for (const u of users) {
      if (!isResident(u)) continue
      if (u.organization_id === org.id || (u.building_id && orgBuildingIds.has(u.building_id))) {
        residentIds.add(u.id)
      }
    }

    const monthly_revenue = orgBuildings.reduce((sum, b) => sum + Number(b.monthly_fee || 0), 0)
    const outstanding_balance = orgBuildings.reduce((sum, b) => sum + Number(b.outstanding_balance || 0), 0)

    const sub =
      subscriptions.find(s => s.organization_id === org.id && s.status === 'active') ||
      subscriptions.find(s => s.organization_id === org.id) ||
      subscriptions.find(s => s.building_id && orgBuildingIds.has(s.building_id) && s.status === 'active') ||
      subscriptions.find(s => s.building_id && orgBuildingIds.has(s.building_id)) ||
      null

    const subscription: OrganizationCrmSubscription | null = sub
      ? {
          id: sub.id,
          status: sub.status,
          plan_id: sub.plan_id,
          plan_code: sub.plans?.code ?? null,
          plan_name: sub.plans?.name ?? null,
          max_buildings: sub.plans?.max_buildings ?? null,
          max_admin_users: sub.plans?.max_admin_users ?? null,
          max_units: sub.plans?.max_units ?? null,
          price_cop: sub.plans?.price_cop ?? null,
          current_period_end: sub.current_period_end,
          blocked_at: sub.blocked_at,
        }
      : null

    return {
      ...org,
      owner,
      admins: adminMembers,
      buildings: orgBuildings.map(b => ({
        id: b.id,
        name: b.name,
        address: b.address || '',
        total_units: Number(b.total_units || 0),
        monthly_fee: Number(b.monthly_fee || 0),
        outstanding_balance: Number(b.outstanding_balance || 0),
        subscription_status: b.subscription_status || 'active',
      })),
      buildings_count: orgBuildings.length,
      residents_count: residentIds.size,
      monthly_revenue,
      outstanding_balance,
      subscription,
    }
  })
}
