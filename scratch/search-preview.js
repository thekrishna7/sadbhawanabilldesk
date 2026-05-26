const fs = require('fs');
const content = fs.readFileSync('e:/billflow-ULTIMATE-source/src/components/invoice/InvoicePreview.tsx', 'utf8');

const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('TAX') || line.includes('taxTotal') || line.includes('taxPercent')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
