import { createClient } from '@libsql/client';

const turso = createClient({
  url: process.env.DATABASE_URL_TURSO!,
  authToken: process.env.DATABASE_TOKEN_TURSO!
});

async function finalSync() {
  console.log('=== Final Sync: Matching Clerk User ID Exactly ===');
  
  try {
    const clerkUserId = 'user_3BTHklplPf611Pr40iUgSO1zj62';
    const email = 'anthonyrivera51@gmail.com';
    
    // Check current state
    const currentUser = await turso.execute('SELECT id, clerk_user_id, email, name, role FROM users WHERE email = ?', [
      email
    ]);
    console.log('Current user state:');
    if (currentUser.rows.length > 0) {
      console.log('-', currentUser.rows[0]);
    } else {
      console.log('- User not found');
    }
    
    // Update both id and clerk_user_id to match the Clerk user ID exactly
    await turso.execute(`
      UPDATE users SET 
        id = ?,
        clerk_user_id = ?,
        name = ?,
        role = ?,
        building_id = ?
      WHERE email = ?
    `, [
      clerkUserId,        // id matches Clerk user ID
      clerkUserId,        // clerk_user_id matches Clerk user ID
      'Anthony Rivera',   // name
      'super_admin',      // role
      null,               // building_id
      email
    ]);
    console.log(`\n✓ Updated user to match Clerk ID: ${clerkUserId}`);
    
    // Final verification
    const finalUser = await turso.execute('SELECT id, clerk_user_id, email, name, role FROM users WHERE email = ?', [
      email
    ]);
    console.log('\nFinal verification:');
    for (const user of finalUser.rows) {
      console.log('- User:', user);
      const idsMatch = user.id === user.clerk_user_id;
      const matchesClerk = user.id === clerkUserId;
      console.log('  ID matches clerk_user_id:', idsMatch);
      console.log('  Matches Clerk user ID:', matchesClerk);
    }
    
    console.log('\n=== Final sync completed successfully ===');
    
  } catch (error) {
    console.error('Final sync failed:', error);
    process.exit(1);
  }
}

finalSync();