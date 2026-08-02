// Simple test to verify the userFromClerkEnhanced function logic

// Mock Clerk user data (what we get from Clerk's useUser hook)
const mockClerkUser = {
  id: "user_3BTEpSyLfpAtroQnZTeaIislBLS",  // Actual Clerk user ID
  first_name: "Anthony",
  last_name: "Rivera",
  username: "anthonyrivera51",
  primary_email_address: {
    email_address: "anthonyrivera51@gmail.com"
  },
  public_metadata: {
    role: "super_admin",
    name: "Anthony Rivera",
    buildingId: null
  },
  image_url: "https://img.clerk.com/eyJ0eXBlIjoiZGVmYXVsdCIsImlpZCI6Imluc18zMkxoZHZDRnQxUk95ajNLWktoejZ1eXZXYzgiLCJyaWQiOiJ1c2VyXzNCVEVwU3lMZnBBdHJvUW5aVGVhSWlzbEJMUyJ9",
  has_image: false
};

// Our enhanced function (copied from clerk-utils.ts)
function userFromClerkEnhanced(clerkUser) {
  // Extract role from public metadata, fallback to 'usuario'
  const roleFromMeta = clerkUser.public_metadata?.role;
  const validRoles = ['super_admin', 'admin', 'vigilante', 'usuario'];
  const role = validRoles.includes(roleFromMeta) 
    ? roleFromMeta 
    : 'usuario';

  // Extract name from various sources
  const name = 
    clerkUser.first_name && clerkUser.last_name
      ? `${clerkUser.first_name} ${clerkUser.last_name}`
      : clerkUser.username
      || clerkUser.primary_email_address?.email_address?.split('@')[0]
      || 'Usuario';

  return {
    // Use the actual Clerk user ID as the primary identifier
    id: clerkUser.id,
    email: clerkUser.primary_email_address?.email_address || '',
    name,
    role,
    buildingId: clerkUser.public_metadata?.buildingId || undefined,
    avatar: clerkUser.image_url || undefined
  };
}

console.log('Testing Clerk user mapping...');
console.log('Input Clerk user:', JSON.stringify(mockClerkUser, null, 2));

const appUser = userFromClerkEnhanced(mockClerkUser);

console.log('\nMapped App User:');
console.log(JSON.stringify(appUser, null, 2));

console.log('\nVerification:');
console.log('- Clerk ID preserved as app ID:', appUser.id === mockClerkUser.id);
console.log('- Email correct:', appUser.email === mockClerkUser.primary_email_address.email_address);
console.log('- Name constructed correctly:', appUser.name === "Anthony Rivera");
console.log('- Role from metadata:', appUser.role === "super_admin");
console.log('- BuildingId from metadata:', appUser.buildingId === null);