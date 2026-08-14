import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from '../services/apiClient';

const INQUIRY_TOPICS = [
  { label: '🤖 Model Accuracy', value: 'Technical Query: Model Accuracy & Calibration', icon: 'psychology' },
  { label: '🔑 API Access Key', value: 'Enterprise Query: Commodities API Access Key', icon: 'key' },
  { label: '📈 Mandi Data Feed', value: 'Data Query: APMC Mandi Telemetry Feed', icon: 'table_chart' },
  { label: '🌾 Trade Partnership', value: 'Partnership: Mandi Trade Integration', icon: 'handshake' },
  { label: '❓ General Support', value: 'General Inquiry: Platform Telemetry Support', icon: 'help' }
];

export default function ContactView({ showToast }) {
  useEffect(() => {
    document.title = "AgriCast AI — Contact Support";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "Get in touch with our engineering team and Mandi telemetry desk.");
    }
  }, []);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !message) {
      if (showToast) showToast('Please enter your email and message', 'error');
      return;
    }

    setSending(true);
    setSuccessInfo(null);

    try {
      const res = await axios.post(`${BASE_URL}/contact`, {
        name,
        email,
        subject,
        message
      });

      if (res.data?.success) {
        if (showToast) showToast(`📩 Message sent! Confirmation email dispatched to ${email}`, 'success');
        setSuccessInfo({
          email: email,
          message: res.data.message || `Your message was received! A confirmation email was sent to ${email}.`
        });
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
      } else {
        if (showToast) showToast(res.data?.error || 'Failed to submit contact inquiry', 'error');
      }
    } catch (err) {
      console.error('Contact inquiry error:', err);
      const errMsg = err.response?.data?.error || 'Failed to connect to Nodemailer gateway.';
      if (showToast) showToast(errMsg, 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="animate-fade-up" style={{ maxWidth: '1040px', margin: '0 auto', padding: '24px 16px 60px' }}>
      {/* Header Banner */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--clr-surface-container-low)', padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--clr-outline-variant)', marginBottom: '14px' }}>
          <span className="material-symbols-outlined icon-filled" style={{ fontSize: '18px', color: 'var(--clr-primary)' }}>headset_mic</span>
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--clr-primary)' }}>
            Nodemailer Gateway Active
          </span>
          <span className="pulse-dot-green" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399' }} />
        </div>

        <h1 style={{ fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '10px' }}>
          Contact AgriCast Engineering Desk
        </h1>
        <p style={{ maxWidth: '640px', margin: '0 auto', fontSize: '14px', color: 'var(--clr-on-surface-variant)', lineHeight: '1.6' }}>
          Have questions regarding our Scikit-Learn predictive ensemble engine, APMC Mandi price feeds, or enterprise API integration? Get in touch with our desk.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', alignItems: 'stretch' }}>
        {/* Contact Information & Channels Card */}
        <div className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px', borderTop: '4px solid var(--clr-secondary)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="material-symbols-outlined icon-filled" style={{ color: 'var(--clr-secondary)', fontSize: '22px' }}>contact_support</span>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Direct Support Channels</h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--clr-on-surface-variant)', lineHeight: '1.6', margin: 0 }}>
              Our telemetry team operates across 18 APMC regional hubs to monitor Mandi volume fluctuations and satellite feeds.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Email Tile */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                background: 'var(--clr-surface-container-low)',
                borderRadius: '12px',
                border: '1px solid var(--clr-outline-variant)',
                transition: 'border-color 0.2s, transform 0.2s'
              }}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--clr-primary) 0%, var(--clr-primary-container) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                <span className="material-symbols-outlined">alternate_email</span>
              </div>
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--clr-outline)', fontWeight: 700, letterSpacing: '0.04em' }}>Support Email Desk</div>
                <a href="mailto:support@agricast.ai" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--clr-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  support@agricast.ai
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>open_in_new</span>
                </a>
              </div>
            </div>

            {/* BFF Gateway Server Tile */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                background: 'var(--clr-surface-container-low)',
                borderRadius: '12px',
                border: '1px solid var(--clr-outline-variant)'
              }}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--clr-secondary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--clr-on-secondary-container)', flexShrink: 0 }}>
                <span className="material-symbols-outlined">dns</span>
              </div>
              <div>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--clr-outline)', fontWeight: 700, letterSpacing: '0.04em' }}>API Gateway Node</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--clr-on-surface)' }}>Express Gateway (Port 5000)</div>
              </div>
            </div>

            {/* Headquarters Tile */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                background: 'var(--clr-surface-container-low)',
                borderRadius: '12px',
                border: '1px solid var(--clr-outline-variant)'
              }}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--clr-surface-container-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--clr-primary)', flexShrink: 0 }}>
                <span className="material-symbols-outlined">pin_drop</span>
              </div>
              <div>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--clr-outline)', fontWeight: 700, letterSpacing: '0.04em' }}>APMC Telemetry Center</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--clr-on-surface)' }}>Ahmedabad, Gujarat Exchange Hub</div>
              </div>
            </div>
          </div>

          {/* Embedded Google Map */}
          <div style={{ overflow: 'hidden', border: '1px solid var(--clr-outline-variant)', borderRadius: '14px', height: '170px', width: '100%', position: 'relative' }}>
            <iframe
              title="AgriCast Office Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d235014.29918593855!2d72.41493121847908!3d23.020158085669532!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395e848aba5bd449%3A0x4fcedd11614f6516!2sAhmedabad%2C%20Gujarat!5e0!3m2!1sen!2sin!4v1785817002471!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--clr-outline-variant)', fontSize: '11px', color: 'var(--clr-outline)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="status-dot live" />
            Nodemailer Service: Active Email Dispatch
          </div>
        </div>

        {/* Contact Form Card */}
        <div className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', borderTop: '4px solid var(--clr-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span className="material-symbols-outlined icon-filled" style={{ color: 'var(--clr-primary)', fontSize: '22px' }}>mark_email_read</span>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Send Us a Message</h3>
          </div>

          {/* Quick Subject Select Pills */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--clr-on-surface-variant)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--clr-primary)' }}>auto_awesome</span>
              Quick Topic Selection:
            </label>
            <div className="horizontal-scroll-chips">
              {INQUIRY_TOPICS.map((topic, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSubject(topic.value)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    border: subject === topic.value ? '1px solid var(--clr-primary)' : '1px solid var(--clr-outline-variant)',
                    background: subject === topic.value ? 'var(--clr-primary)' : 'var(--clr-surface-container-lowest)',
                    color: subject === topic.value ? '#fff' : 'var(--clr-on-surface-variant)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '14px', color: subject === topic.value ? '#fff' : 'var(--clr-primary)' }}>
                    {topic.icon}
                  </span>
                  {topic.label}
                </button>
              ))}
            </div>
          </div>

          {/* Success Confirmation Banner */}
          {successInfo && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              padding: '14px',
              marginBottom: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--clr-secondary)' }}>
                <span className="material-symbols-outlined icon-filled" style={{ fontSize: '18px', color: 'var(--clr-secondary)' }}>check_circle</span>
                Inquiry Sent Successfully!
              </div>
              <div style={{ fontSize: '11px', color: 'var(--clr-on-surface-variant)', lineHeight: '1.5' }}>
                {successInfo.message}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="contact-name">Your Full Name</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="contact-name"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Dhruvil Thummar"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    disabled={sending}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="contact-email">Email Address *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="contact-email"
                    type="email"
                    className="form-input"
                    placeholder="e.g. dhruvil@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    disabled={sending}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="contact-subject">Inquiry Subject</label>
              <input
                id="contact-subject"
                type="text"
                className="form-input"
                placeholder="e.g. Model Accuracy Query / API Access"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                disabled={sending}
              />
            </div>

            <div className="form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="form-label" htmlFor="contact-message">Message Content *</label>
              <textarea
                id="contact-message"
                className="form-input"
                placeholder="Describe your request or technical inquiry..."
                rows="4"
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
                disabled={sending}
                style={{ resize: 'vertical', flex: 1, minHeight: '100px' }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={sending}
              style={{ width: '100%', marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 20px', borderRadius: '12px' }}
            >
              {sending ? (
                <>
                  <div className="spinner" style={{ width: '16px', height: '16px', borderTopColor: '#fff' }} />
                  Sending Message...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">send</span>
                  Send Message via Nodemailer Gateway
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}


