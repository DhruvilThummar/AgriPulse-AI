import React, { useState, useEffect } from 'react';

export default function PwaInstallPrompt({ showToast }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPromptBanner, setShowPromptBanner] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      // Prevent browser default mini-infobar
      e.preventDefault();
      setDeferredPrompt(e);
      // Check if user previously dismissed in this session
      const dismissed = sessionStorage.getItem('agripulse_pwa_dismissed');
      if (!dismissed) {
        setShowPromptBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      if (showToast) showToast('AgriCast AI installed on your home screen!', 'success');
    }
    setDeferredPrompt(null);
    setShowPromptBanner(false);
  };

  const handleDismiss = () => {
    sessionStorage.setItem('agripulse_pwa_dismissed', 'true');
    setShowPromptBanner(false);
  };

  if (!showPromptBanner) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '84px',
        left: '16px',
        right: '16px',
        maxWidth: '460px',
        margin: '0 auto',
        zIndex: 99998,
        background: 'var(--clr-primary)',
        color: '#ffffff',
        padding: '14px 18px',
        borderRadius: '16px',
        boxShadow: '0 12px 36px rgba(1, 45, 29, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        animation: 'slideSheetUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span className="material-symbols-outlined icon-filled" style={{ fontSize: '28px', color: 'var(--clr-secondary-container)' }}>
          mobile_friendly
        </span>
        <div>
          <div style={{ fontWeight: 700, fontSize: '13px' }}>Install AgriCast AI App</div>
          <div style={{ fontSize: '11px', opacity: 0.9 }}>Add to Home Screen for fast offline Mandi access</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        <button
          type="button"
          onClick={handleInstallClick}
          style={{
            background: 'var(--clr-secondary-container)',
            color: 'var(--clr-on-secondary-container)',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 14px',
            fontWeight: 700,
            fontSize: '12px',
            cursor: 'pointer',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          Install
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          style={{
            background: 'transparent',
            color: '#ffffff',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            minHeight: '44px',
            minWidth: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          aria-label="Dismiss Install Prompt"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
        </button>
      </div>
    </div>
  );
}
