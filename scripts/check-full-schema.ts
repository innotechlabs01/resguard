import { createClient } from '@libsql/client';

const turso = createClient({
  url: process.env.DATABASE_URL_TURSO!,
  authToken: process.env.DATABASE_TOKEN_TURSO!
});

async function checkFullSchema() {
  console.log('=== Checking Full Schema in Turso ===');
  
  try {
    const tables = await turso.execute(`
      SELECT name FROM sqlite_master WHERE type='table'
    `);
    
    console.log('Tables in database:');
    for (const table of tables.rows) {
      console.log(`\nTable: ${table.name}`);
      const columns = await turso.execute(`PRAGMA table_info(${table.name})`);
      console.log(JSON.stringify(columns.rows, null, 2));
    }
    
  } catch (error) {
    console.error('Error checking schema:', error);
  }
}

checkFullSchema();