import nodemailer from 'nodemailer';
import fs from 'fs';

// Helper to read variables from .env manually (for local testing)
const envFile = fs.readFileSync('.env', 'utf-8');
const getEnv = (key) => {
    const match = envFile.match(new RegExp(`${key}=(.*)`));
    return match ? match[1].trim() : null;
};

const host = getEnv('SMTP_HOST');
const port = getEnv('SMTP_PORT') || '465';
const user = getEnv('SMTP_USER');
const pass = getEnv('SMTP_PASS');

if (!host || host === 'mail.yourdomain.com') {
    console.error("❌ Please update your .env file with actual cPanel SMTP credentials first.");
    process.exit(1);
}

const transporter = nodemailer.createTransport({
    host: host,
    port: parseInt(port),
    secure: port === '465', // true for 465, false for 587
    auth: {
        user: user,
        pass: pass,
    },
});

async function testSMTP() {
    console.log("Verifying connection to cPanel SMTP server...");
    
    try {
        await transporter.verify();
        console.log("✅ Connection Successful! Credentials are correct.");

        console.log("Sending test email...");
        const info = await transporter.sendMail({
            from: `"Store Admin" <${user}>`, 
            to: user, // Send an email to yourself
            subject: 'Success! Your cPanel Mail Server works! 🎉',
            html: `<h2>It Works!</h2><p>Your custom cPanel mail server is successfully hooked up to your React App backend.</p>`
        });

        console.log("✅ Success! Email sent.");
        console.log("Message ID:", info.messageId);

    } catch (e) {
        console.error("❌ Failed:", e.message);
    }
}

testSMTP();
