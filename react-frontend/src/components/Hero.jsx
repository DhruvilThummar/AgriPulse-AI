import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Hero({ user, onGetStarted }) {
  const [stats, setStats] = useState({
    modelAccuracy: '94.7%',
    commoditiesCount: '48+',
    dailyVolume: '₹2.4B',
    statesCovered: '18'
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/commodity-prices/platform-stats');
        if (response.data) {
          setStats({
            modelAccuracy: response.data.modelAccuracy,
            commoditiesCount: `${response.data.commoditiesCount}+`,
            dailyVolume: response.data.dailyVolume,
            statesCovered: String(response.data.statesCovered)
          });
        }
      } catch (err) {
        console.warn('Failed to fetch platform stats:', err.message);
      }
    };
    fetchStats();
  }, []);

  return (
    <section
      id="hero"
      style={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '48px 24px',
        background: 'linear-gradient(rgba(1, 45, 29, 0.88), rgba(6, 17, 13, 0.95)), url("https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1920&q=80")',
        backgroundSize: '110% 110%',
        backgroundPosition: 'center center',
        animation: 'moveBackground 120s ease-in-out infinite',
        color: '#ffffff',
        width: '100%'
      }}
      aria-label="Hero Section"
    >
      {/* Headline */}
      <h1
        style={{
          fontSize: 'clamp(32px, 5vw, 48px)',
          fontWeight: 700,
          lineHeight: 1.15,
          letterSpacing: '-0.02em',
          color: '#ffffff',
          maxWidth: '720px',
          marginBottom: '24px',
        }}
      >
        Smarter Commodity Trading with AI
      </h1>

      {/* Subtitle */}
      <p
        style={{
          fontSize: '16px',
          lineHeight: '24px',
          color: 'rgba(255, 255, 255, 0.75)',
          maxWidth: '640px',
          marginBottom: '40px',
        }}
      >
        Leverage advanced predictive analytics to anticipate market trends, optimize
        supply chains, and secure better margins in high-stakes agricultural trading.
      </p>

      {/* CTA */}
      {/* CTA */}
      <button
        className="btn"
        onClick={onGetStarted}
        style={{
          boxShadow: '0 4px 16px 0 rgba(44, 105, 78, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.35)',
          fontSize: '20px',
          lineHeight: '28px',
          padding: '12px 36px',
          background: 'linear-gradient(135deg, var(--clr-primary) 0%, var(--clr-primary-container) 100%)',
          color: '#ffffff',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease',
          fontWeight: 700
        }}
        id="hero-cta"
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.04)';
          e.currentTarget.style.boxShadow = '0 8px 24px 0 rgba(44, 105, 78, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.45)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 16px 0 rgba(44, 105, 78, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.35)';
        }}
      >
        {user ? 'Go to Dashboard' : 'Get Started'}
      </button>

      {/* Stats strip */}
      <div
        className="glass-refraction"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          marginTop: '72px',
          maxWidth: '700px',
          width: '100%',
          borderRadius: '20px',
          padding: 0
        }}
        role="region"
        aria-label="Platform statistics"
      >
        {[
          { val: stats.modelAccuracy, lbl: 'Model Accuracy' },
          { val: stats.commoditiesCount,   lbl: 'Commodities' },
          { val: stats.dailyVolume, lbl: 'Daily Volume' },
          { val: stats.statesCovered,    lbl: 'States Covered' },
        ].map((stat, idx, arr) => (
          <div
            key={idx}
            style={{
              flex: '1 1 140px',
              padding: '24px 16px',
              textAlign: 'center',
              borderRight: idx < arr.length - 1 ? '1px solid rgba(255, 255, 255, 0.12)' : 'none',
            }}
          >
            <span
              style={{
                display: 'block',
                fontSize: '28px',
                fontWeight: 700,
                color: '#34d399',
                fontFamily: 'var(--font-mono)',
                lineHeight: 1.2,
              }}
            >
              {stat.val}
            </span>
            <span
              style={{
                display: 'block',
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.75)',
                fontWeight: 600,
                marginTop: '6px',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              {stat.lbl}
            </span>
          </div>
        ))}
      </div>

      {/* Features Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          marginTop: '60px',
          maxWidth: '900px',
          width: '100%',
        }}
      >
        {[
          { icon: 'psychology', title: 'AI Price Forecasting', desc: 'Predict commodity breakout trends using predictive machine learning models calibrated on active spot data.' },
          { icon: 'satellite_alt', title: 'Sentinel-2 Telemetry', desc: 'Monitor regional vegetation indexes and live soil health sensors via high-resolution satellite imagery.' },
          { icon: 'query_stats', title: 'Smart Inventory Manager', desc: 'Monitor reserves, map risk thresholds, and trigger instant auto-suggestions to avoid market decay.' }
        ].map((feat, idx) => (
          <div
            key={idx}
            className="glass-refraction"
            style={{
              padding: '24px',
              borderRadius: '16px',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s',
              cursor: 'default'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(52, 211, 153, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#34d399'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>{feat.icon}</span>
            </div>
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>{feat.title}</h4>
            <p style={{ margin: 0, fontSize: '12px', lineHeight: '1.6', color: 'rgba(255, 255, 255, 0.7)' }}>{feat.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
