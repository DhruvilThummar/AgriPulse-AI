import React from 'react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  const sections = [
    {
      title: '1. Information We Collect',
      icon: 'shield_person',
      content: `AgriCast AI collects information required to deliver high-precision agricultural market predictions and maintain account security:
      • Account Data: Full Name, Email Address, and encrypted password credentials (hashed with bcrypt 10 salt rounds).
      • Telemetry & Usage Input: Commodity selections, freight corridor settings, and numeric parameter inputs supplied during prediction requests.
      • Technical Logs: Session JWT authorization tokens, IP addresses, and standard HTTP web gateway metadata.`
    },
    {
      title: '2. How We Use Your Data',
      icon: 'database',
      content: `Your data is strictly utilized for core operational and platform enhancement purposes:
      • Processing Scikit-Learn machine learning predictions and target price calculations.
      • Retaining user prediction history in MongoDB so you can audit, analyze, or delete past market signals.
      • Dispatching optional market volatility digests and Nodemailer confirmation alerts.
      • We NEVER sell, license, or monetize personal user records to third-party advertising networks.`
    },
    {
      title: '3. Data Security & Encryption Standards',
      icon: 'lock',
      content: `We implement rigorous security standards to safeguard your agricultural market data:
      • Passwords are strictly hashed with industry-standard bcrypt salt encryption.
      • API communication between the React frontend, Node.js gateway, and Django predict microservices is authenticated via JSON Web Tokens (JWT).
      • Load balanced worker nodes execute ML inference without persisting raw user input credentials.`
    },
    {
      title: '4. APMC Compliance & Web Scraping Transparency',
      icon: 'gavel',
      content: `AgriCast AI operates in alignment with APMC Mandi exchange regulations:
      • Live Mandi spot prices are scraped from publicly available agricultural board feeds and financial APIs.
      • Forecasts represent probabilistic mathematical guidance and should be evaluated alongside local Mandi board spot rates before committing capital.`
    },
    {
      title: '5. User Rights & Data Deletion',
      icon: 'delete_history',
      content: `You maintain complete sovereignty over your prediction audit logs:
      • You can clear your complete prediction log history anytime via the "Clear History" button in the ML Predictor dashboard.
      • Single prediction records can be individually deleted from MongoDB.
      • To request account closure or full data erasure, submit a request via our Contact Page.`
    }
  ];

  return (
    <div className="animate-fade-up" style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 20px 60px' }}>
      {/* Header Banner */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <span className="badge badge-active" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', display: 'inline-block' }}>
          Compliance &amp; Security Standards
        </span>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '12px' }}>
          AgriCast AI Privacy Policy
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--clr-on-surface-variant)', margin: 0 }}>
          Last Updated: July 2026 • Version 2.4.0 APMC Compliant
        </p>
      </div>

      {/* Policy Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px' }}>
        {sections.map((sec, idx) => (
          <div key={idx} className="card" style={{ padding: '24px', border: '1px solid var(--clr-outline-variant)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--clr-surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--clr-primary)' }}>
                <span className="material-symbols-outlined">{sec.icon}</span>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>{sec.title}</h3>
            </div>
            <div style={{ fontSize: '14px', color: 'var(--clr-on-surface-variant)', lineHeight: '1.7', whiteSpace: 'pre-line' }}>
              {sec.content}
            </div>
          </div>
        ))}
      </div>

      {/* Contact CTA */}
      <div style={{ textAlign: 'center', padding: '24px', background: 'var(--clr-surface-bright)', borderRadius: '12px', border: '1px solid var(--clr-outline-variant)' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 700 }}>Have questions about our data privacy practices?</h4>
        <p style={{ fontSize: '13px', color: 'var(--clr-on-surface-variant)', marginBottom: '16px' }}>Our technical desk and compliance team are available to assist.</p>
        <Link to="/contact" className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>mail</span>
          Contact Privacy Desk
        </Link>
      </div>
    </div>
  );
}
