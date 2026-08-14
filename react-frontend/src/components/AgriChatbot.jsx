import React, { useState, useRef, useEffect } from 'react';
import { aiAssistantService } from '../services/aiAssistantService';

const PRESET_PROMPT_CHIPS = [
  { label: '🌾 Basmati Price Trend', query: 'What is tomorrow baseline prediction for Basmati Rice?' },
  { label: '🐛 Crop Pest Control', query: 'My wheat crop has yellow leaves with small spots. How to treat?' },
  { label: '🌱 Fertilizer Dosage', query: 'What is the recommended Urea vs DAP ratio per acre for sugarcane?' },
  { label: '🌤️ Monsoon Advisory', query: 'How does high humidity affect grain storage in godowns?' }
];

export default function AgriChatbot({ showToast }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: `👋 Namaste! I am **AgriCast AI Assistant**.\nAsk me anything about Mandi price predictions, crop diseases, fertilizer calculations, or weather advisory!`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (queryText) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || loading) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInputQuery('');
    setLoading(true);

    try {
      const reply = await aiAssistantService.askQuestion(textToSend);
      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: '⚠️ Network advisory: Telemetry signal interrupted. Please try asking again.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    if (showToast) showToast('Advice copied to clipboard!', 'success');
  };

  const handleClear = () => {
    setMessages([
      {
        id: Date.now(),
        sender: 'bot',
        text: `Conversation cleared. How else can I assist your farm today?`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          type="button"
          className="agri-chatbot-fab"
          onClick={() => setIsOpen(true)}
          aria-label="Open AgriCast AI Assistant"
        >
          <span className="material-symbols-outlined icon-filled" style={{ fontSize: '20px' }}>smart_toy</span>
          <span>Agri AI Chat</span>
        </button>
      )}

      {/* Chat Window / Bottom Sheet */}
      {isOpen && (
        <div className="agri-chatbot-window">
          {/* Header */}
          <div style={{
            background: 'var(--clr-primary)',
            color: '#ffffff',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined icon-filled" style={{ color: 'var(--clr-secondary-container)' }}>psychology</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>AgriCast AI Assistant</div>
                <div style={{ fontSize: '10px', opacity: 0.85, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="status-dot live" style={{ width: '6px', height: '6px' }} /> Dual Ensemble Advice Engine
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                type="button"
                onClick={handleClear}
                style={{ background: 'none', border: 'none', color: '#ffffff', opacity: 0.8, cursor: 'pointer', padding: '6px' }}
                title="Clear Chat History"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete_sweep</span>
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '6px' }}
                aria-label="Close Chat Window"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div style={{
            flex: 1,
            padding: '16px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            background: 'var(--clr-background)'
          }}>
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  background: m.sender === 'user' ? 'var(--clr-primary)' : 'var(--clr-surface-container-lowest)',
                  color: m.sender === 'user' ? '#ffffff' : 'var(--clr-on-surface)',
                  border: m.sender === 'user' ? 'none' : '1px solid var(--clr-outline-variant)',
                  padding: '12px 14px',
                  borderRadius: m.sender === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                  boxShadow: 'var(--shadow-level-1)',
                  fontSize: '13px',
                  lineHeight: '1.5'
                }}
              >
                <div style={{ whiteSpace: 'pre-line' }}>{m.text}</div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  marginTop: '6px',
                  fontSize: '10px',
                  opacity: 0.7
                }}>
                  <span>{m.time}</span>
                  {m.sender === 'bot' && (
                    <button
                      type="button"
                      onClick={() => handleCopy(m.text)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0 }}
                      title="Copy advice"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>content_copy</span>
                    </button>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{
                alignSelf: 'flex-start',
                background: 'var(--clr-surface-container-lowest)',
                border: '1px solid var(--clr-outline-variant)',
                padding: '10px 14px',
                borderRadius: '16px 16px 16px 2px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: 'var(--clr-on-surface-variant)'
              }}>
                <div className="spinner" style={{ width: '14px', height: '14px' }} />
                <span>Evaluating agricultural parameters...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Preset Chips */}
          <div style={{
            padding: '8px 12px',
            background: 'var(--clr-surface-container-low)',
            borderTop: '1px solid var(--clr-outline-variant)',
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            whiteSpace: 'nowrap'
          }}>
            {PRESET_PROMPT_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleSend(chip.query)}
                style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '14px', flexShrink: 0 }}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            style={{
              padding: '10px 12px',
              background: 'var(--clr-surface-container-lowest)',
              borderTop: '1px solid var(--clr-outline-variant)',
              display: 'flex',
              gap: '8px',
              alignItems: 'center'
            }}
          >
            <input
              type="text"
              placeholder="Ask about crops, prices, pests..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              disabled={loading}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '24px',
                border: '1px solid var(--clr-outline-variant)',
                background: 'var(--clr-background)',
                fontSize: '13px',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || loading}
              style={{
                background: 'var(--clr-primary)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                opacity: (!inputQuery.trim() || loading) ? 0.5 : 1
              }}
              aria-label="Send query"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>send</span>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
