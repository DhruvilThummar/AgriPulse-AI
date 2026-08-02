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
  clearAllNotifications
}) {
  return (
    <header className="top-header">
      {/* Left: Brand + Nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        <button
          className="header-brand"
          onClick={() => handleTabChange('home')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
        >
          <span className="material-symbols-outlined icon-filled" style={{ fontSize: '26px', color: 'var(--clr-primary)' }}>monitoring</span>
          AgriCast AI
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
      <div className="header-actions" style={{ position: 'relative' }}>
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
                left: 0,
                width: '240px',
                background: 'var(--clr-surface-container-lowest)',
                border: '1px solid var(--clr-outline-variant)',
                borderRadius: '8px',
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
                      padding: '8px 16px',
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
                  width: '6px',
                  height: '6px',
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
                right: '80px',
                width: '320px',
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
                right: '16px',
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
  );
}
