const jwt = require('jsonwebtoken');

const OTP_JWT_SECRET = process.env.OTP_JWT_SECRET || 'otp_fallback_secret';

/**
 * Middleware: reads `otpToken` from req.body, verifies it as a JWT.
 * Attaches `req.verifiedEmail` and proceeds if valid.
 * Also validates that the token's email matches req.body.email.
 */
const verifyOtpMiddleware = (req, res, next) => {
  const { otpToken, email } = req.body;

  if (!otpToken) {
    return res.status(400).json({ error: 'OTP verification token is required. Please verify your email first.' });
  }

  try {
    const decoded = jwt.verify(otpToken, OTP_JWT_SECRET);

    // Make sure the token's email matches the submitted email
    if (decoded.email.toLowerCase() !== (email || '').toLowerCase()) {
      return res.status(400).json({ error: 'Email mismatch. Please request a fresh OTP.' });
    }

    req.verifiedEmail = decoded.email.toLowerCase();
    next();
  } catch (err) {
    return res.status(400).json({ error: 'OTP token is invalid or expired. Please verify your email again.' });
  }
};

module.exports = { verifyOtpMiddleware, OTP_JWT_SECRET };
