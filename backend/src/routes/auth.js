"use strict";
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const { generateOtp, verifyOtp } = require('../utils/otpStore');
const { sendOtpEmail } = require('../utils/mailer');
const { verifyOtpMiddleware, OTP_JWT_SECRET } = require('../middleware/verifyOtp');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_change_in_production';

// ─── STEP 1: Send OTP to email ────────────────────────────────────────────────
// POST /api/auth/send-otp
// Body: { email }
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    // Check if email is already registered
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ error: 'This email is already registered. Please login instead.' });

    const otp = generateOtp(email);
    await sendOtpEmail(email, otp);

    res.json({ message: 'OTP sent successfully. Please check your email.' });
  } catch (error) {
    console.error('send-otp error:', error);
    res.status(500).json({ error: 'Failed to send OTP. Please check your email address and try again.' });
  }
});

// ─── STEP 2: Verify OTP → return short-lived otpToken ─────────────────────────
// POST /api/auth/verify-otp
// Body: { email, otp }
router.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });

  const isValid = verifyOtp(email, otp);
  if (!isValid) return res.status(400).json({ error: 'Invalid or expired OTP. Please request a new one.' });

  // Issue a short-lived JWT that proves this email has been verified
  const otpToken = jwt.sign(
    { email: email.toLowerCase(), otpVerified: true },
    OTP_JWT_SECRET,
    { expiresIn: '15m' } // 15 minutes to complete signup
  );

  res.json({ message: 'OTP verified successfully.', otpToken });
});

// ─── STEP 3: Signup (protected by OTP middleware) ─────────────────────────────
// POST /api/auth/signup
// Body: { username, email, password, otpToken }
router.post('/signup', verifyOtpMiddleware, async (req, res) => {
  try {
    const { username, password } = req.body;
    const email = req.verifiedEmail; // Set by verifyOtpMiddleware

    if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) return res.status(400).json({ error: 'Username or email already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({ username, email, passwordHash });
    await user.save();

    res.status(201).json({ message: 'Account created successfully! Please log in.' });
  } catch (error) {
    console.error('signup error:', error);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

// ─── Login ─────────────────────────────────────────────────────────────────────
// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Needed for cross-domain (Vercel to Render)
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ 
      message: 'Logged in successfully', 
      user: { id: user._id, username: user.username, email: user.email },
      token: token
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Logout ────────────────────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

module.exports = router;
