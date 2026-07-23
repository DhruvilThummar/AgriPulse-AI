import React from 'react';

export default function AccountView({ user, onLogout }) {
  const joinDate = '2026-07-01';

  return (
    <div className="animate-fade-up" id="account-view">
      <div className="section-header">
        <div>
          <h1 style={{ fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 700, margin: 0 }}>Terminal Account Profile</h1>
          <p className="subtitle">Manage user privileges, access credentials, and security levels.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '24px', marginTop: '16px', alignItems: 'start' }}>
        
        {/* User Card */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'var(--clr-primary)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            fontWeight: 'bold',
            marginBottom: '16px',
            boxShadow: 'var(--shadow-level-2)'
          }}>
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <h3 style={{ margin: '0 0 4px 0' }}>{user?.username || 'Trader Member'}</h3>
          <span style={{ fontSize: '11px', color: 'var(--clr-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Ensemble Access Active
          </span>
          
          <div style={{ width: '100%', borderTop: '1px solid var(--clr-outline-variant)', margin: '20px 0', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--clr-on-surface-variant)' }}>Email Address:</span>
              <strong style={{ color: 'var(--clr-on-surface)' }}>{user?.email || 'N/A'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--clr-on-surface-variant)' }}>Member Since:</span>
              <strong style={{ color: 'var(--clr-on-surface)' }}>{joinDate}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--clr-on-surface-variant)' }}>Auth Protocol:</span>
              <strong style={{ color: 'var(--clr-secondary)' }}>JWT Token Secure</strong>
            </div>
          </div>

          <button className="btn btn-danger" onClick={onLogout} style={{ width: '100%', justifyContent: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined">logout</span>
            Sign Out of Terminal
          </button>
        </div>

        {/* Security & Access Logs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0' }}>Security Privileges & Limits</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { title: "Dual ML Prediction Access", status: "ENABLED", desc: "Access to run real-time CatBoost + Logistic Regression inferences." },
                { title: "IoT Satellite Re-sync Channel", status: "ENABLED", desc: "Secured uplink to Sentinel-2 satellite recon nodes." },
                { title: "Storage Terminal Capacity Limit", status: "400 Tons Maximum", desc: "Safety holding volume threshold defined for your regional warehouse." }
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', borderBottom: '1px solid var(--clr-outline-variant)', paddingBottom: '12px' }}>
                  <div style={{ flex: 1, marginRight: '16px' }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--clr-on-surface)' }}>{item.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--clr-on-surface-variant)', marginTop: '2px' }}>{item.desc}</div>
                  </div>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    background: item.status.includes('ENABLED') ? 'rgba(52, 211, 153, 0.1)' : 'rgba(1, 45, 29, 0.05)',
                    color: item.status.includes('ENABLED') ? 'var(--clr-secondary)' : 'var(--clr-primary)',
                    fontSize: '10px',
                    fontWeight: 700
                  }}>{item.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
