import { createClient } from '@libsql/client';

const turso = createClient({
  url: process.env.DATABASE_URL_TURSO!,
  authToken: process.env.DATABASE_TOKEN_TURSO!
});

// Import mock data
const mockData = require('../lib/mock-data');

async function seedTursoFinal() {
  console.log('=== Seeding Turso Database (Final) ===');
  
  try {
    // Clear existing data (optional - comment out if you want to preserve data)
    console.log('Clearing existing data...');
    const tables = [
      'communications', 'marketplace_products', 'rental_listings', 
      'tenant_vehicles', 'tenants', 'residents', 'alerts', 'visitors',
      'parking_spots', 'payments', 'users', 'buildings'
    ];
    
    for (const table of tables) {
      await turso.execute(`DELETE FROM ${table}`);
      console.log(`Cleared ${table}`);
    }
    
    // Seed buildings FIRST (needed for foreign keys)
    console.log('Seeding buildings...');
    for (const building of mockData.mockBuildingStats) {
      await turso.execute(`
        INSERT INTO buildings (id, name, address, total_units, total_parking_spots, 
                              visitor_parking_spots, monthly_fee, currency, 
                              outstanding_balance, last_payment_date, subscription_status, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        building.id,
        building.name,
        building.address,
        building.totalUnits,
        building.totalParkingSpots,
        building.visitorParkingSpots,
        Math.round(building.monthlyRevenue / building.totalUnits), // approximate monthly fee per unit
        'COP', // Default currency
        building.outstandingBalance,
        building.lastPaymentDate.toISOString(),
        building.subscriptionStatus,
        building.status
      ]);
    }
    
    // Seed users from mockUsers
    console.log('Seeding users...');
    for (const user of mockData.mockUsers) {
      await turso.execute(`
        INSERT INTO users (id, clerk_user_id, email, name, role, building_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        user.id,
        `clerk_${user.id}`, // Mock clerk ID
        user.email,
        user.name,
        user.role,
        user.buildingId || null,
        new Date().toISOString()
      ]);
    }
    
    // Seed payments
    console.log('Seeding payments...');
    for (const payment of mockData.mockPayments) {
      await turso.execute(`
        INSERT INTO payments (id, building_id, building_name, amount, currency, 
                             status, type, description, resident_unit, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        payment.id,
        payment.buildingId,
        payment.buildingName,
        payment.amount,
        payment.currency,
        payment.status,
        payment.type,
        payment.description,
        payment.residentUnit || null,
        payment.createdAt.toISOString()
      ]);
    }
    
    // Seed parking spots (for building-1 as example)
    console.log('Seeding parking spots...');
    for (const spot of mockData.mockParkingSpots) {
      await turso.execute(`
        INSERT INTO parking_spots (id, building_id, code, status, vehicle_plate, 
                                  visitor_name, resident_unit, entry_time, max_duration, time_remaining)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        spot.id,
        'building-1',
        spot.code,
        spot.status,
        spot.vehiclePlate || null,
        spot.visitorName || null,
        spot.residentUnit || null,
        spot.entryTime?.toISOString() || null,
        spot.maxDuration,
        spot.timeRemaining || null
      ]);
    }
    
    // Seed visitors
    console.log('Seeding visitors...');
    for (const visitor of mockData.mockVisitors) {
      await turso.execute(`
        INSERT INTO visitors (id, building_id, name, document_id, type, 
                             vehicle_plate, destination_unit, resident_name, 
                             entry_time, exit_time, parking_spot, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        visitor.id,
        'building-1',
        visitor.name,
        visitor.documentId,
        visitor.type,
        visitor.vehiclePlate || null,
        visitor.destinationUnit,
        visitor.residentName,
        visitor.entryTime.toISOString(),
        visitor.exitTime?.toISOString() || null,
        visitor.parkingSpot || null,
        visitor.status
      ]);
    }
    
    // Seed alerts
    console.log('Seeding alerts...');
    for (const alert of mockData.mockAlerts) {
      await turso.execute(`
        INSERT INTO alerts (id, building_id, type, title, message, 
                           timestamp, read, priority, related_id, action_required)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        alert.id,
        'building-1',
        alert.type,
        alert.title,
        alert.message,
        alert.timestamp.toISOString(),
        alert.read ? 1 : 0,
        alert.priority,
        alert.relatedId || null,
        alert.actionRequired ? 1 : 0
      ]);
    }
    
    // Seed residents
    console.log('Seeding residents...');
    for (const resident of mockData.mockResidents) {
      await turso.execute(`
        INSERT INTO residents (id, building_id, name, unit, phone, email, 
                              parking_spots, balance, is_tenant)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        resident.id,
        'building-1',
        resident.name,
        resident.unit,
        resident.phone,
        resident.email,
        JSON.stringify(resident.parkingSpots),
        resident.balance,
        resident.isTenant ? 1 : 0
      ]);
    }
    
    // Seed tenants
    console.log('Seeding tenants...');
    for (const tenant of mockData.mockTenants) {
      await turso.execute(`
        INSERT INTO tenants (id, building_id, name, document_id, phone, email, 
                            unit, owner_id, owner_name, owner_unit, 
                            lease_start, lease_end, monthly_rent, deposit_paid, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        tenant.id,
        tenant.buildingId,
        tenant.name,
        tenant.documentId,
        tenant.phone,
        tenant.email,
        tenant.unit,
        tenant.ownerId,
        tenant.ownerName,
        tenant.ownerUnit,
        tenant.leaseStart.toISOString(),
        tenant.leaseEnd.toISOString(),
        tenant.monthlyRent,
        tenant.depositPaid,
        tenant.status
      ]);
    }
    
    // Seed tenant vehicles
    console.log('Seeding tenant vehicles...');
    for (const tenant of mockData.mockTenants) {
      for (const vehicle of tenant.vehicles) {
        await turso.execute(`
          INSERT INTO tenant_vehicles (id, tenant_id, plate, brand, model, 
                                      color, parking_spot, type)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          vehicle.id,
          tenant.id,
          vehicle.plate,
          vehicle.brand,
          vehicle.model,
          vehicle.color,
          vehicle.parkingSpot || null,
          vehicle.type
        ]);
      }
    }
    
    // Seed rental listings
    console.log('Seeding rental listings...');
    for (const rental of mockData.mockRentalListings) {
      await turso.execute(`
        INSERT INTO rental_listings (id, building_id, owner_id, owner_name, owner_unit,
                                    type, title, description, price, currency, period, 
                                    available, available_from, rooms, bathrooms, area, 
                                    parking_code, images, amenities, contact_phone, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        rental.id,
        rental.buildingId,
        rental.ownerId,
        rental.ownerName,
        rental.ownerUnit,
        rental.type,
        rental.title,
        rental.description,
        rental.price,
        rental.currency,
        rental.period,
        rental.available ? 1 : 0,
        rental.availableFrom.toISOString(),
        rental.rooms || null,
        rental.bathrooms || null,
        rental.area || null,
        rental.parkingCode || null,
        JSON.stringify(rental.images),
        JSON.stringify(rental.amenities),
        rental.contactPhone,
        rental.status
      ]);
    }
    
    // Seed marketplace products
    console.log('Seeding marketplace products...');
    for (const product of mockData.mockMarketplace) {
      await turso.execute(`
        INSERT INTO marketplace_products (id, building_id, seller_id, seller_name, seller_unit,
                                         title, description, price, category, available, 
                                         images, contact_phone, whatsapp, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        product.id,
        product.buildingId,
        product.sellerId,
        product.sellerName,
        product.sellerUnit,
        product.title,
        product.description,
        product.price,
        product.category,
        product.available ? 1 : 0,
        JSON.stringify(product.images),
        product.contactPhone,
        product.whatsapp,
        product.createdAt.toISOString()
      ]);
    }
    
    // Seed communications
    console.log('Seeding communications...');
    for (const comm of mockData.mockCommunications) {
      await turso.execute(`
        INSERT INTO communications (id, building_id, author_id, author_name, title, message,
                                   type, priority, target_roles, includes_tenants, sent_at, 
                                   read_by, attachments)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        comm.id,
        comm.buildingId,
        comm.authorId,
        comm.authorName,
        comm.title,
        comm.message,
        comm.type,
        comm.priority,
        JSON.stringify(comm.targetRoles),
        comm.includesTenants ? 1 : 0,
        comm.sentAt.toISOString(),
        JSON.stringify(comm.readBy),
        JSON.stringify(comm.attachments)
      ]);
    }
    
    // Update system stats from mockSystemStats
    console.log('Updating system stats...');
    await turso.execute(`
      UPDATE system_stats SET
        total_buildings = ?,
        active_buildings = ?,
        total_residents = ?,
        total_revenue = ?,
        monthly_recurring_revenue = ?,
        pending_payments = ?,
        system_alerts = ?,
        updated_at = ?
      WHERE id = 1
    `, [
      mockData.mockSystemStats.totalBuildings,
      mockData.mockSystemStats.activeBuildings,
      mockData.mockSystemStats.totalResidents,
      mockData.mockSystemStats.totalRevenue,
      mockData.mockSystemStats.monthlyRecurringRevenue,
      mockData.mockSystemStats.pendingPayments,
      mockData.mockSystemStats.systemAlerts,
      new Date().toISOString()
    ]);
    
    console.log('Turso seeding completed successfully!');
    
  } catch (error) {
    console.error('Turso seeding failed:', error);
    throw error;
  }
}

seedTursoFinal();