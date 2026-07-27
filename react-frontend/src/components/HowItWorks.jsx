import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function HowItWorks() {
  const [openFaq, setOpenFaq] = useState(0);

  // Interactive Mandi Savings Estimator State
  const [tradeVolumeTons, setTradeVolumeTons] = useState(50);
  const [cropPriceQuintal, setCropPriceQuintal] = useState(2500);

  // Estimations
  const totalVolumeQuintals = tradeVolumeTons * 10; // 1 Ton = 10 Quintals
  const totalTradeValue = totalVolumeQuintals * cropPriceQuintal;
  const estimatedSavings = Math.round(totalTradeValue * 0.042); // 4.2% yield optimization using AI prediction timing

  const steps = [
    {
      num: '01',
      title: 'Multi-Source Data Ingestion',
      icon: 'sensors',
      badge: 'Live Data Harvesting',
      description: 'Our engine continuously harvests real-time spot prices from 18+ APMC Mandis, Yahoo Finance commodity futures (Wheat ZW=F, Rice ZR=F, Cotton CT=F), and Sentinel-2 satellite vegetation indices.',
      features: ['APMC Spot Mandi Feeds', 'Yahoo Finance API Websockets', 'Sentinel-2 Telemetry Sensors', '7-Day Rolling Averages']
    },
    {
      num: '02',
      title: 'Scikit-Learn GBDT Inference',
      icon: 'psychology',
      badge: 'Dual-Model Ensemble',
      description: 'Inputs are parsed through our pre-trained Scikit-Learn pipeline featuring HistGradientBoostingClassifier (for UP/DOWN direction) and HistGradientBoostingRegressor (for target INR price).',
      features: ['8-Variate Feature Processing', '83.79% Benchmark Accuracy', 'R² Score 0.9992 Target Regression', 'Zero-Latency Inference Cache']
    },
    {
      num: '03',
      title: 'Composite Macro Signal Weighting',
      icon: 'tune',
      badge: 'Scenario Presets',
      description: 'Predictions are dynamically adjusted against real-world macro constraints: monsoon rainfall anomalies (-25% to +25%), transit freight corridors, storage capacity, and exim tariffs.',
      features: ['Transit Freight Index Surcharges', 'Monsoon Drought/Surplus Offsets', 'Warehouse Storage Buffer Rating', 'Export Policy Duties (0-15%)']
    },
    {
      num: '04',
      title: 'Precision Mandi Intelligence & Log Audit',
      icon: 'insights',
      badge: 'Actionable Forecasting',
      description: 'The system renders next-day price direction, target price INR estimates, confidence percentages, and automatically logs every run in MongoDB for audit history.',
      features: ['Confidence Level Breakdown', 'Visual Price Trajectory Graphs', 'Audited History Tracking', 'Instant Volatility Email Alerts']
    }
  ];

  const faqs = [
    {
      q: 'How does AgriPulse AI achieve 83.79% forecast accuracy?',
      a: 'We train our Scikit-Learn Gradient Boosting Decision Trees on 100,000 multi-variate historical records, cross-referencing real-time spot prices with satellite vegetation indices and transit freight surcharges.'
    },
    {
      q: 'Can I connect AgriPulse AI predictions to external ERP or Mandi software?',
      a: 'Yes, our Backend-for-Frontend Node.js REST API exposes secure JSON endpoints (/api/v1/predict and /api/v1/commodities) secured via JWT token authentication.'
    },
    {
      q: 'What happens if a Django ML worker node fails during execution?',
      a: 'Our Node.js Round-Robin Load Balancer automatically routes traffic to secondary active nodes. If all nodes are offline, a built-in Node fallback math engine generates instant predictions.'
    },
    {
      q: 'Are APMC Mandi exchange spot rates updated in real time?',
      a: 'Yes, our background Mandi Web Scraper updates commodity spot rates continuously across Wheat, Basmati Rice, Cotton, Corn, Soybean, Mustard, Groundnut, Sugarcane, Turmeric, and Chilli.'
    }
  ];

  return (
    <div className="animate-fade-up" style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 20px 60px' }}>
      {/* Header Banner */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <span className="badge badge-active" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', display: 'inline-block' }}>
          Platform Architecture &amp; ML Workflow
        </span>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '16px' }}>
          How AgriPulse AI Predicts Mandi Trends
        </h1>
        <p style={{ maxWidth: '680px', margin: '0 auto', fontSize: '16px', color: 'var(--clr-on-surface-variant)', lineHeight: '1.6' }}>
          Explore the technology behind our dual-intelligence machine learning ensemble engine combining Scikit-Learn GBDT classifiers, real-time APMC Mandi web scraping, and macro freight signals.
        </p>
      </div>

      {/* Grid of 4 Architectural Steps */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', marginBottom: '56px' }}>
        {steps.map((s, idx) => (
          <div key={idx} className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', border: '1px solid var(--clr-outline-variant)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--clr-surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--clr-primary)', border: '1px solid var(--clr-outline-variant)' }}>
                <span className="material-symbols-outlined icon-filled" style={{ fontSize: '26px' }}>{s.icon}</span>
              </div>
              <span style={{ fontSize: '32px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--clr-outline-variant)', opacity: 0.7 }}>
                {s.num}
              </span>
            </div>

            <span className="badge badge-active" style={{ alignSelf: 'flex-start', fontSize: '10px', marginBottom: '10px' }}>
              {s.badge}
            </span>

            <h3 style={{ fontSize: '19px', fontWeight: 700, marginBottom: '12px', color: 'var(--clr-on-surface)' }}>
              {s.title}
            </h3>

            <p style={{ fontSize: '13px', color: 'var(--clr-on-surface-variant)', lineHeight: '1.6', marginBottom: '20px', flex: 1 }}>
              {s.description}
            </p>

            <div style={{ borderTop: '1px solid var(--clr-outline-variant)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {s.features.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--clr-on-surface-variant)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--clr-primary)' }}>check_circle</span>
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Mandi Profit Calculator */}
      <div className="card" style={{ padding: '32px', marginBottom: '56px', background: 'var(--clr-surface-bright)', border: '1px solid var(--clr-outline-variant)' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <span className="badge badge-active" style={{ fontSize: '10px', textTransform: 'uppercase', marginBottom: '8px' }}>
            Interactive Mandi Profit Estimator
          </span>
          <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 8px 0' }}>
            Calculate Estimated AI Margin Gains
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--clr-on-surface-variant)', margin: 0 }}>
            Adjust your monthly trade volume and crop rate to preview potential margin improvements achieved through precision entry/exit timing.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px', alignItems: 'center' }}>
          {/* Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Monthly Commodity Volume</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--clr-primary)' }}>{tradeVolumeTons} Tons ({totalVolumeQuintals} Qtl)</span>
              </label>
              <input
                type="range"
                min="10"
                max="500"
                step="10"
                className="form-range"
                value={tradeVolumeTons}
                onChange={e => setTradeVolumeTons(Number(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Average Commodity Rate (₹/Quintal)</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--clr-primary)' }}>₹{cropPriceQuintal.toLocaleString('en-IN')}</span>
              </label>
              <input
                type="range"
                min="1000"
                max="15000"
                step="250"
                className="form-range"
                value={cropPriceQuintal}
                onChange={e => setCropPriceQuintal(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Results Box */}
          <div style={{
            background: 'var(--clr-surface-container-low)',
            borderRadius: '16px',
            padding: '28px',
            textAlign: 'center',
            border: '1px solid var(--clr-outline-variant)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--clr-outline)', fontWeight: 600 }}>
              Estimated Monthly Value Preserved
            </span>
            <span style={{ fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 900, color: 'var(--clr-secondary)', fontFamily: 'var(--font-mono)' }}>
              ₹{estimatedSavings.toLocaleString('en-IN')}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--clr-on-surface-variant)' }}>
              Based on total turnover of ₹{totalTradeValue.toLocaleString('en-IN')} @ 4.2% AI timing optimization
            </span>
            <Link to="/predictions" className="btn btn-primary btn-sm" style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>smart_toy</span>
              Run Prediction Now
            </Link>
          </div>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div style={{ marginBottom: '48px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 8px 0' }}>Frequently Asked Questions</h2>
          <p style={{ fontSize: '13px', color: 'var(--clr-on-surface-variant)', margin: 0 }}>Common technical questions regarding our predictive microservices.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="card"
              style={{ padding: '18px 24px', cursor: 'pointer', border: '1px solid var(--clr-outline-variant)' }}
              onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--clr-on-surface)' }}>{faq.q}</h4>
                <span className="material-symbols-outlined" style={{ color: 'var(--clr-primary)', transform: openFaq === idx ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                  expand_more
                </span>
              </div>
              {openFaq === idx && (
                <p style={{ marginTop: '12px', marginBottom: 0, fontSize: '13px', color: 'var(--clr-on-surface-variant)', lineHeight: '1.6' }}>
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Model Performance Banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--clr-surface-bright), var(--clr-surface-container))',
        border: '1px solid var(--clr-outline-variant)',
        borderRadius: '16px',
        padding: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '24px'
      }}>
        <div style={{ maxWidth: '600px' }}>
          <h3 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>
            Ready to test live predictions?
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--clr-on-surface-variant)', margin: 0, lineHeight: '1.5' }}>
            Run your first market calculation using our 8-variate signal input deck or apply preset bullish and bearish scenarios.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link to="/predictions" className="btn btn-primary btn-lg" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined">smart_toy</span>
            Launch ML Predictor
          </Link>
          <Link to="/contact" className="btn btn-secondary btn-lg" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined">mail</span>
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
