async function test() {
  try {
    const res = await fetch('https://sadbhawanabilldesk.vercel.app/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'demo@billflow.com',
        password: 'demopassword'
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
