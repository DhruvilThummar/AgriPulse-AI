import React, { useState } from 'react';

const FAQS = [
  {
    q: "What is AgriCast AI?",
    a: "AgriCast AI is an advanced commodity analysis and price trend forecasting terminal. It uses dual machine learning models (Logistic Regression and CatBoost Classifier) to analyze market signals and estimate price fluctuations."
  },
  {
    q: "What does '₹/Qtl' stand for?",
    a: "It stands for Rupees per Quintal. A Quintal is a metric unit of mass equal to 100 kilograms. It is the standard unit of trade for agricultural commodities in India."
  },
  {
    q: "How does the ML Predictor make forecasts?",
    a: "The system runs an ensemble pipeline that averages the probabilities of a Logistic Regression model and a CatBoost Tree classifier. It checks previous prices, current supply volume, transport costs, and market demand to forecast if tomorrow's price trend will move UP or DOWN."
  },
  {
    q: "What is the NDVI Index and how does it affect yields?",
    a: "NDVI (Normalized Difference Vegetation Index) measures crop canopy greenness via multispectral satellite sensors. A higher NDVI indicates healthier vegetation, which recalculates predicted regional yields upwards."
  },
  {
    q: "What are the automated liquidation actions?",
    a: "The AI Stock Panel tracks holding durations and market risk exposure. When tomorrow's forecast shows a DOWN trend with high confidence, the system suggests a 'LIQUIDATE' optimization action to sell a portion of the stock and protect your capital from market drops."
  }
];

export default function HelpCenter() {
  const [openIdx, setOpenIdx] = useState(null);

  return (
    <div className="animate-fade-up" id="help-center">
      <div className="section-header">
        <div>
          <h1 style={{ fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 700, margin: 0 }}>Help & Knowledge Center</h1>
          <p className="subtitle">Beginner's guide to trading terms, telemetry indexes, and predictive engines.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', marginTop: '16px', alignItems: 'start' }}>
        
        {/* FAQs */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0' }}>Frequently Asked Questions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {FAQS.map((faq, idx) => (
              <div 
                key={idx} 
                style={{ 
                  border: '1px solid var(--clr-outline-variant)', 
                  borderRadius: '8px', 
                  background: openIdx === idx ? 'var(--clr-surface-container-low)' : 'var(--clr-surface-bright)',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease'
                }}
              >
                <button
                  onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: 'none',
                    border: 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: 'var(--clr-on-surface)',
                    fontWeight: 600,
                    fontSize: '13px'
                  }}
                >
                  <span>{faq.q}</span>
                  <span className="material-symbols-outlined" style={{
                    transform: openIdx === idx ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s'
                  }}>expand_more</span>
                </button>
                {openIdx === idx && (
                  <div style={{ padding: '0 16px 16px 16px', fontSize: '12px', color: 'var(--clr-on-surface-variant)', lineHeight: 1.6 }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Terminology Guide */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 12px 0' }}>Key Terms Defined</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { term: "Quintal (Qtl)", desc: "Standard trade mass of 100 kg. Used for billing and market prices." },
                { term: "Transport Cost Index", desc: "Relative cost multiplier representing fuel charges, toll increases, and freight logistics." },
                { term: "Market Demand Score", desc: "Estimated buyer momentum graded from 1 (inactive market) to 10 (high buyer competition)." },
                { term: "Ensemble Modeling", desc: "Combining outputs of different ML algorithms to increase overall prediction accuracy." },
                { term: "Risk Mitigation Factor", desc: "Estimated holding safety index mapped from storage decay models and market pricing volatility." }
              ].map((item, idx) => (
                <div key={idx} style={{ borderBottom: '1px solid var(--clr-outline-variant)', paddingBottom: '12px' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--clr-primary)', marginBottom: '4px' }}>{item.term}</div>
                  <div style={{ fontSize: '11px', color: 'var(--clr-on-surface-variant)', lineHeight: 1.4 }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
