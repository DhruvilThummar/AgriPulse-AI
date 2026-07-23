import React from 'react';

const navItems = [
  { id: 'markets',     label: 'Live Markets',    icon: 'candlestick_chart' },
  { id: 'predictions', label: 'ML Predictor',    icon: 'smart_toy' },
  { id: 'analytics',  label: 'Analytics',       icon: 'assessment' },
  { id: 'orders',     label: 'Orders',          icon: 'shopping_cart' },
];

const footerItems = [
  { id: 'help',    label: 'Help Center', icon: 'help' },
  { id: 'account', label: 'Account',     icon: 'person' },
];

export default function Sidebar({ activeTab, setActiveTab, user, onLogout }) {
  return (
    <aside className="sidebar" aria-label="Main navigation">
      {/* Brand block */}
      <div className="sidebar-brand-block">
        <div className="sidebar-logo-box">CT</div>
        <div className="sidebar-brand-text">
          <div className="brand-title">Commodity Terminal</div>
          <div className="brand-sub">AI Insights Active</div>
        </div>
      </div>

      {/* New Trade CTA */}
      <button className="sidebar-new-trade" onClick={() => setActiveTab('predictions')}>
        <span className="material-symbols-outlined icon-filled">add</span>
        <span>New Trade</span>
      </button>

      {/* Navigation */}
      <nav className="sidebar-nav" aria-label="Sidebar navigation">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-link ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
            aria-current={activeTab === item.id ? 'page' : undefined}
          >
            <span className={`material-symbols-outlined ${activeTab === item.id ? 'icon-filled' : ''}`}>
              {item.icon}
            </span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer links */}
      <div className="sidebar-footer">
        {footerItems.map(item => (
          <button
            key={item.id}
            className={`nav-link ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
            aria-current={activeTab === item.id ? 'page' : undefined}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span>{item.label}</span>
          </button>
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
