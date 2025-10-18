// Test script to check admin payments API
const fetch = require('node-fetch');

async function testAdminPaymentsAPI() {
  try {
    console.log('Testing admin payments API...');
    
    const response = await fetch('http://localhost:3000/api/admin/payments-complete', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (data.payments) {
      console.log('Number of payments found:', data.payments.length);
      if (data.payments.length > 0) {
        console.log('First payment:', data.payments[0]);
      }
    }
    
  } catch (error) {
    console.error('Error testing admin payments API:', error);
  }
}

testAdminPaymentsAPI();
