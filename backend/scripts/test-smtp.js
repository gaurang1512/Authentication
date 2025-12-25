import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

(async () => {
  const user = process.env.EMAIL_USER && process.env.EMAIL_USER.trim();
  const pass = process.env.EMAIL_PASS && process.env.EMAIL_PASS.trim();

  console.log('EMAIL_USER=', !!user ? user : '(missing)');
  console.log('EMAIL_PASS=', !!pass ? '(present)' : '(missing)');

  if (!user || !pass) {
    console.error('Missing EMAIL_USER or EMAIL_PASS in environment. Create backend/.env with these values.');
    process.exit(1);
  }

  const transport = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass },
  });

  try {
    console.log('Verifying SMTP connection...');
    await transport.verify();
    console.log('SMTP verify succeeded — credentials are accepted by the server.');
  } catch (err) {
    console.error('SMTP verify failed:');
    console.error(err && err.message ? err.message : err);
    if (err && err.response) console.error('SMTP response:', err.response);
    process.exit(2);
  }
})();
