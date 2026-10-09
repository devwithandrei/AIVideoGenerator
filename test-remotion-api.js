const fetch = require('node-fetch');

async function testRemotionAPI() {
  try {
    console.log('Testing Remotion API integration...');
    
    const response = await fetch('http://localhost:9002/api/render-video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Animation',
        theme: 'light',
        aspect: 'landscape',
        duration: '5s',
        effectType: 'spin',
        newspaperImage: null
      }),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ API test successful!');
      console.log('Result:', result);
    } else {
      console.log('❌ API test failed');
      console.log('Error:', result);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testRemotionAPI();
