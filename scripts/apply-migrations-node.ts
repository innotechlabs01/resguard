/**
 * Script para aplicar migraciones usando Node.js (no requiere turso CLI)
 * Uso: npx tsx scripts/apply-migrations-node.ts
 */

import { createClient } from '@libsql/client';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const MIGRATIONS_DIR = './turso/migrations';

async function applyMigrations() {
  const dbUrl = process.env.DATABASE_URL_TURSO;
  const authToken = process.env.DATABASE_TOKEN_TURSO;

  if (!dbUrl) {
    console.error('❌ DATABASE_URL_TURSO no está configurada');
    process.exit(1);
  }

  console.log('🚀 Aplicando migraciones de Turso...\n');

  const db = createClient({
    url: dbUrl,
    authToken: authToken ?? undefined,
  });

  try {
    // Crear tabla de control de migraciones
    await db.execute(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        applied_at TEXT DEFAULT (datetime('now'))
      )
    `);

    // Obtener lista de migraciones ya aplicadas
    const applied = await db.execute('SELECT name FROM _migrations');
    const appliedNames = new Set(applied.rows.map((r: any) => r.name));

    // Obtener archivos de migración
    const files = readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`📋 ${files.length} migraciones encontradas\n`);

    let appliedCount = 0;
    let skippedCount = 0;

    for (const file of files) {
      const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf-8');

      if (appliedNames.has(file)) {
        console.log(`   ⚠️  ${file} (ya aplicada)`);
        skippedCount++;
        continue;
      }

      console.log(`   📝 ${file}...`);

      try {
        await db.executeMultiple(sql);
        await db.execute({
          sql: 'INSERT INTO _migrations (name) VALUES (?)',
          args: [file]
        });
        console.log(`   ✅ ${file} aplicada`);
        appliedCount++;
      } catch (error: any) {
        if (error.message?.includes('already exists') || 
            error.message?.includes('duplicate')) {
          console.log(`   ⚠️  ${file} (ya existe - ignorando)`);
          skippedCount++;
        } else {
          console.error(`   ❌ Error: ${error.message}`);
          throw error;
        }
      }
    }

    console.log('\n📊 Resumen:');
    console.log(`   ✅ Aplicadas: ${appliedCount}`);
    console.log(`   ⚠️  Ignoradas: ${skippedCount}`);

    // Mostrar tablas
    console.log('\n📋 Tablas en la base de datos:');
    const tables = await db.execute(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '_%' ORDER BY name"
    );
    tables.rows.forEach((r: any) => console.log(`   - ${r.name}`));

    console.log('\n🎉 Migraciones completadas!');
  } catch (error) {
    console.error('\n❌ Error aplicando migraciones:', error);
    process.exit(1);
  }
}

applyMigrations();
