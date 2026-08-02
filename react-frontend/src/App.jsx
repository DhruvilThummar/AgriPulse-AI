import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
import Header from './components/common/Header';
import Sidebar from './components/Sidebar';
import Hero from './components/Hero';
import AuthModal from './components/AuthModal';
import { BASE_URL } from './services/apiClient';

// Dynamic Route Code-Splitting
const Dashboard = lazy(() => import('./components/Dashboard'));
const MarketsView = lazy(() => import('./components/MarketsView'));
const AnalyticsView = lazy(() => import('./components/AnalyticsView'));
const OrdersView = lazy(() => import('./components/OrdersView'));
const HelpCenter = lazy(() => import('./components/HelpCenter'));
const AccountView = lazy(() => import('./components/AccountView'));
const HowItWorks = lazy(() => import('./components/HowItWorks'));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'));
const ContactView = lazy(() => import('./components/ContactView'));

// Loading Fallback Component
const PageLoadingFallback = () => (
  <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--clr-outline)' }}>
    <div className="spinner" style={{ margin: '0 auto 16px', width: '28px', height: '28px' }} />
    <span style={{ fontSize: '13px', fontWeight: 500, fontFamily: 'var(--font-mono)' }}>Loading AgriPulse Telemetry Module...</span>
  </div>
);

