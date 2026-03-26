import { createClient } from '@libsql/client';

const turso = createClient({
  url: process.env.DATABASE_URL_TURSO!,
  authToken: process.env.DATABASE_TOKEN_TURSO!
});

async function perfectSync() {
  console.log('=== PERFECT SYNC: Making ID exactly match Clerk User ID ===');
  
  const clerkUserId = 'user_3BTHklplPf611Pr40iUgSO1zj62';
  const email = 'anthonyrivera51@gmail.com';
  
  // Update both id and clerk_user_id to exactly match the Clerk user ID
  await turso.execute(`
    UPDATE users SET 
      id = ?,
      clerk_user_id = ?,
      name = ?,
      role = ?,
      building_id = ?
    WHERE email = ?
  `, [
    clerkUserId,        // id exactly matches Clerk user ID
    clerkUserId,        // clerk_user_id exactly matches Clerk user ID
    'Anthony Rivera',   // name
    'super_admin',      // role
    null,               // building_id
    email
  ]);
  console.log(`✓ Updated user to exactly match Clerk ID: ${clerkUserId}`);
  
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
    console.log('  Matches Clerk user ID exactly:', matchesClerk);
    if (idsMatch && matchesClerk) {
      console.log('  ✓ PERFECT MATCH ACHIEVED');
    }
  }
  
  console.log('\n=== Perfect sync completed ===');
}
perfectSync();