// In-memory OTP store: email -> { otp, expiresAt }
const otpMap = new Map();

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Generate a 6-digit OTP, store it, and return the code.
 */
function generateOtp(email) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Always 6 digits
  const expiresAt = Date.now() + OTP_TTL_MS;
  otpMap.set(email.toLowerCase(), { otp, expiresAt });
  return otp;
}

/**
 * Verify the OTP for a given email.
 * Deletes the entry after a successful verification.
 * Returns true if valid, false otherwise.
 */
function verifyOtp(email, otp) {
  const key = email.toLowerCase();
  const entry = otpMap.get(key);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    otpMap.delete(key);
    return false;
  }
  if (entry.otp !== otp) return false;
  otpMap.delete(key); // Consume after successful use
  return true;
}

module.exports = { generateOtp, verifyOtp };
