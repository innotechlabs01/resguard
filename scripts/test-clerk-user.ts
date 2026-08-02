// Test script to verify Clerk user data structure
// This simulates what we receive from Clerk's useUser() hook

const mockClerkUser = {
  id: "user_3BTEpSyLfpAtroQnZTeaIislBLS",  // This is the actual Clerk user ID
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

// Import our enhancement function
const { userFromClerkEnhanced } = require('./lib/auth/clerk-utils');

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