import { createClient } from '@libsql/client';
import { execSync } from 'child_process';

async function runTursoMigration() {
  console.log('=== Running Turso Migrations ===');
  
  const turso = createClient({
    url: process.env.DATABASE_URL_TURSO!,
    authToken: process.env.DATABASE_TOKEN_TURSO!
  });

  try {
    // Run all migration files in order
    const migrationFiles = [
      '001_init.sql',
      '002_add_tables.sql', 
      '003_add_missing_tables.sql',
      '004_add_outstanding_balance_to_buildings.sql',
      '005_add_missing_building_columns.sql',
      '006_add_shift_reports.sql',
      '007_add_chat_messages.sql'
    ];
    
    for (const migrationFile of migrationFiles) {
      console.log(`\n--- Running ${migrationFile} ---`);
      const fs = require('fs');
      const sqlContent = fs.readFileSync(`./turso/migrations/${migrationFile}`, 'utf8');
      
      // Remove comments and empty lines, then split by semicolon
      const cleanedContent = sqlContent
        .replace(/--.*$/gm, '')  // Remove single line comments
        .replace(/\/\*[\s\S]*?\*\//g, '')  // Remove multi-line comments
        .trim();
      
      // Split by semicolon and filter out empty statements
      const statements = cleanedContent
        .split(';')
        .map((statement: string) => statement.trim())
        .filter((statement: string) => statement.length > 0);
      
      console.log(`Found ${statements.length} statements to execute`);
      
      // Execute each statement in order
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement) {
          console.log(`Executing statement ${i + 1}: ${statement.substring(0, 100)}...`);
          await turso.execute(statement);
        }
      }
      
      console.log(`✓ ${migrationFile} completed successfully`);
    }
    
    // Verify key tables were created
    const result = await turso.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name IN ('buildings', 'payments', 'residents', 'users', 'system_stats')
    `);
    
    console.log('\nKey tables in Turso database:', JSON.stringify(result.rows.map(r => r.name)));
    
  } catch (error) {
    console.error('Turso migration failed:', error);
    throw error;
  }
}

async function runSupabaseMigration() {
  console.log('\n=== Running Supabase Migrations ===');
  
  try {
    console.log('Running supabase db push...');
    execSync('supabase db push', { stdio: 'inherit' });
    console.log('✓ Supabase migration completed successfully!');
  } catch (error) {
    console.error('Supabase migration failed:', error);
    throw error;
  }
}

async function runAllMigrations() {
  try {
    await runTursoMigration();
    await runSupabaseMigration();
    console.log('\n🎉 All migrations completed successfully! 🎉');
  } catch (error) {
    console.error('Migration process failed:', error);
    process.exit(1);
  }
}

runAllMigrations();