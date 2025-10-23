// Script de test pour vérifier les boutons de l'interface
console.log('🧪 Starting button tests...');

async function testTwilioAPI() {
  console.log('\n=== Testing Twilio API ===');
  
  try {
    const response = await fetch('/api/twilio');
    const data = await response.json();
    console.log('✅ Twilio credentials:', data);
  } catch (error) {
    console.error('❌ Twilio API error:', error);
  }
  
  try {
    const response = await fetch('/api/twilio/numbers');
    const data = await response.json();
    console.log('✅ Twilio numbers:', data.length, 'numbers found');
    if (data.length > 0) {
      console.log('   First number:', data[0].friendlyName);
    }
  } catch (error) {
    console.error('❌ Twilio numbers error:', error);
  }
}

async function testWebsocketServer() {
  console.log('\n=== Testing Websocket Server ===');
  
  try {
    const response = await fetch('http://localhost:8081/public-url');
    const data = await response.json();
    console.log('✅ Websocket server public URL:', data);
  } catch (error) {
    console.error('❌ Websocket server error:', error);
  }
}

async function testNgrok() {
  console.log('\n=== Testing Ngrok URL ===');
  
  try {
    const localResponse = await fetch('http://localhost:8081/public-url');
    const localData = await localResponse.json();
    const publicUrl = localData.publicUrl;
    
    if (!publicUrl) {
      console.log('❌ No public URL configured');
      return;
    }
    
    console.log('🔗 Testing public URL:', publicUrl);
    
    const ngrokResponse = await fetch(publicUrl + '/public-url', {
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    });
    
    if (ngrokResponse.ok) {
      const ngrokData = await ngrokResponse.json();
      console.log('✅ Ngrok URL accessible:', ngrokData);
    } else {
      console.log('❌ Ngrok URL not accessible, status:', ngrokResponse.status);
    }
  } catch (error) {
    console.error('❌ Ngrok test error:', error);
  }
}

async function simulateWebhookUpdate() {
  console.log('\n=== Testing Webhook Update ===');
  
  try {
    // Get current numbers first
    const numbersResponse = await fetch('/api/twilio/numbers');
    const numbers = await numbersResponse.json();
    
    if (numbers.length === 0) {
      console.log('❌ No phone numbers available for webhook test');
      return;
    }
    
    const firstNumber = numbers[0];
    console.log('🔗 Testing webhook update for:', firstNumber.friendlyName);
    
    // Get public URL
    const localResponse = await fetch('http://localhost:8081/public-url');
    const localData = await localResponse.json();
    const twimlUrl = localData.publicUrl ? localData.publicUrl + '/twiml' : null;
    
    if (!twimlUrl) {
      console.log('❌ No public URL available for webhook');
      return;
    }
    
    console.log('🔗 Updating webhook to:', twimlUrl);
    
    const updateResponse = await fetch('/api/twilio/numbers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumberSid: firstNumber.sid,
        voiceUrl: twimlUrl,
      }),
    });
    
    if (updateResponse.ok) {
      const updatedNumber = await updateResponse.json();
      console.log('✅ Webhook updated successfully:', updatedNumber.voiceUrl);
    } else {
      const errorText = await updateResponse.text();
      console.log('❌ Webhook update failed:', updateResponse.status, errorText);
    }
  } catch (error) {
    console.error('❌ Webhook update error:', error);
  }
}

// Run all tests
async function runAllTests() {
  await testTwilioAPI();
  await testWebsocketServer();
  await testNgrok();
  await simulateWebhookUpdate();
  
  console.log('\n🎉 All tests completed!');
}

// Auto-run tests when script is loaded
runAllTests();