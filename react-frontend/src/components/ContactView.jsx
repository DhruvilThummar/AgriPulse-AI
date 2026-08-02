import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from '../services/apiClient';

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
    <div className="animate-fade-up" style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 20px 60px' }}>
      {/* Header Banner */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <span className="badge badge-active" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', display: 'inline-block' }}>
          Nodemailer Dispatch Active
        </span>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '12px' }}>
          Contact AgriCast Support &amp; Technical Desk
        </h1>
        <p style={{ maxWidth: '600px', margin: '0 auto', fontSize: '15px', color: 'var(--clr-on-surface-variant)', lineHeight: '1.6' }}>
          Have questions regarding our Scikit-Learn predictive engine, APMC Mandi feeds, or enterprise API access? Send us a message below.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', alignItems: 'stretch' }}>
        {/* Contact Information & Channels Card */}
        <div className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px', borderTop: '4px solid var(--clr-secondary)' }}>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>Get in Touch</h3>
            <p style={{ fontSize: '13px', color: 'var(--clr-on-surface-variant)', lineHeight: '1.6', margin: 0 }}>
              Our team operates across 18 APMC regional hubs to monitor Mandi volume fluctuations and satellite telemetry feeds.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--clr-surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--clr-primary)' }}>
                <span className="material-symbols-outlined">mail</span>
              </div>
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--clr-outline)', fontWeight: 600 }}>Support Email Desk</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--clr-on-surface)' }}>support@agricast.ai</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--clr-surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--clr-primary)' }}>
                <span className="material-symbols-outlined">hub</span>
              </div>
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--clr-outline)', fontWeight: 600 }}>BFF Gateway Server</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--clr-on-surface)' }}>Node.js Express (Port 5000)</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--clr-surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--clr-primary)' }}>
                <span className="material-symbols-outlined">location_on</span>
              </div>
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--clr-outline)', fontWeight: 600 }}>APMC Telemetry Headquarter</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--clr-on-surface)' }}>Gujarat &amp; New Delhi Exchange Grids</div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--clr-outline-variant)', fontSize: '11px', color: 'var(--clr-outline)', fontFamily: 'var(--font-mono)' }}>
            Nodemailer Gateway: Active Email Dispatcher
          </div>
        </div>

        {/* Contact Form Card */}
        <div className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', borderTop: '4px solid var(--clr-primary)' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>Send Us a Message</h3>

          {/* Success Confirmation Banner */}
          {successInfo && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--clr-secondary)' }}>
                <span className="material-symbols-outlined icon-filled" style={{ fontSize: '20px', color: 'var(--clr-secondary)' }}>check_circle</span>
                Inquiry Sent Successfully!
              </div>
              <div style={{ fontSize: '12px', color: 'var(--clr-on-surface-variant)', lineHeight: '1.5' }}>
                {successInfo.message}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
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
                  Send Message via Nodemailer
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
