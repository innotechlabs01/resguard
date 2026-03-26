import { createClient } from '@libsql/client';

const turso = createClient({
  url: process.env.DATABASE_URL_TURSO!,
  authToken: process.env.DATABASE_TOKEN_TURSO!
});

async function checkTursoTables() {
  console.log('=== Checking Turso Tables ===');
  
  try {
    const result = await turso.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='table'
      ORDER BY name
    `);
    
    console.log('Tables in Turso database:');
    console.log(JSON.stringify(result.rows, null, 2));
    
  } catch (error) {
    console.error('Error checking tables:', error);
  }
}

checkTursoTables();