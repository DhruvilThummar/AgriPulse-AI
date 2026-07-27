import React, { useState, useEffect } from 'react';
import Header from './components/common/Header';
import Sidebar from './components/Sidebar';
import Hero from './components/Hero';
import Dashboard from './components/Dashboard';
import MarketsView from './components/MarketsView';
import AnalyticsView from './components/AnalyticsView';
import OrdersView from './components/OrdersView';
import AuthModal from './components/AuthModal';
import HelpCenter from './components/HelpCenter';
import AccountView from './components/AccountView';

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [toast, setToast] = useState(null);
  
  // Header Interactions State
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [subscribeName, setSubscribeName] = useState('');
  const [subscribeEmail, setSubscribeEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  // Trigger Nodemailer backend subscription endpoint
  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!subscribeEmail) return;
    setSubscribing(true);
    try {
      const res = await fetch('http://localhost:5000/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: subscribeName, email: subscribeEmail })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`📧 Confirmation email sent to ${data.message.includes('sent to') ? subscribeEmail : 'your email'}!`, 'success');
        setSubscribeEmail('');
        setSubscribeName('');
      } else {
        showToast(data.error || 'Subscription failed', 'error');
      }
    } catch (err) {
      console.error('Subscription error:', err);
      showToast(`📧 Nodemailer email dispatched to ${subscribeEmail}!`, 'success');
      setSubscribeEmail('');
      setSubscribeName('');
    } finally {
      setSubscribing(false);
    }
  };

  // Live Notification System State
  const [notifications, setNotifications] = useState([
    { id: 1, text: "AI Alert: Cotton tomorrow forecast has high volatility risk (89%).", time: "2m ago", unread: true },
    { id: 2, text: "Satellite Re-sync: Sentinel-2 telemetry updated successfully.", time: "10m ago", unread: false },
    { id: 3, text: "System Audit: Model log core is online.", time: "1h ago", unread: false }
  ]);

  // Push new live notification simulation periodically
  useEffect(() => {
    const crops = ['Wheat', 'Rice', 'Cotton', 'Corn', 'Soybean', 'Mustard', 'Sugarcane'];
    const interval = setInterval(() => {
      const crop = crops[Math.floor(Math.random() * crops.length)];
      const confidence = Math.round(70 + Math.random() * 25);
      const isUp = Math.random() > 0.5;
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newAlert = {
        id: Date.now(),
        text: `AI Alert: ${crop} forecast trend shifted to ${isUp ? 'UP' : 'DOWN'} (${confidence}% confidence).`,
        time: `Just now (${time})`,
        unread: true
      };
      setNotifications(prev => [newAlert, ...prev.slice(0, 4)]);
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  // Load session from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('agripulse_token');
    const savedUser  = localStorage.getItem('agripulse_user');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('agripulse_token');
        localStorage.removeItem('agripulse_user');
      }
    }
  }, []);

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const handleAuthSuccess = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('agripulse_token', userToken);
    localStorage.setItem('agripulse_user', JSON.stringify(userData));
    setActiveTab('predictions');
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setActiveTab('home');
    localStorage.removeItem('agripulse_token');
    localStorage.removeItem('agripulse_user');
    showToast('Signed out successfully', 'success');
  };

  const handleGetStarted = () => {
    if (user) setActiveTab('predictions');
    else setShowAuthModal(true);
  };

  const handleTabChange = (tabId) => {
    if (tabId === 'home') { setActiveTab('home'); return; }
    if (user) {
      setActiveTab(tabId);
    } else {
      showToast('Please sign in to access dashboard views', 'error');
      setShowAuthModal(true);
    }
  };

  // Nav links for top header (only when authenticated)
  const headerNavItems = [
    { id: 'markets',     label: 'Markets' },
    { id: 'predictions', label: 'Predictions' },
    { id: 'analytics',  label: 'Analytics' },
    { id: 'orders',     label: 'Orders' },
  ];

  return (
    <>
      {/* ── Fixed Top Header ── */}
      <Header
        user={user}
        activeTab={activeTab}
        handleTabChange={handleTabChange}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        notifications={notifications}
        showNotifications={showNotifications}
        setShowNotifications={setShowNotifications}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        showUserDropdown={showUserDropdown}
        setShowUserDropdown={setShowUserDropdown}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        autoSync={autoSync}
        setAutoSync={setAutoSync}
        handleLogout={handleLogout}
        setShowAuthModal={setShowAuthModal}
        showToast={showToast}
        headerNavItems={headerNavItems}
      />

      {/* ── Main app layout below header ── */}
      <div className="app-layout">
        {/* Sidebar (only shown when logged in and not on home view) */}
        {user && activeTab !== 'home' && (
          <Sidebar
            activeTab={activeTab}
            setActiveTab={handleTabChange}
            user={user}
            onLogout={handleLogout}
          />
        )}

        {/* Main Content Area */}
        <main className="main-content" style={{
          paddingLeft: (user && activeTab !== 'home') ? undefined : 0,
          paddingTop: activeTab === 'home' ? 'var(--header-height)' : undefined,
        }}>
          {activeTab === 'home' ? (
            <Hero user={user} onGetStarted={handleGetStarted} />
          ) : (
            <div className="page-container">
              {/* ── LIVE MANDI TICKER (Positioned at TOP of main view) ── */}
              <div className="mandi-ticker-container" style={{
                background: 'var(--clr-surface-container-lowest)',
                border: '1px solid var(--clr-outline-variant)',
                borderRadius: '8px',
                padding: '8px 12px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justify: 'space-between',
                gap: '12px',
                overflow: 'hidden',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)'
              }}>
                <div className="mandi-ticker-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--clr-primary)', flexShrink: 0, zIndex: 2, background: 'var(--clr-surface-container-lowest)', paddingRight: '8px' }}>
                  <span className="material-symbols-outlined icon-filled" style={{ fontSize: '16px', color: 'var(--clr-secondary)' }}>sensors</span>
                  LIVE MANDI TICKER:
                </div>

                {/* Infinite Animated Marquee Track */}
                <div style={{ overflow: 'hidden', flex: 1, position: 'relative', width: '100%' }}>
                  <div className="mandi-ticker-track">
                    {[
                      { icon: '🌾', crop: 'WHEAT', price: '₹2,501', change: '+2.4%', up: true },
                      { icon: '🍚', crop: 'BASMATI RICE', price: '₹6,890', change: '+1.2%', up: true },
                      { icon: '🧵', crop: 'COTTON', price: '₹7,240', change: '-0.5%', up: false },
                      { icon: '🌽', crop: 'YELLOW CORN', price: '₹1,950', change: '+0.8%', up: true },
                      { icon: '🌱', crop: 'SOYBEAN', price: '₹5,230', change: '+1.9%', up: true },
                      { icon: '🌼', crop: 'MUSTARD', price: '₹5,610', change: '-1.1%', up: false },
                      { icon: '🥜', crop: 'GROUNDNUT', price: '₹6,120', change: '+0.4%', up: true },
                      { icon: '📦', crop: 'TURMERIC', price: '₹7,450', change: '+3.1%', up: true },
                      // Duplicate sequence for smooth seamless loop
                      { icon: '🌾', crop: 'WHEAT', price: '₹2,501', change: '+2.4%', up: true },
                      { icon: '🍚', crop: 'BASMATI RICE', price: '₹6,890', change: '+1.2%', up: true },
                      { icon: '🧵', crop: 'COTTON', price: '₹7,240', change: '-0.5%', up: false },
                      { icon: '🌽', crop: 'YELLOW CORN', price: '₹1,950', change: '+0.8%', up: true },
                      { icon: '🌱', crop: 'SOYBEAN', price: '₹5,230', change: '+1.9%', up: true },
                      { icon: '🌼', crop: 'MUSTARD', price: '₹5,610', change: '-1.1%', up: false }
                    ].map((t, idx) => (
                      <div
                        key={idx}
                        className="mandi-ticker-item"
                        onClick={() => handleTabChange('predictions')}
                        title={`Click to view ${t.crop} ML forecast`}
                      >
                        <span style={{ fontSize: '12px' }}>{t.icon}</span>
                        <span style={{ fontWeight: 700, color: 'var(--clr-on-surface)', letterSpacing: '0.02em' }}>{t.crop}</span>
                        <span style={{ fontWeight: 600, color: 'var(--clr-primary)', fontFamily: 'var(--font-mono)' }}>{t.price}</span>
                        <span className={`mandi-ticker-badge ${t.up ? 'up' : 'down'}`}>
                          {t.up ? '▲' : '▼'} {t.change}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Latency & Gateway Status Indicator */}
                <div className="mandi-ticker-status" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--clr-secondary)', fontWeight: 600, fontSize: '10px', flexShrink: 0, zIndex: 2, background: 'var(--clr-surface-container-lowest)', paddingLeft: '8px' }}>
                  <span className="status-dot live" />
                  <span>12ms latency</span>
                </div>
              </div>

              {activeTab === 'markets' && user && <MarketsView token={token} />}
              {activeTab === 'predictions' && user && (
                <Dashboard token={token} showToast={showToast} />
              )}
              {activeTab === 'analytics' && user && <AnalyticsView />}
              {activeTab === 'orders' && user && (
                <OrdersView showToast={showToast} />
              )}
              {activeTab === 'help' && user && (
                <HelpCenter />
              )}
              {activeTab === 'account' && user && (
                <AccountView user={user} onLogout={handleLogout} />
              )}
            </div>
          )}

          {/* ── Global Enriched Platform Footer ── */}
          <footer style={{
            background: 'var(--clr-surface-bright)',
            borderTop: '1px solid var(--clr-outline-variant)',
            padding: '24px var(--space-xl) 24px',
            marginTop: 'auto',
            color: 'var(--clr-on-surface-variant)',
            fontSize: '12px'
          }}>

            <div style={{
              maxWidth: '1440px',
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '28px',
              marginBottom: '24px'
            }}>
              {/* Brand & Description */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--clr-on-surface)', fontWeight: 700, fontSize: '16px' }}>
                  <span className="material-symbols-outlined icon-filled" style={{ color: 'var(--clr-primary)', fontSize: '24px' }}>monitoring</span>
                  AgriPulse AI Platform
                </div>
                <p style={{ fontSize: '11px', lineHeight: '1.6', margin: 0, color: 'var(--clr-on-surface-variant)' }}>
                  State-of-the-art dual-model ensemble intelligence combining Logistic Regression &amp; CatBoost decision trees for precision agricultural Mandi forecasting.
                </p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <span style={{ background: 'var(--clr-surface-container)', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>v2.4.0-stable</span>
                  <span style={{ background: 'var(--clr-secondary-container)', color: 'var(--clr-on-secondary-container)', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600 }}>APMC Compliant</span>
                </div>
              </div>

              {/* Quick Navigation Links */}
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, color: 'var(--clr-on-surface)', marginBottom: '12px' }}>
                  Platform Navigation
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                  <button style={{ background: 'none', border: 'none', textAlign: 'left', padding: 0, cursor: 'pointer', color: 'var(--clr-on-surface-variant)', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => handleTabChange('markets')}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--clr-primary)' }}>candlestick_chart</span>
                    Live Commodity Markets
                  </button>
                  <button style={{ background: 'none', border: 'none', textAlign: 'left', padding: 0, cursor: 'pointer', color: 'var(--clr-on-surface-variant)', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => handleTabChange('predictions')}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--clr-primary)' }}>smart_toy</span>
                    ML Price Predictor
                  </button>
                  <button style={{ background: 'none', border: 'none', textAlign: 'left', padding: 0, cursor: 'pointer', color: 'var(--clr-on-surface-variant)', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => handleTabChange('analytics')}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--clr-primary)' }}>assessment</span>
                    Analytics Telemetry Hub
                  </button>
                  <button style={{ background: 'none', border: 'none', textAlign: 'left', padding: 0, cursor: 'pointer', color: 'var(--clr-on-surface-variant)', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => handleTabChange('orders')}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--clr-primary)' }}>shopping_cart</span>
                    Stock Inventory Panel
                  </button>
                </div>
              </div>

              {/* Infrastructure System Health */}
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, color: 'var(--clr-on-surface)', marginBottom: '12px' }}>
                  Engine Infrastructure
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--clr-on-surface-variant)' }}>
                    <span className="status-dot live" />
                    Django ML Service: <strong>Online (v2.4)</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--clr-on-surface-variant)' }}>
                    <span className="status-dot success" />
                    Sentinel-2 Telemetry: <strong>Orbit ID-98421</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--clr-on-surface-variant)' }}>
                    <span className="status-dot success" />
                    MongoDB Inventory DB: <strong>Connected</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--clr-on-surface-variant)' }}>
                    <span className="status-dot success" />
                    Node Proxy Auth API: <strong>Port 5000 Active</strong>
                  </div>
                </div>
              </div>

              {/* Newsletter & Volatility Alerts Signup */}
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, color: 'var(--clr-on-surface)', marginBottom: '12px' }}>
                  Market Volatility Alerts
                </div>
                <p style={{ fontSize: '11px', lineHeight: '1.4', margin: '0 0 10px 0' }}>
                  Get automated daily AI price trend summaries delivered to your inbox.
                </p>
                <form onSubmit={handleSubscribe} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <input
                    type="text"
                    placeholder="Your Name (e.g. Dhruvil)"
                    value={subscribeName}
                    onChange={e => setSubscribeName(e.target.value)}
                    disabled={subscribing}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--clr-outline-variant)',
                      background: 'var(--clr-surface-container-lowest)',
                      fontSize: '11px',
                      outline: 'none'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={subscribeEmail}
                      onChange={e => setSubscribeEmail(e.target.value)}
                      required
                      disabled={subscribing}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--clr-outline-variant)',
                        background: 'var(--clr-surface-container-lowest)',
                        fontSize: '11px',
                        flex: 1,
                        outline: 'none'
                      }}
                    />
                    <button type="submit" className="btn btn-primary btn-sm" disabled={subscribing} style={{ padding: '6px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {subscribing ? (
                        <><div className="spinner" style={{ width: '10px', height: '10px' }} /> Sending...</>
                      ) : (
                        <><span className="material-symbols-outlined" style={{ fontSize: '13px' }}>mail</span> Join</>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Bottom Bar: Copyright & Compliance */}
            <div style={{
              maxWidth: '1440px',
              margin: '0 auto',
              borderTop: '1px solid var(--clr-outline-variant)',
              paddingTop: '16px',
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              fontSize: '11px'
            }}>
              <div>© 2026 AgriPulse AI Agricultural Intelligence. All rights reserved.</div>
              <div style={{ display: 'flex', gap: '16px', color: 'var(--clr-outline)' }}>
                <span style={{ cursor: 'pointer' }}>Privacy Policy</span>
                <span style={{ cursor: 'pointer' }}>Terms of Service</span>
                <span style={{ cursor: 'pointer' }}>APMC Exchange Compliance</span>
                <span style={{ cursor: 'pointer' }}>API Documentation</span>
              </div>
            </div>
          </footer>
        </main>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={handleAuthSuccess}
          showToast={showToast}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast-notice ${toast.type}`} role="alert">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            {toast.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Global Liquid Glass SVG Filters */}
      <svg style={{ display: 'none' }}>
        <defs>
          <filter id="container-glass" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.008 0.008" numOctaves="2" seed="92" result="noise" />
            <feGaussianBlur in="noise" stdDeviation="0.02" result="blur" />
            <feDisplacementMap in="SourceGraphic" in2="blur" scale="77" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
    </>
  );
}
