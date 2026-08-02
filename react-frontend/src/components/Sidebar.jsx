import React from 'react';
import { NavLink, Link } from 'react-router-dom';

const navItems = [
  { path: '/markets',     label: 'Live Markets',    icon: 'candlestick_chart' },
  { path: '/predictions', label: 'ML Predictor',    icon: 'smart_toy' },
  { path: '/analytics',  label: 'Analytics',       icon: 'assessment' },
  { path: '/orders',     label: 'Orders',          icon: 'shopping_cart' },
];

const footerItems = [
  { path: '/how-it-works', label: 'How It Works', icon: 'auto_awesome' },
  { path: '/help',         label: 'Help Center',  icon: 'help' },
  { path: '/account',      label: 'Account',      icon: 'person' },
];

export default function Sidebar({ user, onLogout }) {
  return (
    <aside className="sidebar" aria-label="Main navigation">
      {/* Brand block */}
      <Link to="/" style={{ textDecoration: 'none' }}>
        <div className="sidebar-brand-block">
          <div className="sidebar-logo-box">
            <span className="material-symbols-outlined icon-filled" style={{ fontSize: '22px', color: 'var(--clr-on-primary)' }}>spa</span>
          </div>
          <div className="sidebar-brand-text">
            <div className="brand-title">AgriCast AI</div>
            <div className="brand-sub" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="pulse-dot-green" style={{
                display: 'inline-block',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#34d399'
              }} />
              AI Insights Active
            </div>
          </div>
        </div>
      </Link>

      {/* New Trade CTA */}
      <Link to="/predictions" className="sidebar-new-trade" style={{ textDecoration: 'none' }}>
        <span className="material-symbols-outlined icon-filled">add</span>
        <span>New Trade</span>
      </Link>

      {/* Navigation */}
      <nav className="sidebar-nav" aria-label="Sidebar navigation">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            style={{ textDecoration: 'none' }}
          >
            {({ isActive }) => (
              <>
                <span className={`material-symbols-outlined ${isActive ? 'icon-filled' : ''}`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer links */}
      <div className="sidebar-footer">
        {footerItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            style={{ textDecoration: 'none' }}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}

        {user && (
          <>
            <div className="sidebar-divider" />
            <button
              className="btn btn-danger btn-sm"
              onClick={onLogout}
              style={{ width: '100%', justifyContent: 'flex-start', gap: '8px' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
              <span>Logout</span>
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
