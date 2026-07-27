import React from 'react';
import { Link } from 'react-router-dom';

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
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
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
        <span style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em', color: 'var(--clr-on-surface)' }}>
          Agri<span style={{ color: 'var(--clr-emerald-dim)' }}>Pulse</span> AI
        </span>
      </Link>

      {/* Nav Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xl)' }}>
        <Link to="/" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--txt-secondary)', textDecoration: 'none' }}>Home</Link>
        <Link to="/predictions" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--txt-secondary)', textDecoration: 'none' }}>Predictions</Link>
        <Link to="/how-it-works" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--txt-secondary)', textDecoration: 'none' }}>How It Works</Link>
        <Link to="/privacy-policy" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--txt-secondary)', textDecoration: 'none' }}>Privacy Policy</Link>
        <Link to="/contact" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--txt-secondary)', textDecoration: 'none' }}>Contact</Link>
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
            <button className="btn btn-secondary btn-sm" onClick={onLogout}>
              Sign Out
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-primary btn-sm" onClick={onOpenAuth}>
              Sign In
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
