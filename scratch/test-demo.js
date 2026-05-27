async function test() {
  try {
    const res = await fetch('https://sadbhawanabilldesk.vercel.app/api/auth/demo', {
      method: 'POST'
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
