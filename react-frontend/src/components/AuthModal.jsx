import React, { useState, useMemo } from 'react';
import { authService } from '../services/authService';

// ── Password Validation Rules ──
const PASSWORD_RULES = [
  { id: 'length',  label: 'At least 8 characters',       test: (p) => p.length >= 8 },
  { id: 'upper',   label: 'One uppercase letter (A-Z)',   test: (p) => /[A-Z]/.test(p) },
  { id: 'number',  label: 'One number (0-9)',             test: (p) => /[0-9]/.test(p) },
  { id: 'special', label: 'One special character (!@#$...)', test: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(p) },
];

export default function AuthModal({ onClose, onAuthSuccess, showToast }) {
  const [view,          setView]          = useState('login'); // 'login' | 'signup' | 'otp' | 'forgot' | 'reset'
  const [name,          setName]          = useState('');
  const [email,         setEmail]         = useState('');
  const [password,      setPassword]      = useState('');
  const [otpCode,       setOtpCode]       = useState('');
  const [showPassword,  setShowPassword]  = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');

  const switchView = (v) => { setView(v); setError(''); setShowPassword(false); };

  // ── Password Validation State ──
  const passwordChecks = useMemo(() => {
    return PASSWORD_RULES.map(rule => ({
      ...rule,
      passed: rule.test(password),
    }));
  }, [password]);

  const allPasswordRulesPassed = passwordChecks.every(c => c.passed);

  // ── Login ──
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all required fields'); return; }
    setError(''); setLoading(true);
    try {
      const data = await authService.login(email, password);
      authService.saveSession(data.user, data.token);
      onAuthSuccess(data.user, data.token);
      showToast('Logged in successfully', 'success');
      onClose();
    } catch (err) {
      if (err.status === 403 && err.data?.unverified) {
        showToast('Account unverified — OTP sent to your email', 'error');
        setView('otp');
      } else {
        setError(err.message || 'Login failed. Please check your credentials.');
      }
    } finally { setLoading(false); }
  };

  // ── Sign Up ──
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all required fields'); return; }

    if (!allPasswordRulesPassed) {
      setError('Password does not meet all security requirements');
      return;
    }

    setError(''); setLoading(true);
    try {
      await authService.signup(name, email, password);
      showToast('OTP sent to your email address', 'success');
      setView('otp');
    } catch (err) {
      setError(err.message || 'Sign-up failed. Please try again.');
    } finally { setLoading(false); }
  };

  // ── OTP Verification ──
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) { setError('Please enter the full 6-digit verification code'); return; }
    setError(''); setLoading(true);
    try {
      await authService.verifyOtp(email, otpCode);
      showToast('Account verified! Please sign in.', 'success');
      setView('login'); setPassword(''); setOtpCode('');
    } catch (err) {
      setError(err.message || 'OTP verification failed.');
    } finally { setLoading(false); }
  };

  // ── Forgot Password Request ──
  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!email) { setError('Please enter your registered email address'); return; }
    setError(''); setLoading(true);
    try {
      await authService.forgotPassword(email);
      showToast('Password reset OTP sent to your email', 'success');
      setView('reset');
      setPassword('');
      setOtpCode('');
    } catch (err) {
      setError(err.message || 'Failed to send reset code. Please try again.');
    } finally { setLoading(false); }
  };

  // ── Reset Password Submit ──
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) { setError('Please enter the 6-digit code'); return; }
    if (!password) { setError('Please enter a new password'); return; }

    if (!allPasswordRulesPassed) {
      setError('Password does not meet security requirements');
      return;
    }

    setError(''); setLoading(true);
    try {
      await axios.post(`${BASE_URL}/auth/reset-password`, { email, otp: otpCode, newPassword: password }, { timeout: 12000 });
      showToast('Password reset successfully! Please sign in.', 'success');
      setView('login');
      setPassword('');
      setOtpCode('');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to reset password.');
    } finally { setLoading(false); }
  };

  // Touch Ergonomics & Mobile Input Style (16px prevents iOS Safari auto-zoom)
  const inputStyle = {
    width: '100%',
    minHeight: '48px',
    padding: '12px 14px',
    border: '1px solid rgba(1, 45, 29, 0.2)',
    borderRadius: '10px',
    background: 'var(--clr-surface-container-lowest)',
    color: 'var(--clr-on-surface)',
    fontSize: '16px',
    fontFamily: 'var(--font-sans)',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--clr-on-surface)',
    marginBottom: '6px',
    letterSpacing: '0.01em',
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Authentication"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)'
      }}
    >
      <div 
        className="modal-card bottom-sheet-card" 
        onClick={e => e.stopPropagation()}
        style={{
          background: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          borderRadius: '20px',
          padding: '20px 24px calc(24px + env(safe-area-inset-bottom, 0px)) 24px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.2)',
          width: '100%',
          maxWidth: '420px',
          boxSizing: 'border-box',
          maxHeight: '90dvh',
          overflowY: 'auto'
        }}
      >
        {/* ── Top Header with Brand Mark & Touch-Friendly Close Trigger ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid rgba(1, 45, 29, 0.1)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined icon-filled" style={{ color: 'var(--clr-primary)', fontSize: '26px' }}>monitoring</span>
            <span style={{ fontWeight: 700, fontSize: '17px', color: 'var(--clr-primary)', fontFamily: 'var(--font-sans)', letterSpacing: '-0.01em' }}>AgriCast AI</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--clr-on-surface-variant)',
              minWidth: '48px',
              minHeight: '48px',
              borderRadius: '50%',
              marginRight: '-8px'
            }}
            aria-label="Close authentication modal"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>close</span>
          </button>
        </div>

        {/* ── OTP View ── */}
        {view === 'otp' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => switchView('signup')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  minWidth: '48px',
                  minHeight: '48px',
                  borderRadius: '50%',
                  color: 'var(--clr-on-surface-variant)',
                  marginLeft: '-12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                aria-label="Back"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <h2 style={{ marginLeft: '4px', fontSize: '22px', fontWeight: 700, color: 'var(--clr-on-surface)' }}>Verify Account</h2>
            </div>
            <p style={{ fontSize: '14px', marginBottom: '20px', textAlign: 'center', color: 'var(--clr-on-surface-variant)' }}>
              Enter the 6-digit verification code sent to <strong>{email}</strong>
            </p>

            {error && (
              <div style={{ padding: '12px 14px', background: 'var(--clr-error-container)', color: 'var(--clr-on-error-container)', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleOtpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input
                id="otp-code-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength="6"
                placeholder="• • • • • •"
                value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                style={{
                  ...inputStyle,
                  textAlign: 'center',
                  fontSize: '24px',
                  letterSpacing: '12px',
                  fontFamily: 'var(--font-mono)',
                  padding: '12px',
                  fontWeight: 700,
                  color: 'var(--clr-primary)',
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--clr-primary)'; e.target.style.boxShadow = `0 0 0 2px var(--clr-tertiary-fixed-dim)`; }}
                onBlur={e  => { e.target.style.borderColor = 'rgba(1, 45, 29, 0.2)'; e.target.style.boxShadow = 'none'; }}
                required
                aria-label="OTP code"
              />
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', minHeight: '48px', fontSize: '15px', fontWeight: 700, justifyContent: 'center', marginTop: '4px' }}
                disabled={loading}
              >
                {loading ? <div className="spinner" style={{ width: '18px', height: '18px' }} /> : 'Verify Account'}
              </button>
            </form>
          </>
        )}

        {/* ── Forgot Password Request View ── */}
        {view === 'forgot' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <button
                type="button"
                onClick={() => switchView('login')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  minWidth: '48px',
                  minHeight: '48px',
                  borderRadius: '50%',
                  color: 'var(--clr-on-surface-variant)',
                  marginLeft: '-12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                aria-label="Back to Login"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <h2 style={{ marginLeft: '4px', fontSize: '22px', fontWeight: 700, color: 'var(--clr-on-surface)' }}>Reset Password</h2>
            </div>
            <p style={{ fontSize: '13px', marginBottom: '20px', color: 'var(--clr-on-surface-variant)', lineHeight: 1.5 }}>
              Enter your registered account email to receive a 6-digit password reset verification code.
            </p>

            {error && (
              <div style={{ padding: '12px 14px', background: 'var(--clr-error-container)', color: 'var(--clr-on-error-container)', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleForgotPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label htmlFor="forgot-email" style={labelStyle}>Email Address</label>
                <input
                  id="forgot-email"
                  type="email"
                  placeholder="farmer@agricast.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = 'var(--clr-primary)'; e.target.style.boxShadow = `0 0 0 2px var(--clr-tertiary-fixed-dim)`; }}
                  onBlur={e  => { e.target.style.borderColor = 'rgba(1, 45, 29, 0.2)'; e.target.style.boxShadow = 'none'; }}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', minHeight: '48px', fontSize: '15px', fontWeight: 700, justifyContent: 'center' }}
                disabled={loading}
              >
                {loading ? <div className="spinner" style={{ width: '18px', height: '18px' }} /> : 'Send Reset Code'}
              </button>
            </form>
          </>
        )}

        {/* ── Reset Password View (OTP + New Password) ── */}
        {view === 'reset' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <button
                type="button"
                onClick={() => switchView('forgot')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  minWidth: '48px',
                  minHeight: '48px',
                  borderRadius: '50%',
                  color: 'var(--clr-on-surface-variant)',
                  marginLeft: '-12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                aria-label="Back"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <h2 style={{ marginLeft: '4px', fontSize: '22px', fontWeight: 700, color: 'var(--clr-on-surface)' }}>Set New Password</h2>
            </div>
            <p style={{ fontSize: '13px', marginBottom: '16px', color: 'var(--clr-on-surface-variant)' }}>
              Enter the code sent to <strong>{email}</strong> and choose your new password.
            </p>

            {error && (
              <div style={{ padding: '12px 14px', background: 'var(--clr-error-container)', color: 'var(--clr-on-error-container)', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label htmlFor="reset-otp-input" style={labelStyle}>6-Digit Verification Code</label>
                <input
                  id="reset-otp-input"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength="6"
                  placeholder="• • • • • •"
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  style={{
                    ...inputStyle,
                    textAlign: 'center',
                    fontSize: '20px',
                    letterSpacing: '8px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--clr-primary)'; e.target.style.boxShadow = `0 0 0 2px var(--clr-tertiary-fixed-dim)`; }}
                  onBlur={e  => { e.target.style.borderColor = 'rgba(1, 45, 29, 0.2)'; e.target.style.boxShadow = 'none'; }}
                  required
                />
              </div>

              <div>
                <label htmlFor="reset-password-input" style={labelStyle}>New Password</label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <input
                    id="reset-password-input"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{ ...inputStyle, paddingRight: '48px' }}
                    onFocus={e => { e.target.style.borderColor = 'var(--clr-primary)'; e.target.style.boxShadow = `0 0 0 2px var(--clr-tertiary-fixed-dim)`; }}
                    onBlur={e  => { e.target.style.borderColor = 'rgba(1, 45, 29, 0.2)'; e.target.style.boxShadow = 'none'; }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '4px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      minWidth: '40px',
                      minHeight: '40px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--clr-outline)',
                      borderRadius: '50%'
                    }}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Password Strength Indicators */}
              {password.length > 0 && (
                <div style={{
                  background: 'var(--clr-surface-container-low)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  border: '1px solid var(--clr-outline-variant)'
                }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--clr-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>
                    Password Requirements
                  </span>
                  {passwordChecks.map(check => (
                    <div
                      key={check.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        fontSize: '13px',
                        color: check.passed ? 'var(--clr-primary)' : 'var(--clr-on-surface-variant)',
                        fontWeight: check.passed ? 600 : 400,
                        transition: 'color 0.2s',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{
                        fontSize: '16px',
                        color: check.passed ? '#2e7d32' : 'var(--clr-outline)',
                        transition: 'color 0.2s, transform 0.2s',
                        transform: check.passed ? 'scale(1.1)' : 'scale(1)',
                      }}>
                        {check.passed ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      {check.label}
                    </div>
                  ))}

                  {/* Password Strength Bar */}
                  <div style={{ marginTop: '4px' }}>
                    <div style={{
                      height: '4px',
                      borderRadius: '2px',
                      background: 'var(--clr-outline-variant)',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        borderRadius: '2px',
                        width: `${(passwordChecks.filter(c => c.passed).length / PASSWORD_RULES.length) * 100}%`,
                        background: allPasswordRulesPassed ? '#2e7d32' :
                                    passwordChecks.filter(c => c.passed).length >= 2 ? '#ff9800' : 'var(--clr-error)',
                        transition: 'width 0.3s ease, background 0.3s ease',
                      }} />
                    </div>
                    <div style={{
                      fontSize: '11px', marginTop: '4px', textAlign: 'right',
                      color: allPasswordRulesPassed ? '#2e7d32' :
                             passwordChecks.filter(c => c.passed).length >= 2 ? '#ff9800' : 'var(--clr-error)',
                      fontWeight: 700,
                    }}>
                      {allPasswordRulesPassed ? 'Strong' :
                       passwordChecks.filter(c => c.passed).length >= 2 ? 'Medium' : 'Weak'}
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', minHeight: '48px', fontSize: '15px', fontWeight: 700, marginTop: '4px', justifyContent: 'center' }}
                disabled={loading || (password.length > 0 && !allPasswordRulesPassed)}
              >
                {loading ? <div className="spinner" style={{ width: '18px', height: '18px' }} /> : 'Reset Password'}
              </button>
            </form>
          </>
        )}

        {/* ── Login / Sign Up Tab Switcher Views ── */}
        {(view === 'login' || view === 'signup') && (
          <>
            {/* High Contrast Mobile Segmented Tab Switcher */}
            <div style={{ 
              display: 'flex', 
              gap: '4px', 
              marginBottom: '20px', 
              background: 'var(--clr-surface-container-low)', 
              padding: '4px', 
              borderRadius: '12px',
              border: '1px solid var(--clr-outline-variant)'
            }}>
              {['login', 'signup'].map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => switchView(v)}
                  style={{
                    flex: 1,
                    minHeight: '44px',
                    border: 'none',
                    borderRadius: '8px',
                    background: view === v ? 'var(--clr-surface-container-lowest)' : 'transparent',
                    color: view === v ? 'var(--clr-primary)' : 'var(--clr-on-surface-variant)',
                    fontWeight: view === v ? 700 : 500,
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: view === v ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                    fontFamily: 'var(--font-sans)',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  {v === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              ))}
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px', color: 'var(--clr-on-surface)' }}>
              {view === 'login' ? 'Welcome Back' : 'Join AgriCast AI'}
            </h2>
            <p style={{ fontSize: '13px', marginBottom: '20px', color: 'var(--clr-on-surface-variant)', lineHeight: 1.4 }}>
              {view === 'login' ? 'Access real-time Mandi forecasts & crop telemetry' : 'Register for predictive agricultural intelligence'}
            </p>

            {error && (
              <div style={{ padding: '12px 14px', background: 'var(--clr-error-container)', color: 'var(--clr-on-error-container)', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
                <span>{error}</span>
              </div>
            )}

            <form
              onSubmit={view === 'login' ? handleLoginSubmit : handleSignupSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              {view === 'signup' && (
                <div>
                  <label htmlFor="signup-name" style={labelStyle}>Full Name</label>
                  <input
                    id="signup-name"
                    type="text"
                    placeholder="e.g. Ramesh Patel"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = 'var(--clr-primary)'; e.target.style.boxShadow = `0 0 0 2px var(--clr-tertiary-fixed-dim)`; }}
                    onBlur={e  => { e.target.style.borderColor = 'rgba(1, 45, 29, 0.2)'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              )}

              <div>
                <label htmlFor={`${view}-email`} style={labelStyle}>Email Address</label>
                <input
                  id={`${view}-email`}
                  type="email"
                  placeholder="farmer@agricast.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = 'var(--clr-primary)'; e.target.style.boxShadow = `0 0 0 2px var(--clr-tertiary-fixed-dim)`; }}
                  onBlur={e  => { e.target.style.borderColor = 'rgba(1, 45, 29, 0.2)'; e.target.style.boxShadow = 'none'; }}
                  required
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label htmlFor={`${view}-password`} style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
                  {view === 'login' && (
                    <button
                      type="button"
                      onClick={() => switchView('forgot')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--clr-primary)',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: '4px',
                        fontFamily: 'var(--font-sans)',
                      }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>

                <div style={{ position: 'relative', width: '100%' }}>
                  <input
                    id={`${view}-password`}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{ ...inputStyle, paddingRight: '48px' }}
                    onFocus={e => { e.target.style.borderColor = 'var(--clr-primary)'; e.target.style.boxShadow = `0 0 0 2px var(--clr-tertiary-fixed-dim)`; }}
                    onBlur={e  => { e.target.style.borderColor = 'rgba(1, 45, 29, 0.2)'; e.target.style.boxShadow = 'none'; }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '4px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      minWidth: '40px',
                      minHeight: '40px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--clr-outline)',
                      borderRadius: '50%'
                    }}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Password Strength Indicators (Sign Up only) */}
              {view === 'signup' && password.length > 0 && (
                <div style={{
                  background: 'var(--clr-surface-container-low)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  border: '1px solid var(--clr-outline-variant)'
                }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--clr-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>
                    Password Security Level
                  </span>
                  {passwordChecks.map(check => (
                    <div
                      key={check.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        fontSize: '13px',
                        color: check.passed ? 'var(--clr-primary)' : 'var(--clr-on-surface-variant)',
                        fontWeight: check.passed ? 600 : 400,
                        transition: 'color 0.2s',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{
                        fontSize: '16px',
                        color: check.passed ? '#2e7d32' : 'var(--clr-outline)',
                        transition: 'color 0.2s, transform 0.2s',
                        transform: check.passed ? 'scale(1.1)' : 'scale(1)',
                      }}>
                        {check.passed ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      {check.label}
                    </div>
                  ))}

                  <div style={{ marginTop: '4px' }}>
                    <div style={{
                      height: '4px',
                      borderRadius: '2px',
                      background: 'var(--clr-outline-variant)',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        borderRadius: '2px',
                        width: `${(passwordChecks.filter(c => c.passed).length / PASSWORD_RULES.length) * 100}%`,
                        background: allPasswordRulesPassed ? '#2e7d32' :
                                    passwordChecks.filter(c => c.passed).length >= 2 ? '#ff9800' : 'var(--clr-error)',
                        transition: 'width 0.3s ease, background 0.3s ease',
                      }} />
                    </div>
                    <div style={{
                      fontSize: '11px', marginTop: '4px', textAlign: 'right',
                      color: allPasswordRulesPassed ? '#2e7d32' :
                             passwordChecks.filter(c => c.passed).length >= 2 ? '#ff9800' : 'var(--clr-error)',
                      fontWeight: 700,
                    }}>
                      {allPasswordRulesPassed ? 'Strong Password' :
                       passwordChecks.filter(c => c.passed).length >= 2 ? 'Medium Strength' : 'Weak Password'}
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  width: '100%',
                  minHeight: '48px',
                  fontSize: '15px',
                  fontWeight: 700,
                  marginTop: '8px',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(1, 45, 29, 0.25)'
                }}
                disabled={loading || (view === 'signup' && password.length > 0 && !allPasswordRulesPassed)}
              >
                {loading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="spinner" style={{ width: '18px', height: '18px' }} />
                    <span>Connecting...</span>
                  </div>
                ) : view === 'login' ? 'Sign In to AgriCast' : 'Create Account'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