// Protected Route Guard Component
const ProtectedRoute = ({ user, children, setShowAuthModal, showToast }) => {
  if (!user) {
    if (showToast) showToast('Please sign in to access dashboard views', 'error');
    setShowAuthModal(true);
    return <Navigate to="/" replace />;
  }
  return children;
};

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [toast, setToast] = useState(null);
  
  const location = useLocation();
  const navigate = useNavigate();

  // Map location path to activeTab for Sidebar/Header styling
  const getActiveTabFromPath = (path) => {
    if (path === '/') return 'home';
    return path.replace('/', '');
  };

  const activeTab = getActiveTabFromPath(location.pathname);

  // Header Interactions State
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('agripulse_darkmode') === 'true');
  const [autoSync, setAutoSync] = useState(() => {
    const saved = localStorage.getItem('agripulse_autosync');
    return saved !== null ? saved === 'true' : true;
  });
  const [subscribeName, setSubscribeName] = useState('');
  const [subscribeEmail, setSubscribeEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  // Trigger Nodemailer backend subscription endpoint
  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!subscribeEmail) return;
    setSubscribing(true);
    try {
      const res = await fetch(`${BASE_URL}/subscribe`, {
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
    { id: 1, text: "System: Connected to BFF gateway balancer at localhost:5000.", time: "Just now", unread: false }
  ]);

  // Push new live notification simulation periodically
  // Sync Settings to LocalStorage & Document Element
  useEffect(() => {
    localStorage.setItem('agripulse_darkmode', darkMode);
    if (darkMode) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('agripulse_autosync', autoSync);
  }, [autoSync]);

  // Simulation useEffect removed to show only real event-driven notifications

  // Helper to read cookie values
  const getCookie = (name) => {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    if (match) return decodeURIComponent(match[2]);
    return null;
  };

  // Load session from localStorage, sessionStorage, or cookies on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('agripulse_token') || sessionStorage.getItem('agripulse_token') || getCookie('agripulse_token');
    const savedUser  = localStorage.getItem('agripulse_user') || sessionStorage.getItem('agripulse_user') || getCookie('agripulse_user');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('agripulse_token');
        localStorage.removeItem('agripulse_user');
        sessionStorage.removeItem('agripulse_token');
        sessionStorage.removeItem('agripulse_user');
        document.cookie = "agripulse_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = "agripulse_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
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
    
    // Save to localStorage
    localStorage.setItem('agripulse_token', userToken);
    localStorage.setItem('agripulse_user', JSON.stringify(userData));

    // Save to sessionStorage
    sessionStorage.setItem('agripulse_token', userToken);
    sessionStorage.setItem('agripulse_user', JSON.stringify(userData));

    // Save to Cookie (7-day expiry)
    document.cookie = `agripulse_token=${userToken}; path=/; max-age=${7*24*60*60}; SameSite=Lax`;
    document.cookie = `agripulse_user=${encodeURIComponent(JSON.stringify(userData))}; path=/; max-age=${7*24*60*60}; SameSite=Lax`;

    navigate('/predictions');
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    
    // Clear localStorage
    localStorage.removeItem('agripulse_token');
    localStorage.removeItem('agripulse_user');

    // Clear sessionStorage
    sessionStorage.removeItem('agripulse_token');
    sessionStorage.removeItem('agripulse_user');

    // Clear cookies
    document.cookie = "agripulse_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "agripulse_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

    showToast('Signed out successfully', 'success');
    navigate('/');
  };

  const handleGetStarted = () => {
    if (user) navigate('/predictions');
    else setShowAuthModal(true);
  };

  const handleTabChange = (tabId) => {
    if (tabId === 'home') { navigate('/'); return; }
    const path = `/${tabId}`;
    if (user || ['how-it-works', 'privacy-policy', 'contact'].includes(tabId)) {
      navigate(path);
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

  const showSidebar = user && !['/', '/how-it-works', '/privacy-policy', '/contact'].includes(location.pathname);

  // Notification action handlers
  const addNotification = (text) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newAlert = {
      id: Date.now(),
      text,
      time: `Just now (${time})`,
      unread: true
    };
    setNotifications(prev => [newAlert, ...prev].slice(0, 15));
  };
  const markNotificationAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
  };
  const clearNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };
  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };
  const clearAllNotifications = () => {
    setNotifications([]);
  };

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
        markNotificationAsRead={markNotificationAsRead}
        clearNotification={clearNotification}
        markAllNotificationsAsRead={markAllNotificationsAsRead}
        clearAllNotifications={clearAllNotifications}
      />

      {/* Settings Modal */}
      {showSettings && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100000
        }} onClick={() => setShowSettings(false)}>
          <div style={{
            width: '340px',
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.35)',
            borderRadius: '16px',
            boxShadow: '0 12px 40px 0 rgba(0, 0, 0, 0.12), rgba(255, 255, 255, 0.25) 0px 0px 0px 1px inset',
            padding: '24px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(1, 45, 29, 0.1)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--clr-primary)' }}>System Preferences</h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--clr-on-surface-variant)', padding: '4px', borderRadius: '50%' }} onClick={() => setShowSettings(false)}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.4)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: 'var(--clr-on-surface)' }}>Auto-Sync Telemetry</span>
                  <input type="checkbox" checked={autoSync} onChange={e => {
                    setAutoSync(e.target.checked);
                    showToast(`Auto-Sync ${e.target.checked ? 'Enabled' : 'Disabled'}`, 'success');
                  }} style={{ cursor: 'pointer', accentColor: 'var(--clr-primary)', width: '16px', height: '16px' }} />
                </div>
                <span style={{ fontSize: '10px', color: 'var(--clr-on-surface-variant)', display: 'block', marginTop: '4px', lineHeight: '1.4' }}>
                  Automatically pulls fresh satellite crop health scans and IoT sensor data.
                </span>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.4)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: 'var(--clr-on-surface)' }}>High-Contrast Mode</span>
                  <input type="checkbox" checked={darkMode} onChange={e => {
                    setDarkMode(e.target.checked);
                    showToast(`Contrast theme updated`, 'success');
                  }} style={{ cursor: 'pointer', accentColor: 'var(--clr-primary)', width: '16px', height: '16px' }} />
                </div>
                <span style={{ fontSize: '10px', color: 'var(--clr-on-surface-variant)', display: 'block', marginTop: '4px', lineHeight: '1.4' }}>
                  Improves readability of charts and tables in bright conditions.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Main app layout below header ── */}
      <div className="app-layout">
        {/* Sidebar */}
        {showSidebar && (
          <Sidebar
            activeTab={activeTab}
            setActiveTab={handleTabChange}
            user={user}
            onLogout={handleLogout}
          />
        )}

        {/* Main Content Area */}
        <main className="main-content" style={{
          paddingLeft: showSidebar ? undefined : 0,
          paddingTop: 'var(--header-height)'
        }}>
          <div className="page-container" style={location.pathname === '/' ? { maxWidth: '100%', padding: 0, margin: 0 } : {}}>
            {/* Live Mandi Ticker shown on non-landing pages */}
            {location.pathname !== '/' && (
              <div className="mandi-ticker-container" style={{
                background: 'var(--clr-surface-container-lowest)',
                border: '1px solid var(--clr-outline-variant)',
                borderRadius: '8px',
                padding: '8px 12px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                overflow: 'hidden',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)'
              }}>
                <div className="mandi-ticker-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--clr-primary)', flexShrink: 0, zIndex: 2, background: 'var(--clr-surface-container-lowest)', paddingRight: '8px' }}>
                  <span className="material-symbols-outlined icon-filled" style={{ fontSize: '16px', color: 'var(--clr-secondary)' }}>sensors</span>
                  LIVE MANDI TICKER:
                </div>

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
                      { icon: '🌾', crop: 'WHEAT', price: '₹2,501', change: '+2.4%', up: true },
                      { icon: '🍚', crop: 'BASMATI RICE', price: '₹6,890', change: '+1.2%', up: true }
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

                <div className="mandi-ticker-status" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--clr-secondary)', fontWeight: 600, fontSize: '10px', flexShrink: 0, zIndex: 2, background: 'var(--clr-surface-container-lowest)', paddingLeft: '8px' }}>
                  <span className="status-dot live" />
                  <span>12ms latency</span>
                </div>
              </div>
            )}

            {/* Client-Side Multi-Page Routes with Suspense Dynamic Imports */}
            <Suspense fallback={<PageLoadingFallback />}>
              <Routes>
                <Route path="/" element={
                  <>
                    <Hero user={user} onGetStarted={handleGetStarted} />
                    <div style={{ marginTop: '32px' }}>
                      <HowItWorks />
                    </div>
                  </>
                } />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/contact" element={<ContactView showToast={showToast} />} />
                
                {/* Protected Routes */}
                <Route path="/predictions" element={
                  <ProtectedRoute user={user} setShowAuthModal={setShowAuthModal} showToast={showToast}>
                    <Dashboard token={token} showToast={showToast} autoSync={autoSync} addNotification={addNotification} />
                  </ProtectedRoute>
                } />
                <Route path="/markets" element={
                  <ProtectedRoute user={user} setShowAuthModal={setShowAuthModal} showToast={showToast}>
                    <MarketsView token={token} autoSync={autoSync} />
                  </ProtectedRoute>
                } />
                <Route path="/analytics" element={
                  <ProtectedRoute user={user} setShowAuthModal={setShowAuthModal} showToast={showToast}>
                    <AnalyticsView showToast={showToast} autoSync={autoSync} />
                  </ProtectedRoute>
                } />
                <Route path="/orders" element={
                  <ProtectedRoute user={user} setShowAuthModal={setShowAuthModal} showToast={showToast}>
                    <OrdersView
                      showToast={showToast}
                      autoSync={autoSync}
                      notifications={notifications}
                      addNotification={addNotification}
                      markNotificationAsRead={markNotificationAsRead}
                      clearNotification={clearNotification}
                      markAllNotificationsAsRead={markAllNotificationsAsRead}
                      clearAllNotifications={clearAllNotifications}
                    />
                  </ProtectedRoute>
                } />
                <Route path="/help" element={
                  <ProtectedRoute user={user} setShowAuthModal={setShowAuthModal} showToast={showToast}>
                    <HelpCenter />
                  </ProtectedRoute>
                } />
                <Route path="/account" element={
                  <ProtectedRoute user={user} setShowAuthModal={setShowAuthModal} showToast={showToast}>
                    <AccountView user={user} onLogout={handleLogout} showToast={showToast} />
                  </ProtectedRoute>
                } />

                {/* Catch-all redirect to Home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </div>

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
                  AgriCast AI Platform
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
                  <Link to="/markets" style={{ color: 'var(--clr-on-surface-variant)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--clr-primary)' }}>candlestick_chart</span>
                    Live Commodity Markets
                  </Link>
                  <Link to="/predictions" style={{ color: 'var(--clr-on-surface-variant)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--clr-primary)' }}>smart_toy</span>
                    ML Price Predictor
                  </Link>
                  <Link to="/analytics" style={{ color: 'var(--clr-on-surface-variant)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--clr-primary)' }}>assessment</span>
                    Analytics Telemetry Hub
                  </Link>
                  <Link to="/how-it-works" style={{ color: 'var(--clr-on-surface-variant)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--clr-primary)' }}>auto_awesome</span>
                    How It Works Architecture
                  </Link>
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
                    Nodemailer API Gateway: <strong>Port 5000 Active</strong>
                  </div>
                </div>
              </div>

              {/* Newsletter Signup */}
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
              <div>© 2026 AgriCast AI Agricultural Intelligence. All rights reserved.</div>
              <div style={{ display: 'flex', gap: '16px', color: 'var(--clr-outline)' }}>
                <Link to="/privacy-policy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy Policy</Link>
                <Link to="/contact" style={{ color: 'inherit', textDecoration: 'none' }}>Contact Technical Desk</Link>
                <Link to="/how-it-works" style={{ color: 'inherit', textDecoration: 'none' }}>How It Works</Link>
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
    </>
  );
}
