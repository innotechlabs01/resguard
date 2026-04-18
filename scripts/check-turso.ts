import { createClient } from '@libsql/client';

async function main() {
  const dbUrl = process.env.DATABASE_URL_TURSO;
  const authToken = process.env.DATABASE_TOKEN_TURSO;
  
  if (!dbUrl) {
    console.error('DATABASE_URL_TURSO no está configurada');
    process.exit(1);
  }

  console.log('🔍 Verificando tablas en Turso...\n');

  const db = createClient({
    url: dbUrl!,
    authToken: authToken ?? undefined,
  });

  try {
    const result = await db.execute(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    );
    
    console.log('📋 Tablas encontradas:');
    if (result.rows.length === 0) {
      console.log('   (ninguna tabla encontrada)');
    } else {
      result.rows.forEach((row: any) => {
        console.log(`   - ${row.name}`);
      });
    }

    // Verificar que las tablas principales existan
    const tableNames = result.rows.map((r: any) => r.name);
    const requiredTables = ['buildings', 'users', 'visitors', 'residents', 'payments', 'parking_spots'];
    
    console.log('\n🔍 Verificando tablas requeridas:');
    for (const table of requiredTables) {
      if (tableNames.includes(table)) {
        console.log(`   ✅ ${table}`);
      } else {
        console.log(`   ❌ ${table} (FALTA)`);
      }
    }

    // Contar registros
    console.log('\n📊 Conteo de registros:');
    for (const table of ['buildings', 'users', 'visitors']) {
      try {
        const count = await db.execute(`SELECT COUNT(*) as c FROM ${table}`);
        console.log(`   ${table}: ${(count.rows[0] as any).c} registros`);
      } catch {
        console.log(`   ${table}: error al contar`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }

  await db.close();
}

main();
