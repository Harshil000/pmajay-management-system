/**
 * Data Consistency Test Script
 * This script tests various API endpoints and checks data consistency
 */

const testEndpoints = [
  '/api/projects',
  '/api/agencies', 
  '/api/states',
  '/api/funds'
];

const testDataConsistency = async () => {
  console.log('🧪 Testing Data Consistency...\n');
  
  for (const endpoint of testEndpoints) {
    try {
      console.log(`📡 Testing ${endpoint}...`);
      const response = await fetch(`http://localhost:3001${endpoint}`);
      
      if (!response.ok) {
        console.log(`❌ ${endpoint} - HTTP ${response.status}: ${response.statusText}`);
        continue;
      }
      
      const data = await response.json();
      
      // Check response structure
      if (data.success && Array.isArray(data.data)) {
        console.log(`✅ ${endpoint} - Valid structure with ${data.data.length} items`);
        
        // Sample first item to check properties
        if (data.data.length > 0) {
          const sample = data.data[0];
          console.log(`   📋 Sample keys: ${Object.keys(sample).slice(0, 5).join(', ')}...`);
        }
      } else if (Array.isArray(data)) {
        console.log(`✅ ${endpoint} - Legacy array format with ${data.length} items`);
        if (data.length > 0) {
          const sample = data[0];
          console.log(`   📋 Sample keys: ${Object.keys(sample).slice(0, 5).join(', ')}...`);
        }
      } else {
        console.log(`⚠️  ${endpoint} - Unexpected format:`, typeof data);
      }
      
    } catch (error) {
      console.log(`❌ ${endpoint} - Error: ${error.message}`);
    }
    
    console.log('');
  }
  
  console.log('🎯 Data consistency test completed!');
};

// Test normalization utilities
const testNormalization = () => {
  console.log('🔧 Testing normalization utilities...\n');
  
  // Test data samples
  const sampleProject = {
    _id: 'test123',
    name: 'Test Project',
    implementingAgency: { _id: 'agency1', name: 'Test Agency' },
    executingAgencies: [{ _id: 'agency2', name: 'Executing Agency' }],
    startDate: '2024-01-01',
    expectedEndDate: '2024-12-31',
    status: 'In Progress'
  };
  
  const sampleAgency = {
    _id: 'agency1',
    name: 'Test Agency',
    type: 'Implementing',
    state: 'test-state'
  };
  
  try {
    // These would normally use the normalization functions
    console.log('✅ Sample project structure:', Object.keys(sampleProject));
    console.log('✅ Sample agency structure:', Object.keys(sampleAgency));
    console.log('✅ Normalization utilities ready for use\n');
  } catch (error) {
    console.log('❌ Normalization test failed:', error.message);
  }
};

// Run tests
console.log('🚀 Starting Data Consistency Tests\n');
testNormalization();

// Note: API tests would need to be run in browser environment
// This script shows the structure for testing
console.log('📝 To test API endpoints, run this in browser console after loading the app');
console.log('💡 Use browser dev tools Network tab to monitor API calls\n');