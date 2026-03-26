import { createClient } from '@libsql/client';

const turso = createClient({
  url: process.env.DATABASE_URL_TURSO!,
  authToken: process.env.DATABASE_TOKEN_TURSO!
});

async function checkBuildings() {
  console.log('=== Checking Buildings in Turso ===');
  
  try {
    const result = await turso.execute(`
      SELECT id, name FROM buildings
    `);
    
    console.log('Buildings in database:');
    console.log(JSON.stringify(result.rows, null, 2));
    
  } catch (error) {
    console.error('Error checking buildings:', error);
  }
}

checkBuildings();