import { createClient } from '@libsql/client';

const turso = createClient({
  url: process.env.DATABASE_URL_TURSO!,
  authToken: process.env.DATABASE_TOKEN_TURSO!
});

async function checkBuildingsSchema() {
  console.log('=== Checking Buildings Schema in Turso ===');
  
  try {
    const result = await turso.execute(`
      SELECT * FROM pragma_table_info('buildings')
    `);
    
    console.log('Columns in buildings table:');
    const columns = result.rows.map(row => row.name);
    console.log(JSON.stringify(columns, null, 2));
    
    // Check for specific columns we need
    const neededColumns = ['last_payment_date', 'subscription_status'];
    for (const col of neededColumns) {
      const exists = columns.includes(col);
      console.log(`${col}: ${exists ? '✓ EXISTS' : '✗ MISSING'}`);
    }
    
  } catch (error) {
    console.error('Error checking buildings schema:', error);
  }
}

checkBuildingsSchema();