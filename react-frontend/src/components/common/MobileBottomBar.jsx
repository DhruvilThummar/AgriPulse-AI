import React from 'react';
import { NavLink } from 'react-router-dom';

const authenticatedNavItems = [
  { path: '/predictions', label: 'Predictor',   icon: 'smart_toy' },
  { path: '/markets',     label: 'Markets',     icon: 'candlestick_chart' },
  { path: '/analytics',  label: 'Analytics',   icon: 'assessment' },
  { path: '/orders',     label: 'Orders',      icon: 'shopping_cart' },
];

const guestNavItems = [
  { path: '/',             label: 'Home',         icon: 'home' },
  { path: '/how-it-works', label: 'How It Works', icon: 'auto_awesome' },
  { path: '/contact',      label: 'Contact',      icon: 'contact_support' },
];

export default function MobileBottomBar({ user, onOpenDrawer, onOpenAuthModal, unreadNotificationsCount = 0 }) {
  const navItems = user ? authenticatedNavItems : guestNavItems;

  return (
    <nav className="mobile-bottom-bar" aria-label="Mobile Bottom Navigation">
      <div className="mobile-bottom-bar-inner">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `mobile-tab-item ${isActive ? 'active' : ''}`}
          >
            {({ isActive }) => (
              <>
                <div className="mobile-tab-icon-wrap">
                  <span className={`material-symbols-outlined mobile-tab-icon ${isActive ? 'icon-filled' : ''}`}>
                    {item.icon}
                  </span>
                </div>
                <span className="mobile-tab-label">{item.label}</span>
                {isActive && <div className="mobile-active-pill" />}
              </>
            )}
          </NavLink>
        ))}

        {user ? (
          <button
            type="button"
            className="mobile-tab-item mobile-menu-btn"
            onClick={onOpenDrawer}
            aria-label="Open Navigation Menu"
          >
            <div className="mobile-tab-icon-wrap">
              <span className="material-symbols-outlined mobile-tab-icon">menu</span>
              {unreadNotificationsCount > 0 && (
                <span className="mobile-tab-badge" />
              )}
            </div>
            <span className="mobile-tab-label">Menu</span>
          </button>
        ) : (
          <button
            type="button"
            className="mobile-tab-item mobile-menu-btn"
            onClick={onOpenAuthModal}
            aria-label="Sign In"
          >
            <div className="mobile-tab-icon-wrap">
              <span className="material-symbols-outlined mobile-tab-icon">login</span>
            </div>
            <span className="mobile-tab-label">Sign In</span>
          </button>
        )}
      </div>
    </nav>
  );
}

