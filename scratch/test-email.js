const dotenv = require('dotenv');
dotenv.config();

// Since mailer uses import, let's load it dynamically or create a simple transporter test here.
const nodemailer = require('nodemailer');

async function test() {
  console.log('Using SMTP Settings:');
  console.log('Host:', process.env.EMAIL_HOST);
  console.log('Port:', process.env.EMAIL_PORT);
  console.log('User:', process.env.EMAIL_USER);
  console.log('Pass:', process.env.EMAIL_PASS ? '********' : 'undefined');

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER || '',
      pass: process.env.EMAIL_PASS || '',
    },
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: 'adminsadbhawanapublication@gmail.com',
      subject: 'Test Email from BillDesk',
      text: 'If you receive this, SMTP is working correctly!',
    });
    console.log('Success! Email sent. Message ID:', info.messageId);
  } catch (err) {
    console.error('SMTP Error:', err);
  }
}

test();
