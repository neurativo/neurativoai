// Test script to check admin users API
const testAdminUsers = async () => {
  try {
    console.log('Testing admin users API...');
    
    const response = await fetch('http://localhost:3000/api/admin/users');
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', data);
    
    if (response.ok) {
      console.log('✅ Admin users API is working!');
      console.log('Number of users:', data.users?.length || 0);
    } else {
      console.log('❌ Admin users API failed:', data.error);
    }
  } catch (error) {
    console.log('❌ Error testing admin users API:', error.message);
  }
};

// Run the test
testAdminUsers();
