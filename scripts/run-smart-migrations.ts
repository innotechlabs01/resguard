import { createClient } from '@libsql/client';
import { execSync } from 'child_process';

async function runTursoMigration() {
  console.log('=== Running Turso Migrations (Smart) ===');
  
  const turso = createClient({
    url: process.env.DATABASE_URL_TURSO!,
    authToken: process.env.DATABASE_TOKEN_TURSO!
  });

  try {
    // Define migrations with their verification queries
    const migrations = [
      {
        file: '001_init.sql',
        verify: "SELECT name FROM sqlite_master WHERE type='table' AND name='users'",
        description: 'Initial tables (users)'
      },
      {
        file: '002_add_tables.sql', 
        verify: "SELECT name FROM sqlite_master WHERE type='table' AND name='buildings'",
        description: 'Core tables (buildings, payments, etc.)'
      },
      {
        file: '003_add_missing_tables.sql',
        verify: "SELECT name FROM sqlite_master WHERE type='table' AND name='system_stats'",
        description: 'Missing table (system_stats)'
      },
      {
        file: '004_add_outstanding_balance_to_buildings.sql',
        verify: "SELECT outstanding_balance FROM pragma_table_info('buildings') WHERE name='outstanding_balance'",
        description: 'Add outstanding_balance to buildings'
      },
      {
        file: '005_add_missing_building_columns.sql',
        verify: "SELECT last_payment_date FROM pragma_table_info('buildings') WHERE name='last_payment_date'",
        description: 'Add last_payment_date and subscription_status to buildings'
      }
    ];
    
    for (const migration of migrations) {
      console.log(`\n--- Checking ${migration.file} ---`);
      
      // Check if migration already applied
      let alreadyApplied = false;
      try {
        const result = await turso.execute(migration.verify);
        alreadyApplied = result.rows.length > 0;
      } catch (e) {
        // If verification fails, assume not applied
        alreadyApplied = false;
      }
      
      if (alreadyApplied) {
        console.log(`✓ ${migration.file} already applied (skipping)`);
        continue;
      }
      
      console.log(`--- Applying ${migration.file} (${migration.description}) ---`);
      const fs = require('fs');
      const sqlContent = fs.readFileSync(`./turso/migrations/${migration.file}`, 'utf8');
      
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
      
      console.log(`✓ ${migration.file} completed successfully`);
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