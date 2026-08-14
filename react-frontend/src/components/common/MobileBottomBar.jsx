import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/markets',     label: 'Markets',     icon: 'candlestick_chart' },
  { path: '/predictions', label: 'Predictor',   icon: 'smart_toy' },
  { path: '/analytics',  label: 'Analytics',   icon: 'assessment' },
  { path: '/orders',     label: 'Orders',      icon: 'shopping_cart' },
];

export default function MobileBottomBar({ user, onOpenDrawer, unreadNotificationsCount = 0 }) {
  if (!user) return null;

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

        {/* Menu Button to toggle Mobile Drawer */}
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
      </div>
    </nav>
  );
}
