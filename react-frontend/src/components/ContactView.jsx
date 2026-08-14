import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from '../services/apiClient';

const INQUIRY_TOPICS = [
  { label: '🤖 Model Accuracy', value: 'Technical Query: Model Accuracy & Calibration' },
  { label: '🔑 API Access', value: 'Enterprise Query: Commodities API Access Key' },
  { label: '📈 Mandi Data Feed', value: 'Data Query: APMC Mandi Telemetry Feed' },
  { label: '🌾 Crop Partnership', value: 'Partnership: Mandi Trade Integration' },
  { label: '❓ General Help', value: 'General Inquiry: Platform Telemetry Support' }
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
    <div className="animate-fade-up" style={{ maxWidth: '1020px', margin: '0 auto', padding: '24px 16px 60px' }}>
      {/* Header Banner */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <span className="badge badge-active" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <span className="pulse-dot-green" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399' }} />
          Nodemailer Dispatch Gateway Active
        </span>
        <h1 style={{ fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '10px' }}>
          Contact AgriCast Technical Desk
        </h1>
        <p style={{ maxWidth: '640px', margin: '0 auto', fontSize: '14px', color: 'var(--clr-on-surface-variant)', lineHeight: '1.6' }}>
          Have questions regarding our Scikit-Learn predictive ensemble engine, APMC Mandi feeds, or enterprise API access? Send us a message below.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '24px', alignItems: 'stretch' }}>
        {/* Contact Information & Channels Card */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', borderTop: '4px solid var(--clr-secondary)' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Get in Touch</h3>
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
                padding: '10px 12px',
                background: 'var(--clr-surface-container-low)',
                borderRadius: '10px',
                border: '1px solid var(--clr-outline-variant)'
              }}
            >
              <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'var(--clr-primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                <span className="material-symbols-outlined">mail</span>
              </div>
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--clr-outline)', fontWeight: 700, letterSpacing: '0.04em' }}>Support Email Desk</div>
                <a href="mailto:support@agricast.ai" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--clr-primary)', textDecoration: 'none' }}>
                  support@agricast.ai
                </a>
              </div>
            </div>

            {/* BFF Gateway Server Tile */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                background: 'var(--clr-surface-container-low)',
                borderRadius: '10px',
                border: '1px solid var(--clr-outline-variant)'
              }}
            >
              <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'var(--clr-secondary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--clr-on-secondary-container)', flexShrink: 0 }}>
                <span className="material-symbols-outlined">hub</span>
              </div>
              <div>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--clr-outline)', fontWeight: 700, letterSpacing: '0.04em' }}>BFF Gateway Server</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--clr-on-surface)' }}>Node.js Express Balancer (Port 5000)</div>
              </div>
            </div>

            {/* Headquarters Tile */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                background: 'var(--clr-surface-container-low)',
                borderRadius: '10px',
                border: '1px solid var(--clr-outline-variant)'
              }}
            >
              <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'var(--clr-surface-container-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--clr-primary)', flexShrink: 0 }}>
                <span className="material-symbols-outlined">location_on</span>
              </div>
              <div>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--clr-outline)', fontWeight: 700, letterSpacing: '0.04em' }}>APMC Telemetry Headquarter</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--clr-on-surface)' }}>Ahmedabad, Gujarat &amp; New Delhi Grids</div>
              </div>
            </div>
          </div>

          {/* Embedded Google Map */}
          <div style={{ overflow: 'hidden', border: '1px solid var(--clr-outline-variant)', borderRadius: '12px', height: '160px', width: '100%' }}>
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
            Nodemailer Email Gateway: Active Dispatcher
          </div>
        </div>

        {/* Contact Form Card */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', borderTop: '4px solid var(--clr-primary)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>Send Us a Message</h3>

          {/* Quick Subject Select Pills */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--clr-on-surface-variant)', display: 'block', marginBottom: '6px' }}>
              Quick Inquiry Topic:
            </label>
            <div className="horizontal-scroll-chips">
              {INQUIRY_TOPICS.map((topic, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSubject(topic.value)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    border: subject === topic.value ? '1px solid var(--clr-primary)' : '1px solid var(--clr-outline-variant)',
                    background: subject === topic.value ? 'var(--clr-primary)' : 'var(--clr-surface-container-lowest)',
                    color: subject === topic.value ? '#fff' : 'var(--clr-on-surface-variant)',
                    transition: 'all 0.15s ease'
                  }}
                >
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

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="contact-name">Your Full Name</label>
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

              <div className="form-group">
                <label className="form-label" htmlFor="contact-email">Email Address *</label>
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
              style={{ width: '100%', marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
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

