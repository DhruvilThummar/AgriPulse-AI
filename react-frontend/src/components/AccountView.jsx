import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function AccountView({ user, onLogout, showToast }) {
  const joinDate = '2026-07-01';

  // Stats edit states
  const [cash, setCash] = useState(2103280);
  const [limit, setLimit] = useState(400);
  const [saving, setSaving] = useState(false);

  const activeToken = localStorage.getItem('agripulse_token') || sessionStorage.getItem('agripulse_token');

  // Fetch current persistent inventory details
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/inventory', {
          headers: { Authorization: `Bearer ${activeToken}` }
        });
        if (response.data && response.data.success) {
          if (response.data.cashReserves !== undefined) {
            setCash(response.data.cashReserves);
          }
          if (response.data.storageLimit !== undefined) {
            setLimit(response.data.storageLimit);
          }
        }
      } catch (err) {
        console.error('Failed to fetch stats in AccountView:', err);
      }
    };
    if (activeToken) {
      fetchData();
    }
  }, [activeToken]);

  // Handle saving new cash reserves & storage limit to DB
  const handleSaveStats = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await axios.post('http://localhost:5000/api/inventory/adjust', {
        cashReserves: Number(cash),
        storageLimit: Number(limit)
      }, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      if (response.data && response.data.success) {
        if (showToast) showToast('Regional stats updated successfully!', 'success');
        // Dispatch custom event to notify other views (e.g. OrdersView) to refresh
        window.dispatchEvent(new Event('inventoryUpdated'));
      }
    } catch (err) {
      console.error('Failed to update stats:', err);
      if (showToast) showToast('Failed to update regional stats', 'error');
    } finally {
      setSaving(false);
    }
  };

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
        <div 
          className="card" 
          style={{ 
            padding: '28px 24px', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.45)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.35)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.05), inset 0 0 0 1px rgba(255, 255, 255, 0.2)'
          }}
        >
          <div style={{
            width: '88px',
            height: '88px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--clr-primary), var(--clr-secondary))',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px',
            fontWeight: 'bold',
            marginBottom: '18px',
            boxShadow: '0 0 20px rgba(1, 45, 29, 0.25), 0 0 0 4px rgba(255, 255, 255, 0.4)'
          }}>
            {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 700, color: 'var(--clr-on-surface)' }}>{user?.name || 'Trader Member'}</h3>
          <span style={{ 
            fontSize: '10px', 
            color: 'var(--clr-secondary)', 
            fontWeight: 700, 
            textTransform: 'uppercase', 
            letterSpacing: '0.08em',
            background: 'rgba(52, 211, 153, 0.1)',
            padding: '4px 10px',
            borderRadius: '9999px',
            marginTop: '4px'
          }}>
            Ensemble Access Active
          </span>
          
          <div style={{ 
            width: '100%', 
            borderTop: '1px solid rgba(1, 45, 29, 0.1)', 
            margin: '24px 0 20px 0', 
            paddingTop: '16px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '12px', 
            fontSize: '12px', 
            textAlign: 'left' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--clr-on-surface-variant)' }}>Full Name</span>
              <strong style={{ color: 'var(--clr-on-surface)' }}>{user?.name || 'N/A'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--clr-on-surface-variant)' }}>Email Address</span>
              <strong style={{ color: 'var(--clr-on-surface)' }}>{user?.email || 'N/A'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--clr-on-surface-variant)' }}>Member Since</span>
              <strong style={{ color: 'var(--clr-on-surface)' }}>{joinDate}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--clr-on-surface-variant)' }}>Auth Protocol</span>
              <strong style={{ color: 'var(--clr-secondary)', background: 'rgba(52, 211, 153, 0.08)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>JWT Secure</strong>
            </div>
          </div>

          <button 
            className="btn btn-danger" 
            onClick={onLogout} 
            style={{ 
              width: '100%', 
              justifyContent: 'center', 
              gap: '8px',
              boxShadow: '0 4px 12px rgba(186, 26, 26, 0.15)'
            }}
          >
            <span className="material-symbols-outlined">logout</span>
            Sign Out of Terminal
          </button>
        </div>

        {/* Security & Config Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Editable Stats Section */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0' }}>Configure Regional Terminal Stats</h3>
            <p className="subtitle" style={{ marginBottom: '16px' }}>Manage the regional storage limits and baseline cash reserves directly synced to your account database.</p>
            
            <form onSubmit={handleSaveStats} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="cash-reserves-input">Cash Reserves (₹ INR)</label>
                <input
                  id="cash-reserves-input"
                  type="number"
                  className="form-input"
                  value={cash}
                  onChange={(e) => setCash(e.target.value)}
                  placeholder="e.g. 2103280"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="storage-limit-input">Warehouse Storage Capacity Limit (Tons)</label>
                <input
                  id="storage-limit-input"
                  type="number"
                  className="form-input"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  placeholder="e.g. 400"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
                style={{ width: 'fit-content', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}
              >
                <span className="material-symbols-outlined">{saving ? 'sync' : 'save'}</span>
                {saving ? 'Saving Config...' : 'Update Regional Config'}
              </button>
            </form>
          </div>

          {/* Security Privileges */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0' }}>Security Privileges & Limits</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { title: "Dual ML Prediction Access", status: "ENABLED", desc: "Access to run real-time CatBoost + Logistic Regression inferences." },
                { title: "IoT Satellite Re-sync Channel", status: "ENABLED", desc: "Secured uplink to Sentinel-2 satellite recon nodes." },
                { title: "Storage Terminal Capacity Limit", status: `${limit} Tons Maximum`, desc: "Safety holding volume threshold defined for your regional warehouse." }
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
