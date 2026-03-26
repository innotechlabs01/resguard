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
    console.log(JSON.stringify(result.rows, null, 2));
    
  } catch (error) {
    console.error('Error checking buildings schema:', error);
  }
}

checkBuildingsSchema();