import { createClient } from '@libsql/client';

const turso = createClient({
  url: process.env.DATABASE_URL_TURSO!,
  authToken: process.env.DATABASE_TOKEN_TURSO!
});

// Import mock data
const mockData = require('../lib/mock-data');

async function seedTursoExtended() {
  console.log('=== Seeding Turso Database (Extended) ===');
  
  try {
    // Clear existing data for new tables (optional)
    console.log('Clearing existing data for new tables...');
    const tables = ['users', 'system_stats'];
    
    for (const table of tables) {
      await turso.execute(`DELETE FROM ${table}`);
      console.log(`Cleared ${table}`);
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
    
    // Seed system stats from mockSystemStats
    console.log('Seeding system stats...');
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
    
    console.log('Turso extended seeding completed successfully!');
    
  } catch (error) {
    console.error('Turso extended seeding failed:', error);
    throw error;
  }
}

seedTursoExtended();