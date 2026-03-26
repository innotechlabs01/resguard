import { createClient } from '@libsql/client';

const turso = createClient({
  url: process.env.DATABASE_URL_TURSO!,
  authToken: process.env.DATABASE_TOKEN_TURSO!
});

// Import mock data
const mockData = require('../lib/mock-data');

async function debugSeed() {
  console.log('=== Debugging Turso Seeding ===');
  
  try {
    // Test with just one building
    const building = mockData.mockBuildingStats[0];
    console.log('Building data:', building);
    
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
      building.currency,
      building.outstandingBalance,
      building.lastPaymentDate.toISOString(),
      building.subscriptionStatus,
      building.status
    ]);
    
    console.log('Building inserted successfully!');
    
  } catch (error) {
    console.error('Error:', error);
    // Let's check each value
    const building = mockData.mockBuildingStats[0];
    console.log('Values:');
    console.log('1. id:', building.id, typeof building.id);
    console.log('2. name:', building.name, typeof building.name);
    console.log('3. address:', building.address, typeof building.address);
    console.log('4. total_units:', building.totalUnits, typeof building.totalUnits);
    console.log('5. total_parking_spots:', building.totalParkingSpots, typeof building.totalParkingSpots);
    console.log('6. visitor_parking_spots:', building.visitorParkingSpots, typeof building.visitorParkingSpots);
    console.log('7. monthly_fee:', Math.round(building.monthlyRevenue / building.totalUnits), typeof Math.round(building.monthlyRevenue / building.totalUnits));
    console.log('8. currency:', building.currency, typeof building.currency);
    console.log('9. outstanding_balance:', building.outstandingBalance, typeof building.outstandingBalance);
    console.log('10. last_payment_date:', building.lastPaymentDate.toISOString(), typeof building.lastPaymentDate.toISOString());
    console.log('11. subscription_status:', building.subscriptionStatus, typeof building.subscriptionStatus);
    console.log('12. status:', building.status, typeof building.status);
  }
}

debugSeed();