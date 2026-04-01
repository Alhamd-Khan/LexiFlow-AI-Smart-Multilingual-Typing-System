const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for 587
  family: 4, // Force IPv4
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

/**
 * Send a styled OTP email to the given address.
 */
async function sendOtpEmail(to, otp) {
  const mailOptions = {
    from: `"LexiFlow AI" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Your LexiFlow AI Signup OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px; background: #f9fafb;">
        <h2 style="color: #4f46e5; margin-bottom: 8px;">LexiFlow AI</h2>
        <p style="color: #374151; font-size: 15px;">Use the code below to verify your email and complete your signup:</p>
        <div style="margin: 24px 0; text-align: center;">
          <span style="display: inline-block; font-size: 40px; font-weight: 800; letter-spacing: 12px; color: #4f46e5; background: #ede9fe; padding: 16px 32px; border-radius: 10px;">${otp}</span>
        </div>
        <p style="color: #6b7280; font-size: 13px;">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">If you did not request this, please ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { sendOtpEmail };
