/**
 * Module Name: AuthModal
 * Purpose: Authentication dialog — Login, Sign Up, and OTP verification screens.
 * Redesigned to match Stitch light-mode design: white card, green focus ring, clean typography.
 * Now includes real-time password strength validation on Sign Up.
 */

import React, { useState, useMemo } from 'react';
import axios from 'axios';

// ── Password Validation Rules ──
const PASSWORD_RULES = [
  { id: 'length',  label: 'At least 8 characters',       test: (p) => p.length >= 8 },
  { id: 'upper',   label: 'One uppercase letter (A-Z)',   test: (p) => /[A-Z]/.test(p) },
  { id: 'number',  label: 'One number (0-9)',             test: (p) => /[0-9]/.test(p) },
  { id: 'special', label: 'One special character (!@#$...)', test: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(p) },
];

export default function AuthModal({ onClose, onAuthSuccess, showToast }) {
  const [view,     setView]     = useState('login'); // 'login' | 'signup' | 'otp'
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [otpCode,  setOtpCode]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const switchView = (v) => { setView(v); setError(''); };

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
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setError(''); setLoading(true);
    try {
      const { data } = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      onAuthSuccess(data.user, data.token);
      showToast('Logged in successfully', 'success');
      onClose();
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.unverified) {
        showToast('Account unverified — OTP sent to your email', 'error');
        setView('otp');
      } else {
        setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
      }
    } finally { setLoading(false); }
  };

  // ── Sign Up ──
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields'); return; }

    // Client-side password validation
    if (!allPasswordRulesPassed) {
      setError('Password does not meet all requirements');
      return;
    }

    setError(''); setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/auth/signup', { email, password });
      showToast('OTP sent to your email', 'success');
      setView('otp');
    } catch (err) {
      setError(err.response?.data?.error || 'Sign-up failed. Please try again.');
    } finally { setLoading(false); }
  };

  // ── OTP ──
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) { setError('Please enter the 6-digit code'); return; }
    setError(''); setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/auth/verify-otp', { email, otp: otpCode });
      showToast('Account verified! You can now sign in.', 'success');
      setView('login'); setPassword(''); setOtpCode('');
    } catch (err) {
      setError(err.response?.data?.error || 'OTP verification failed.');
    } finally { setLoading(false); }
  };

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid var(--clr-outline-variant)',
    borderRadius: '6px',
    background: 'var(--clr-surface-container-lowest)',
    color: 'var(--clr-on-surface)',
    fontSize: '14px',
    fontFamily: 'var(--font-sans)',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--clr-on-surface-variant)',
    marginBottom: '4px',
    letterSpacing: '0.01em',
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Authentication">
      <div className="modal-card" onClick={e => e.stopPropagation()}>

        {/* OTP view has back button; others show tabs */}
        {view === 'otp' ? (
          /* OTP Card */
          <>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
              <button
                onClick={() => switchView('signup')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '50%', color: 'var(--clr-on-surface-variant)', marginLeft: '-8px', display: 'flex' }}
                aria-label="Back"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <h2 style={{ marginLeft: '8px', fontSize: '24px', fontWeight: 600 }}>Verify Account</h2>
            </div>
            <p style={{ fontSize: '14px', marginBottom: '24px', textAlign: 'center' }}>
              Enter the 6-digit code sent to <strong>{email}</strong>
            </p>

            {error && (
              <div style={{ padding: '10px 14px', background: 'var(--clr-error-container)', color: 'var(--clr-on-error-container)', borderRadius: '6px', fontSize: '13px', marginBottom: '16px', fontWeight: 500 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleOtpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input
                id="otp-code-input"
                type="text"
                maxLength="6"
                placeholder="––––––"
                value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                style={{
                  ...inputStyle,
                  textAlign: 'center',
                  fontSize: '24px',
                  letterSpacing: '12px',
                  fontFamily: 'var(--font-mono)',
                  padding: '12px',
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--clr-primary)'; e.target.style.boxShadow = `0 0 0 2px var(--clr-tertiary-fixed-dim)`; }}
                onBlur={e  => { e.target.style.borderColor = 'var(--clr-outline-variant)'; e.target.style.boxShadow = 'none'; }}
                required
                aria-label="OTP code"
              />
              <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '40px', justifyContent: 'center' }} disabled={loading}>
                {loading ? <div className="spinner" style={{ width: '16px', height: '16px' }} /> : 'Verify Account'}
              </button>
            </form>
          </>
        ) : (
          /* Login / Sign Up with tab switcher */
          <>
            {/* Tab toggle */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              {['login', 'signup'].map(v => (
                <button
                  key={v}
                  onClick={() => switchView(v)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: view === v ? '1px solid var(--clr-outline-variant)' : '1px solid transparent',
                    borderRadius: '6px',
                    background: view === v ? 'var(--clr-surface-container-lowest)' : 'transparent',
                    color: view === v ? 'var(--clr-on-surface)' : 'var(--clr-on-surface-variant)',
                    fontWeight: view === v ? 600 : 400,
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: view === v ? 'var(--shadow-level-1)' : 'none',
                    fontFamily: 'var(--font-sans)',
                    transition: 'all 0.15s',
                  }}
                >
                  {v === 'login' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>

            <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '4px' }}>
              {view === 'login' ? 'Sign In' : 'Create Account'}
            </h2>
            <p style={{ fontSize: '14px', marginBottom: '24px' }}>
              {view === 'login' ? 'Access B2B pricing forecasts' : 'Register for predictive intelligence'}
            </p>

            {error && (
              <div style={{ padding: '10px 14px', background: 'var(--clr-error-container)', color: 'var(--clr-on-error-container)', borderRadius: '6px', fontSize: '13px', marginBottom: '16px', fontWeight: 500 }}>
                {error}
              </div>
            )}

            <form
              onSubmit={view === 'login' ? handleLoginSubmit : handleSignupSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <div>
                <label htmlFor={`${view}-email`} style={labelStyle}>Email</label>
                <input
                  id={`${view}-email`}
                  type="email"
                  placeholder="analyst@tradingco.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = 'var(--clr-primary)'; e.target.style.boxShadow = `0 0 0 2px var(--clr-tertiary-fixed-dim)`; }}
                  onBlur={e  => { e.target.style.borderColor = 'var(--clr-outline-variant)'; e.target.style.boxShadow = 'none'; }}
                  required
                />
              </div>
              <div>
                <label htmlFor={`${view}-password`} style={labelStyle}>Password</label>
                <input
                  id={`${view}-password`}
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = 'var(--clr-primary)'; e.target.style.boxShadow = `0 0 0 2px var(--clr-tertiary-fixed-dim)`; }}
                  onBlur={e  => { e.target.style.borderColor = 'var(--clr-outline-variant)'; e.target.style.boxShadow = 'none'; }}
                  required
                />
              </div>

              {/* ── Password Strength Validation Indicators (Sign Up only) ── */}
              {view === 'signup' && password.length > 0 && (
                <div style={{
                  background: 'var(--clr-surface-container)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--clr-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>
                    Password Requirements
                  </span>
                  {passwordChecks.map(check => (
                    <div
                      key={check.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        fontSize: '13px',
                        color: check.passed ? 'var(--clr-primary)' : 'var(--clr-on-surface-variant)',
                        fontWeight: check.passed ? 500 : 400,
                        transition: 'color 0.2s',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{
                        fontSize: '16px',
                        color: check.passed ? '#4caf50' : 'var(--clr-outline)',
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
                        background: allPasswordRulesPassed ? '#4caf50' :
                                    passwordChecks.filter(c => c.passed).length >= 2 ? '#ff9800' : 'var(--clr-error)',
                        transition: 'width 0.3s ease, background 0.3s ease',
                      }} />
                    </div>
                    <div style={{
                      fontSize: '11px', marginTop: '4px', textAlign: 'right',
                      color: allPasswordRulesPassed ? '#4caf50' :
                             passwordChecks.filter(c => c.passed).length >= 2 ? '#ff9800' : 'var(--clr-error)',
                      fontWeight: 600,
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
                style={{ width: '100%', height: '40px', marginTop: '4px', justifyContent: 'center' }}
                disabled={loading || (view === 'signup' && password.length > 0 && !allPasswordRulesPassed)}
              >
                {loading
                  ? <div className="spinner" style={{ width: '16px', height: '16px' }} />
                  : view === 'login' ? 'Continue' : 'Sign Up'
                }
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
