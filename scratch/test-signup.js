async function test() {
  try {
    const res = await fetch('https://sadbhawanabilldesk.vercel.app/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test User',
        email: `test-${Date.now()}@example.com`,
        phone: '1234567890',
        password: 'password123'
      })
    });
    const status = res.status;
    const body = await res.text();
    console.log('Status:', status);
    console.log('Response:', body);
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
