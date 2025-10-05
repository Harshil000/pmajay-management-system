// Simple script to seed demo users
const seedUsers = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/seed/demo-users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    console.log('✅ Seeding Response:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('\n🎉 Demo users successfully seeded!');
      console.log('\n📋 Available Credentials:');
      data.credentials.forEach(cred => console.log('  -', cred));
    } else {
      console.log('❌ Error:', data.error);
    }
  } catch (error) {
    console.error('❌ Failed to seed users:', error.message);
  }
};

// For Node.js environment
if (typeof window === 'undefined') {
  // Use node-fetch for Node.js
  const fetch = require('node-fetch');
  seedUsers();
}

module.exports = { seedUsers };