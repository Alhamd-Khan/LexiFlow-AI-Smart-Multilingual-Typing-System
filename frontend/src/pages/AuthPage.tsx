import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import { useAuthStore } from '../store/authStore';
import MainLogo from '../components/MainLogo';

// Signup has 3 steps: 'form' → 'otp' → done (switches to login)
type SignupStep = 'form' | 'otp';

export default function AuthPage() {
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(!location.state?.isSignUp);
  const [signupStep, setSignupStep] = useState<SignupStep>('form');

  // Form fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpInput, setOtpInput] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const navigate = useNavigate();
  const { login } = useAuthStore();

  const reset = () => {
    setSignupStep('form');
    setOtpInput('');
    setError('');
    setSuccessMsg('');
  };

  // ── Login ──────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.user, res.data.token);
      navigate('/editor');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 1: Send OTP ────────────────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username || !email || !password) {
      setError('Please fill in all fields first.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/send-otp', { email });
      setSuccessMsg(`OTP sent to ${email}. Check your inbox!`);
      setSignupStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP ──────────────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { email, otp: otpInput });
      const token = res.data.otpToken;
      setSuccessMsg('OTP verified! Creating your account...');

      // Step 3: Signup immediately using the verified token
      await api.post('/auth/signup', { username, email, password, otpToken: token });
      setSuccessMsg('Account created! You can now log in.');
      reset();
      setIsLogin(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const switchToSignup = () => {
    reset();
    setIsLogin(false);
  };

  const switchToLogin = () => {
    reset();
    setIsLogin(true);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen px-4 py-8 md:py-12 flex items-center justify-center bg-[#f5f7f9] fade-in">
      <div className="surface-elevated rounded-3xl w-full max-w-6xl grid overflow-hidden lg:grid-cols-[1.05fr,0.95fr] shadow-2xl border border-[var(--outline-variant)] min-h-[700px]">
        {/* Left visually rich side */}
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#4a40e0] to-[#3d30d4] p-12 text-white lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.15),transparent_40%)]" />
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <span className="inline-block px-3 py-1 bg-white/20 text-white rounded-full text-[11px] font-bold uppercase tracking-widest mb-6 border border-white/10 backdrop-blur-md">LexiFlow Access</span>
              <h1 className="max-w-md text-[2.75rem] font-extrabold tracking-tight leading-[1.1] font-['Manrope']">
                Write, translate, and collaborate in one polished workspace.
              </h1>
            </div>

            <div className="grid gap-4 mt-12">
              {[
                'AI-powered multilingual editor',
                'Shared document inbox and Cloudinary storage',
                'Live chat with inline translation tools',
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/20 bg-white/10 px-5 py-4 backdrop-blur-md shadow-sm">
                  <p className="text-[15px] font-semibold text-white/95">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right form side */}
        <div className="bg-white px-6 py-10 sm:px-10 md:px-12 lg:px-16 flex flex-col justify-center">
          <div className="mx-auto w-full max-w-[420px]">
            <MainLogo className="mb-4 h-16 w-auto origin-center scale-[1.3] text-[#4a40e0]" />
            <span className="inline-block px-2.5 py-1 bg-[#4a40e0]/10 text-[#4a40e0] rounded-full text-[10px] font-bold uppercase tracking-widest mb-3">Secure sign in</span>
            <h2 className="text-[2rem] font-extrabold tracking-tight text-[#2c2f31] font-['Manrope'] leading-tight">
              {isLogin ? 'Login to LexiFlow AI' : signupStep === 'form' ? 'Create your account' : 'Verify your email'}
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-[#595c5e]">
              {isLogin
                ? 'Pick up where you left off in your translation workspace.'
                : signupStep === 'form'
                  ? 'Create a secure account and we will send a one-time code to your email.'
                  : 'Enter the 6-digit verification code to finish creating your account.'}
            </p>

            {error && (
              <div className="mt-6 rounded-xl border border-[#e07a5f]/30 bg-[#fdf8f6] px-5 py-3.5 text-sm font-semibold text-[#e07a5f] shadow-sm">{error}</div>
            )}
            {successMsg && (
              <div className="mt-6 rounded-xl border border-[#16a34a]/30 bg-[#f0fdf4] px-5 py-3.5 text-sm font-semibold text-[#16a34a] shadow-sm">{successMsg}</div>
            )}

            <div className="mt-8">
              {isLogin && (
                <form className="space-y-5" onSubmit={handleLogin}>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#9a9d9f]">Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full rounded-xl border border-[rgba(171,173,175,0.25)] bg-[#f5f7f9] px-5 py-3.5 text-[15px] text-[#2c2f31] placeholder-[#abadaf] transition-all focus:border-[#4a40e0] focus:bg-white focus:outline-none focus:shadow-[0_0_0_4px_rgba(74,64,224,0.1)]" placeholder="name@example.com" />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#9a9d9f]">Password</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full rounded-xl border border-[rgba(171,173,175,0.25)] bg-[#f5f7f9] px-5 py-3.5 text-[15px] text-[#2c2f31] placeholder-[#abadaf] transition-all focus:border-[#4a40e0] focus:bg-white focus:outline-none focus:shadow-[0_0_0_4px_rgba(74,64,224,0.1)]" placeholder="Your password" />
                  </div>
                  <button type="submit" disabled={loading} className="app-button-primary w-full py-3.5 rounded-xl font-bold mt-2 disabled:opacity-50 transition-all active:scale-[0.98]">
                    {loading ? 'Logging in...' : 'Login'}
                  </button>
                </form>
              )}

              {!isLogin && signupStep === 'form' && (
                <form className="space-y-5" onSubmit={handleSendOtp}>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#9a9d9f]">Username</label>
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} required className="w-full rounded-xl border border-[rgba(171,173,175,0.25)] bg-[#f5f7f9] px-5 py-3.5 text-[15px] text-[#2c2f31] placeholder-[#abadaf] transition-all focus:border-[#4a40e0] focus:bg-white focus:outline-none focus:shadow-[0_0_0_4px_rgba(74,64,224,0.1)]" placeholder="Choose a username" />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#9a9d9f]">Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full rounded-xl border border-[rgba(171,173,175,0.25)] bg-[#f5f7f9] px-5 py-3.5 text-[15px] text-[#2c2f31] placeholder-[#abadaf] transition-all focus:border-[#4a40e0] focus:bg-white focus:outline-none focus:shadow-[0_0_0_4px_rgba(74,64,224,0.1)]" placeholder="name@example.com" />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#9a9d9f]">Password</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full rounded-xl border border-[rgba(171,173,175,0.25)] bg-[#f5f7f9] px-5 py-3.5 text-[15px] text-[#2c2f31] placeholder-[#abadaf] transition-all focus:border-[#4a40e0] focus:bg-white focus:outline-none focus:shadow-[0_0_0_4px_rgba(74,64,224,0.1)]" placeholder="Create a password" />
                  </div>
                  <button type="submit" disabled={loading} className="app-button-primary w-full py-3.5 rounded-xl font-bold mt-2 disabled:opacity-50 transition-all active:scale-[0.98]">
                    {loading ? 'Sending OTP...' : 'Send OTP to Email'}
                  </button>
                </form>
              )}

              {!isLogin && signupStep === 'otp' && (
                <form className="space-y-5" onSubmit={handleVerifyOtp}>
                  <p className="rounded-xl border border-[#4a40e0]/20 bg-[#4a40e0]/5 px-5 py-4 text-center text-[13.5px] font-medium text-[#4a40e0] shadow-sm">
                    A 6-digit code was sent to <span className="font-bold">{email}</span>
                  </p>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#9a9d9f] text-center">Enter OTP</label>
                    <input
                      type="text"
                      value={otpInput}
                      onChange={e => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                      maxLength={6}
                      className="w-full rounded-xl border border-[rgba(171,173,175,0.25)] bg-white px-5 py-4 text-center text-3xl font-extrabold tracking-[0.5em] text-[#2c2f31] placeholder-[#abadaf] transition-all focus:border-[#4a40e0] focus:outline-none focus:shadow-[0_0_0_4px_rgba(74,64,224,0.1)]"
                      placeholder="000000"
                    />
                  </div>
                  <button type="submit" disabled={loading || otpInput.length !== 6} className="app-button-primary w-full py-3.5 rounded-xl font-bold mt-2 disabled:opacity-50 transition-all active:scale-[0.98]">
                    {loading ? 'Verifying...' : 'Verify & Create Account'}
                  </button>
                  <button type="button" onClick={() => { setSignupStep('form'); setError(''); setSuccessMsg(''); }} className="w-full text-sm font-bold text-[#abadaf] transition hover:text-[#4a40e0] mt-2">
                    Change email / Resend OTP
                  </button>
                </form>
              )}
            </div>

            <div className="mt-8 text-center border-t border-[var(--outline-variant)] pt-6">
              {isLogin ? (
                <button onClick={switchToSignup} className="text-[15px] font-bold text-[#4a40e0] transition hover:text-[#3d30d4]">
                  Need an account? Sign up
                </button>
              ) : (
                <button onClick={switchToLogin} className="text-[15px] font-bold text-[#4a40e0] transition hover:text-[#3d30d4]">
                  Already have an account? Login
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
