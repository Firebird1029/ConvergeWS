require('dotenv').config();
const API_KEY = process.env.STRAPI_FULL_ACCESS_TOKEN;
const STRAPI_URL = 'http://localhost:1337/api/sermons';

async function testCreateSermon() {
  // Test with minimal data first
  const testData = {
    title: "Test Sermon",
    date: new Date().toISOString()
  };

  try {
    console.log('Testing sermon creation with minimal data...');
    console.log('Data:', JSON.stringify(testData, null, 2));

    const response = await fetch(STRAPI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        data: testData
      })
    });

    console.log('Response status:', response.status);
    const responseText = await response.text();
    console.log('Response:', responseText);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${responseText}`);
    }

    console.log('SUCCESS: Basic sermon creation works!');
  } catch (error) {
    console.error('ERROR:', error.message);
  }
}

testCreateSermon();