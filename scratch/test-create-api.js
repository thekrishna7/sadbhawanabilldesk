const payload = {
  userId: "cmplifmwl0000tnckcwb4ohdl",
  invoiceNumber: "INV-2026-002",
  invoiceDate: "2026-05-26",
  dueDate: "2026-06-02",
  billToName: "Test Customer",
  billToPhone: "1234567890",
  billToEmail: "test-api@test.com",
  billToAddress: "123 Test St",
  termsText: "Pay in 7 days",
  currency: "INR",
  receivedAmount: 0,
  previousBalance: 0,
  subtotal: 100,
  taxTotal: 18,
  grandTotal: 118,
  currentBalance: 118,
  amountInWords: "Rupees One Hundred and Eighteen Only",
  status: "sent",
  items: [
    {
      description: "Test Item",
      quantity: 1,
      rate: 100,
      taxPercent: 18,
      amount: 118
    }
  ]
};

async function run() {
  try {
    const res = await fetch('http://localhost:3001/api/invoices/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}

run();
