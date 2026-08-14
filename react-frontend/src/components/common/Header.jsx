import React, { useState } from 'react';

export default function Header({
  user,
  activeTab,
  handleTabChange,
  searchQuery = '',
  setSearchQuery,
  notifications = [],
  showNotifications,
  setShowNotifications,
  showSettings,
  setShowSettings,
  showUserDropdown,
  setShowUserDropdown,
  darkMode,
  setDarkMode,
  autoSync,
  setAutoSync,
  handleLogout,
  setShowAuthModal,
  showToast,
  headerNavItems = [],
  markNotificationAsRead,
  clearNotification,
  markAllNotificationsAsRead,
  clearAllNotifications,
  showMobileDrawer,
  setShowMobileDrawer
}) {
  const [localMobileDrawerOpen, setLocalMobileDrawerOpen] = useState(false);

  const isDrawerOpen = showMobileDrawer !== undefined ? showMobileDrawer : localMobileDrawerOpen;
  const toggleDrawer = (val) => {
    const nextVal = typeof val === 'boolean' ? val : !isDrawerOpen;
    if (setShowMobileDrawer) setShowMobileDrawer(nextVal);
    setLocalMobileDrawerOpen(nextVal);
  };

  return (
    <>
      <header className="top-header">
        {/* Left: Brand + Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          <button
            className="header-brand"
            onClick={() => handleTabChange('home')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span className="material-symbols-outlined icon-filled" style={{ fontSize: '26px', color: 'var(--clr-primary)' }}>monitoring</span>
            <span>AgriCast AI</span>
          </button>

          {user && (
            <nav className="header-nav" style={{ marginLeft: '32px' }}>
              {headerNavItems.map(item => (
                <button
                  key={item.id}
                  className={`header-nav-link ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => handleTabChange(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          )}
        </div>

        {/* Right: Search + icons + avatar/auth */}
        <div className="header-actions" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {user && (
            <div className="header-search" style={{ position: 'relative' }}>
              <span className="material-symbols-outlined search-icon">search</span>
              <input
                type="text"
                placeholder="Search data..."
                aria-label="Search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <div style={{
                  position: 'absolute',
                  top: '42px',
                  right: 0,
                  width: 'min(280px, 90vw)',
                  background: 'var(--clr-surface-container-lowest)',
                  border: '1px solid var(--clr-outline-variant)',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-level-2)',
                  zIndex: 10000,
                  padding: '8px 0',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  {[
                    { value: 'wheat', label: 'Wheat (Premium)' },
                    { value: 'rice', label: 'Basmati Rice' },
                    { value: 'corn', label: 'Yellow Corn' },
                    { value: 'cotton', label: 'Shankar-6 Cotton' },
                    { value: 'soybean', label: 'Soybean Yellow' },
                    { value: 'sugarcane', label: 'Sugarcane Raw' },
                    { value: 'mustard', label: 'Mustard Seed' },
                    { value: 'groundnut', label: 'Groundnut Bold' },
                    { value: 'turmeric', label: 'Salem Turmeric' },
                    { value: 'chilli', label: 'Guntur Chilli Red' }
                  ]
                  .filter(c => c.label.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(item => (
                    <button
                      key={item.value}
                      onClick={() => {
                        setSearchQuery('');
                        handleTabChange('predictions');
                      }}
                      style={{
                        padding: '10px 16px',
                        background: 'none',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '12px',
                        color: 'var(--clr-on-surface)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        width: '100%'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--clr-primary)' }}>eco</span>
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {user && (
            <>
              <button
                className="header-icon-btn"
                aria-label="Notifications"
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowUserDropdown(false);
                }}
                style={{ position: 'relative' }}
              >
                <span className="material-symbols-outlined">notifications</span>
                {(notifications || []).some(n => n?.unread) && (
                  <span className="pulse-badge-red" style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: 'var(--clr-error)'
                  }} />
                )}
              </button>
              <button
                className="header-icon-btn"
                aria-label="Settings"
                onClick={() => { setShowSettings(true); setShowUserDropdown(false); setShowNotifications(false); }}
              >
                <span className="material-symbols-outlined">settings</span>
              </button>
              <div
                className="user-avatar"
                title={user?.email || ''}
                onClick={() => { setShowUserDropdown(!showUserDropdown); setShowNotifications(false); }}
                style={{ cursor: 'pointer' }}
              >
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </div>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div style={{
                  position: 'absolute',
                  top: '56px',
                  right: '40px',
                  width: 'min(320px, 90vw)',
                  background: 'var(--clr-surface-container-lowest)',
                  border: '1px solid var(--clr-outline-variant)',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-level-3)',
                  zIndex: 10000,
                  padding: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--clr-outline-variant)', paddingBottom: '8px', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '700', fontSize: '13px', color: 'var(--clr-on-surface)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      Notifications
                      {(notifications || []).filter(n => n?.unread).length > 0 && (
                        <span style={{ fontSize: '10px', background: 'var(--clr-error-container)', color: 'var(--clr-on-error-container)', padding: '2px 6px', borderRadius: '10px' }}>
                          {(notifications || []).filter(n => n?.unread).length} new
                        </span>
                      )}
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {notifications.length > 0 && (
                        <>
                          <button onClick={markAllNotificationsAsRead} style={{ background: 'none', border: 'none', color: 'var(--clr-secondary)', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}>Mark all read</button>
                          <button onClick={clearAllNotifications} style={{ background: 'none', border: 'none', color: 'var(--clr-error)', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}>Clear all</button>
                        </>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '24px 8px', textAlign: 'center', color: 'var(--clr-outline)', fontSize: '11px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--clr-outline-variant)' }}>notifications_off</span>
                        <span>All caught up! No notifications.</span>
                      </div>
                    ) : (
                      (notifications || []).map(n => (
                        <div key={n.id} style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: '8px',
                          padding: '8px',
                          borderRadius: '8px',
                          background: n.unread ? 'rgba(52, 211, 153, 0.05)' : 'transparent',
                          borderLeft: n.unread ? '3px solid var(--clr-secondary)' : '3px solid transparent',
                          borderBottom: '1px solid var(--clr-outline-variant)',
                          transition: 'background 0.2s'
                        }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                            <div style={{ fontSize: '11px', color: 'var(--clr-on-surface)', fontWeight: n.unread ? '700' : '500', lineHeight: 1.3 }}>{n.text}</div>
                            <div style={{ fontSize: '9px', color: 'var(--clr-outline)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '10px' }}>schedule</span>
                              {n.time}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {n.unread && (
                              <button
                                onClick={() => markNotificationAsRead(n.id)}
                                style={{ background: 'none', border: 'none', color: 'var(--clr-secondary)', cursor: 'pointer', padding: '2px', display: 'flex', borderRadius: '4px' }}
                                title="Mark as read"
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check</span>
                              </button>
                            )}
                            <button
                              onClick={() => clearNotification(n.id)}
                              style={{ background: 'none', border: 'none', color: 'var(--clr-outline)', cursor: 'pointer', padding: '2px', display: 'flex', borderRadius: '4px' }}
                              title="Dismiss"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* User Dropdown */}
              {showUserDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '56px',
                  right: '0px',
                  width: '180px',
                  background: 'var(--clr-surface-container-lowest)',
                  border: '1px solid var(--clr-outline-variant)',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow-level-3)',
                  zIndex: 10000,
                  padding: '8px 0',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <button
                    onClick={() => { setShowUserDropdown(false); handleTabChange('account'); }}
                    style={{ padding: '10px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '12px', color: 'var(--clr-on-surface)', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person</span>
                    Account Profile
                  </button>
                  <button
                    onClick={() => { setShowUserDropdown(false); handleTabChange('help'); }}
                    style={{ padding: '10px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '12px', color: 'var(--clr-on-surface)', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>help</span>
                    Help Center
                  </button>
                  <div style={{ height: '1px', background: 'var(--clr-outline-variant)', margin: '4px 0' }} />
                  <button
                    onClick={() => { setShowUserDropdown(false); handleLogout(); }}
                    style={{ padding: '10px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '12px', color: 'var(--clr-error)', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
                    Sign Out
                  </button>
                </div>
              )}
            </>
          )}

          {!user && (
            <button className="btn btn-primary" onClick={() => setShowAuthModal(true)}>
              Login
            </button>
          )}
        </div>
      </header>

      {/* Mobile Slide-Out Navigation Drawer */}
      {isDrawerOpen && (
        <div className="mobile-drawer-overlay" onClick={() => toggleDrawer(false)}>
          <div className="mobile-drawer-card" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--clr-outline-variant)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined icon-filled" style={{ fontSize: '24px', color: 'var(--clr-primary)' }}>monitoring</span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--clr-primary)' }}>AgriCast AI Menu</span>
              </div>
              <button
                onClick={() => toggleDrawer(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-on-surface-variant)', padding: '4px', borderRadius: '50%', display: 'flex' }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {user && (
              <div style={{ background: 'var(--clr-surface-container-low)', padding: '12px', borderRadius: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid var(--clr-outline-variant)' }}>
                <div className="user-avatar" style={{ width: '36px', height: '36px', fontSize: '14px' }}>
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--clr-on-surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user?.name || user?.email}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--clr-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <span className="pulse-dot-green" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399' }} />
                    Active Member
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
              {[
                { id: 'markets', label: 'Markets Feed', icon: 'candlestick_chart' },
                { id: 'predictions', label: 'ML Price Predictor', icon: 'smart_toy' },
                { id: 'analytics', label: 'Analytics Telemetry', icon: 'assessment' },
                { id: 'orders', label: 'Orders & Inventory', icon: 'shopping_cart' },
                { id: 'how-it-works', label: 'How It Works', icon: 'auto_awesome' },
                { id: 'help', label: 'Help Center', icon: 'help' },
                { id: 'account', label: 'Account Settings', icon: 'person' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    toggleDrawer(false);
                    handleTabChange(item.id);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: activeTab === item.id ? 'var(--clr-secondary-container)' : 'transparent',
                    color: activeTab === item.id ? 'var(--clr-on-secondary-container)' : 'var(--clr-on-surface)',
                    fontWeight: activeTab === item.id ? 700 : 500,
                    fontSize: '13px',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--clr-primary)' }}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--clr-outline-variant)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--clr-on-surface-variant)', padding: '6px 4px' }}>
                <span>Auto-Sync Data</span>
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={e => setAutoSync(e.target.checked)}
                  style={{ accentColor: 'var(--clr-primary)', cursor: 'pointer' }}
                />
              </div>

              {user ? (
                <button
                  className="btn btn-secondary"
                  onClick={() => { toggleDrawer(false); handleLogout(); }}
                  style={{ width: '100%', justifyContent: 'center', color: 'var(--clr-error)', borderColor: 'var(--clr-error-container)' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
                  Sign Out
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={() => { toggleDrawer(false); setShowAuthModal(true); }}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

