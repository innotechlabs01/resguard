import { createClient } from '@libsql/client';

const turso = createClient({
  url: process.env.DATABASE_URL_TURSO!,
  authToken: process.env.DATABASE_TOKEN_TURSO!
});

async function setupSuperAdmin() {
  console.log('=== Setting up Super Admin User ===');
  
  try {
    // Drop profiles table if exists
    try {
      await turso.execute('DROP TABLE IF EXISTS profiles');
      console.log('✓ Dropped profiles table');
    } catch (e: unknown) {
      console.log('Note: Error dropping profiles table (may not exist):', (e as Error).message);
    }
    
    // Create super admin user
    try {
      await turso.execute(`
        INSERT INTO users (id, clerk_user_id, email, name, role, building_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        'super-admin-anthony',
        'clerk_super_admin_anthony',
        'anthonyrivera51@gmail.com',
        'Anthony Rivera',
        'super_admin',
        null,
        new Date().toISOString()
      ]);
      console.log('✓ Created super admin user');
    } catch (e: unknown) {
      console.log('✗ Error creating super admin user:', (e as Error).message);
      throw e;
    }
    
    // Verify the user was created
    try {
      const users = await turso.execute('SELECT id, email, name, role FROM users WHERE email = ?', [
        'anthonyrivera51@gmail.com'
      ]);
      console.log('Users in database:');
      for (const user of users.rows) {
        console.log('- User:', user);
      }
    } catch (e: unknown) {
      console.log('✗ Error querying users:', (e as Error).message);
    }
    
    console.log('=== Setup completed successfully ===');
    
  } catch (error: unknown) {
    console.error('Setup failed:', (error as Error).message);
    process.exit(1);
  }
}

setupSuperAdmin();