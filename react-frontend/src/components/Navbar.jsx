/**
 * Module Name: Navbar
 * Location: react-frontend/src/components/Navbar.jsx
 * Purpose: Renders the top navigation bar, exposing company branding and authentication controls.
 * How to use: Import inside App.jsx and render as `<Navbar user={user} onLogout={onLogout} onOpenAuth={onOpenAuth} />`.
 * Why it is used: Implements B2B system branding and controls access validation.
 */

import React from 'react'; // TYPE: Library Import. USE: React references. WHY: Required for JSX compiling.

/**
 * Component Type: Functional React Component
 * Where to use: Mounted globally at the top of App.jsx.
 * How to use: Receives destructured props (`user`, `onLogout`, `onOpenAuth`).
 * Why this is used: Provides navigation controls and updates login status instantly when state changes.
 */
export default function Navbar({ user, onLogout, onOpenAuth }) {
  return (
    <nav 
      className="glass" 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 'var(--nav-height)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--space-xl)',
        borderRadius: 0,
        borderTop: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        borderBottom: '1px solid rgba(52, 211, 153, 0.15)'
      }}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Brand logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div 
          style={{
            width: '36px',
            height: '36px',
            background: 'linear-gradient(135deg, #064e3b, #10b981)',
            borderRadius: '9px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: '0.9rem',
            color: '#fff',
            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
            <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
          </svg>
        </div>
        <span style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em' }}>
          Agri<span style={{ color: 'var(--clr-emerald-dim)' }}>Pulse</span> AI
        </span>
      </div>

      {/* Nav Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xl)' }}>
        <a href="#hero" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--txt-secondary)' }}>Home</a>
        <a href="#dashboard" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--txt-secondary)' }}>Predictions</a>
      </div>

      {/* Session Actions rendering */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
        {user ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="status-dot live"></span>
              <span style={{ fontSize: '0.85rem', color: 'var(--txt-secondary)', fontWeight: 500 }}>
                {user.email}
              </span>
            </div>
            {/* Sign Out Trigger */}
            {/* TYPE: Callback Event Binding (onClick). HOW: onClick={onLogout}. WHY: Calls parent app signout handler on click. */}
            <button className="btn btn-secondary btn-sm" onClick={onLogout}>
              Sign Out
            </button>
          </>
        ) : (
          <>
            {/* Sign In Trigger */}
            {/* TYPE: Callback Event Binding (onClick). HOW: onClick={onOpenAuth}. WHY: Opens login modal on click. */}
            <button className="btn btn-primary btn-sm" onClick={onOpenAuth}>
              Sign In
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
