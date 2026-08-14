import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from '../services/apiClient';

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
        const response = await axios.get(`${BASE_URL}/commodity-prices/platform-stats`);
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
        padding: '64px 24px',
        background: `
          linear-gradient(180deg, rgba(4, 30, 21, 0.78) 0%, rgba(2, 20, 14, 0.92) 65%, rgba(6, 17, 13, 0.98) 100%),
          radial-gradient(circle at 50% 30%, rgba(16, 185, 129, 0.25) 0%, transparent 60%),
          url("https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=2000&q=85")
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundAttachment: 'fixed',
        color: '#ffffff',
        width: '100%',
        position: 'relative',
        overflow: 'hidden'
      }}
      aria-label="Hero Section"
    >
      {/* Badges strip */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <span className="badge badge-active" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          ✨ Ensemble ML Engine v2.4 Active
        </span>
        <span style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, border: '1px solid rgba(52, 211, 153, 0.3)' }}>
          APMC Exchange Telemetry
        </span>
      </div>

      {/* Headline */}
      <h1
        style={{
          fontSize: 'clamp(32px, 5vw, 50px)',
          fontWeight: 800,
          lineHeight: 1.15,
          letterSpacing: '-0.02em',
          color: '#ffffff',
          maxWidth: '780px',
          marginBottom: '24px',
        }}
      >
        Smarter Mandi Commodity Trading with AI Ensemble Intelligence
      </h1>

      {/* Subtitle */}
      <p
        style={{
          fontSize: '16px',
          lineHeight: '26px',
          color: 'rgba(255, 255, 255, 0.8)',
          maxWidth: '680px',
          marginBottom: '36px',
        }}
      >
        Anticipate agricultural market price shifts, evaluate 8-variate supply &amp; freight signals, and optimize trade margins using our Scikit-Learn GBDT predictive engine.
      </p>

      {/* Dual CTA Buttons */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          className="btn"
          onClick={onGetStarted}
          style={{
            boxShadow: '0 4px 18px 0 rgba(44, 105, 78, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.35)',
            fontSize: '16px',
            padding: '14px 32px',
            background: 'linear-gradient(135deg, var(--clr-primary) 0%, var(--clr-primary-container) 100%)',
            color: '#ffffff',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            cursor: 'pointer',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          id="hero-cta"
        >
          <span className="material-symbols-outlined">smart_toy</span>
          {user ? 'Go to ML Predictor' : 'Launch Predictor'}
        </button>

        <a
          href="/how-it-works"
          className="btn"
          style={{
            fontSize: '16px',
            padding: '14px 28px',
            background: 'rgba(255, 255, 255, 0.1)',
            color: '#ffffff',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none'
          }}
        >
          <span className="material-symbols-outlined">auto_awesome</span>
          How It Works
        </a>
      </div>

      {/* Stats strip */}
      <div
        className="glass-refraction"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          marginTop: '72px',
          maxWidth: '740px',
          width: '100%',
          borderRadius: '20px',
          padding: 0
        }}
        role="region"
        aria-label="Platform statistics"
      >
        {[
          { val: stats.modelAccuracy, lbl: 'Model Accuracy', icon: 'verified_user' },
          { val: stats.commoditiesCount, lbl: 'Commodities', icon: 'agriculture' },
          { val: stats.dailyVolume, lbl: 'Daily Volume', icon: 'payments' },
          { val: stats.statesCovered, lbl: 'States Covered', icon: 'map' },
        ].map((stat, idx, arr) => (
          <div
            key={idx}
            style={{
              flex: '1 1 150px',
              padding: '20px 16px',
              textAlign: 'center',
              borderRight: idx < arr.length - 1 ? '1px solid rgba(255, 255, 255, 0.12)' : 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{stat.icon}</span>
              <span
                style={{
                  fontSize: '26px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  lineHeight: 1.2,
                }}
              >
                {stat.val}
              </span>
            </div>
            <span
              style={{
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.75)',
                fontWeight: 600,
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
