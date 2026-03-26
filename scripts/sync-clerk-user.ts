import { createClient } from '@libsql/client';

const turso = createClient({
  url: process.env.DATABASE_URL_TURSO!,
  authToken: process.env.DATABASE_TOKEN_TURSO!
});

async function syncClerkUser() {
  console.log('=== Syncing Clerk User to Database ===');
  
  try {
    // Check current users
    const users = await turso.execute('SELECT id, email, name, role FROM users');
    console.log('Current users in database:');
    for (const user of users.rows) {
      console.log('-', user);
    }
    
    // Check if our specific user exists
    const specificUser = await turso.execute('SELECT id, email, name, role FROM users WHERE email = ?', [
      'anthonyrivera51@gmail.com'
    ]);
    
    if (specificUser.rows.length === 0) {
      console.log('\nUser not found in database, inserting...');
      // Insert the user with the new Clerk ID
      await turso.execute(`
        INSERT INTO users (id, clerk_user_id, email, name, role, building_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        'user_3BTHklplPf611Pr40iUgSO1zj62',  // New Clerk ID
        'user_3BTHklplPf611Pr40iUgSO1zj62',  // clerk_user_id matches Clerk user ID
        'anthonyrivera51@gmail.com',
        'Anthony Rivera',
        'super_admin',
        null,
        new Date().toISOString()
      ]);
      console.log('✓ User inserted into database');
    } else {
      console.log('\nUser already exists in database, updating Clerk ID...');
      // Update the clerk_user_id to match the new Clerk user ID (no updated_at column)
      await turso.execute(`
        UPDATE users SET 
          clerk_user_id = ?
        WHERE email = ?
      `, [
        'user_3BTHklplPf611Pr40iUgSO1zj62',  // New Clerk ID
        'anthonyrivera51@gmail.com'
      ]);
      console.log('✓ User clerk_user_id updated in database');
    }
    
    // Final verification
    const finalCheck = await turso.execute('SELECT id, clerk_user_id, email, name, role FROM users WHERE email = ?', [
      'anthonyrivera51@gmail.com'
    ]);
    console.log('\nFinal verification:');
    for (const user of finalCheck.rows) {
      console.log('- User:', user);
      console.log('  Clerk ID matches user ID:', user.clerk_user_id === user.id);
    }
    
    console.log('\\n=== Sync completed successfully ===');
    
  } catch (error) {
    console.error('Sync failed:', error);
    process.exit(1);
  }
}

syncClerkUser();