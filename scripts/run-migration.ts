import { createClient } from '@libsql/client';

const turso = createClient({
  url: process.env.DATABASE_URL_TURSO!,
  authToken: process.env.DATABASE_TOKEN_TURSO!
});

async function runMigration() {
  try {
    console.log('Reading migration file...');
    const fs = require('fs');
    const sqlContent = fs.readFileSync('./turso/migrations/001_init.sql', 'utf8');
    
    console.log('Raw SQL content:');
    console.log(sqlContent);
    
    // Remove comments and empty lines, then split by semicolon
    const cleanedContent = sqlContent
      .replace(/--.*$/gm, '')  // Remove single line comments
      .replace(/\/\*[\s\S]*?\*\//g, '')  // Remove multi-line comments
      .trim();
    
    console.log('Cleaned SQL content:');
    console.log(cleanedContent);
    
    // Split by semicolon and filter out empty statements
    const statements = cleanedContent
      .split(';')
      .map((statement: string) => statement.trim())
      .filter((statement: string) => statement.length > 0);
    
    console.log(`Found ${statements.length} statements:`);
    statements.forEach((stmt: string, index: number) => {
      console.log(`${index + 1}: ${stmt}`);
    });
    
    // Execute each statement in order
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        console.log(`Executing statement ${i + 1}: ${statement.substring(0, 100)}...`);
        await turso.execute(statement);
      }
    }
    
    console.log('Migration completed successfully!');
    
    // Verify the tables were created
    const result = await turso.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='profiles'
    `);
    
    console.log('Tables in database:', JSON.stringify(result.rows));
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();