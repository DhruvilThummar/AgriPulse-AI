import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const AGRI_JOKES = [
  {
    joke: "Why did the AI farmer win a national award?",
    punchline: "Because he was outstanding in his field! 🌾",
    category: "ML Farming",
    emoji: "🌾"
  },
  {
    joke: "What do you call an artificial intelligence crop algorithm?",
    punchline: "An Agri-rhythm! 🎶🌽",
    category: "Tech & Crops",
    emoji: "🌽"
  },
  {
    joke: "Why did the tractor start blushing in the field?",
    punchline: "Because it saw the salad dressing! 🚜🥗",
    category: "Mandi Humor",
    emoji: "🚜"
  },
  {
    joke: "Why don't secrets stay hidden in the wheat field?",
    punchline: "Because the corn has ears and the potatoes have eyes! 🌽🥔",
    category: "Farm Spy",
    emoji: "🥔"
  },
  {
    joke: "How do AgriPulse AI engineers count their cattle?",
    punchline: "With a high-precision cow-culator! 🐮🧮",
    category: "Agri Analytics",
    emoji: "🐮"
  },
  {
    joke: "Why did the scarecrow get promoted to Lead Data Scientist?",
    punchline: "Because he was exceptional at kernel density estimation! 🌽📊",
    category: "Data Science",
    emoji: "📊"
  },
  {
    joke: "Why did the tomato turn red when the ML model ran?",
    punchline: "Because it saw the crop inspector checking its quality grade! 🍅⚡",
    category: "Model Insight",
    emoji: "🍅"
  }
];

const SCANNING_LOCATIONS = [
  'GJ-APMC-Mandi-Central',
  'PB-Wheat-Export-Terminal',
  'MH-Cotton-Exchange-Hub',
  'RJ-Mustard-Processing-Zone',
  'KA-Spice-Trade-Corridor',
  'UP-Sugarcane-Mill-Network'
];

const CROP_PREDICTOR_PRESETS = {
  wheat: { name: 'Wheat (Grade A)', basePrice: 2450, trend: 'UP', conf: 89, color: '#10b981' },
  cotton: { name: 'Shankar-6 Cotton', basePrice: 7200, trend: 'UP', conf: 92, color: '#059669' },
  rice: { name: 'Basmati Rice', basePrice: 6850, trend: 'UP', conf: 86, color: '#3b82f6' },
  chilli: { name: 'Guntur Chilli', basePrice: 9400, trend: 'DOWN', conf: 78, color: '#ef4444' }
};

// Simple Web Audio API Synth Sound Generator for delight
const playSynthSound = (freq = 587.33, type = 'sine') => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch (e) {
    // Ignore audio restrictions
  }
};

export default function NotFound({ showToast }) {
  const navigate = useNavigate();
  const [jokeIndex, setJokeIndex] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [burstParticles, setBurstParticles] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Mini Interactive Predictor Game State
  const [miniCrop, setMiniCrop] = useState('wheat');
  const [miniPrice, setMiniPrice] = useState('2450');
  const [miniPredicting, setMiniPredicting] = useState(false);
  const [miniResult, setMiniResult] = useState(null);

  // Mandi Radar Scanner Loop State
  const [scanLocation, setScanLocation] = useState(SCANNING_LOCATIONS[0]);
  const [scanProgress, setScanProgress] = useState(0);

  useEffect(() => {
    document.title = "404 — Page Harvested Early | AgriCast AI";

    const scanInterval = setInterval(() => {
      setScanLocation(SCANNING_LOCATIONS[Math.floor(Math.random() * SCANNING_LOCATIONS.length)]);
      setScanProgress(prev => (prev >= 100 ? 0 : prev + 25));
    }, 1800);

    return () => clearInterval(scanInterval);
  }, []);

  const handleNextJoke = (e) => {
    if (soundEnabled) playSynthSound(659.25, 'sine');
    setAnimating(true);

    const rect = e.currentTarget.getBoundingClientRect();
    const newParticles = Array.from({ length: 10 }).map((_, i) => ({
      id: Date.now() + i,
      x: rect.left + rect.width / 2 + (Math.random() * 100 - 50),
      y: rect.top + (Math.random() * 20 - 10),
      emoji: ['🌾', '🚜', '🌽', '🤖', '✨', '⚡', '🎉', '🍅', '🚀', '💡'][i % 10]
    }));

    setBurstParticles(newParticles);
    setTimeout(() => setBurstParticles([]), 1000);

    setTimeout(() => {
      setJokeIndex((prev) => (prev + 1) % AGRI_JOKES.length);
      setAnimating(false);
    }, 180);
  };

  const handleRunMiniPrediction = () => {
    if (soundEnabled) playSynthSound(880, 'triangle');
    setMiniPredicting(true);
    setMiniResult(null);

    setTimeout(() => {
      const preset = CROP_PREDICTOR_PRESETS[miniCrop];
      const userP = Number(miniPrice) || preset.basePrice;
      const changePct = (Math.random() * 4 + 1).toFixed(2);
      const isUp = preset.trend === 'UP';
      const targetP = Math.round(isUp ? userP * (1 + changePct / 100) : userP * (1 - changePct / 100));

      setMiniResult({
        cropName: preset.name,
        currentPrice: userP,
        predictedPrice: targetP,
        changePct,
        trend: preset.trend,
        confidence: preset.conf + Math.floor(Math.random() * 5)
      });
      setMiniPredicting(false);
      if (showToast) showToast(`Mini AI Prediction computed for ${preset.name}!`, 'success');
    }, 700);
  };

  const currentJoke = AGRI_JOKES[jokeIndex];

  return (
    <div style={{
      minHeight: '88vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '36px 20px',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'var(--font-sans)',
      color: 'var(--clr-on-surface)'
    }}>
      {/* ── Keyframe Animations CSS ── */}
      <style>{`
        @keyframes floatSlow1 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-18px) rotate(6deg); }
        }
        @keyframes floatSlow2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-24px) rotate(-8deg); }
        }
        @keyframes tractorBounce {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-4px) rotate(2deg); }
          75% { transform: translateY(-2px) rotate(-1deg); }
        }
        @keyframes radarPulse {
          0% { transform: scale(0.9); opacity: 0.8; box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6); }
          70% { transform: scale(1.05); opacity: 1; box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
          100% { transform: scale(0.9); opacity: 0.8; box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        @keyframes particleBurst {
          0% { opacity: 1; transform: translateY(0px) scale(0.8); }
          100% { opacity: 0; transform: translateY(-70px) scale(1.5); }
        }
        @keyframes gearSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animated-btn {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .animated-btn:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 8px 24px rgba(1, 45, 29, 0.3);
        }
        .ad-chip {
          transition: all 0.2s ease;
        }
        .ad-chip:hover {
          transform: scale(1.04);
          background: rgba(255, 255, 255, 0.16) !important;
        }
      `}</style>

      {/* ── Background Floating Crop Elements ── */}
      <div style={{ position: 'absolute', top: '6%', left: '8%', fontSize: '34px', opacity: 0.25, animation: 'floatSlow1 6s infinite ease-in-out', pointerEvents: 'none' }}>🌾</div>
      <div style={{ position: 'absolute', top: '12%', right: '9%', fontSize: '40px', opacity: 0.25, animation: 'floatSlow2 7s infinite ease-in-out', pointerEvents: 'none' }}>🚜</div>
      <div style={{ position: 'absolute', bottom: '18%', left: '10%', fontSize: '38px', opacity: 0.2, animation: 'floatSlow2 8s infinite ease-in-out', pointerEvents: 'none' }}>🌽</div>
      <div style={{ position: 'absolute', bottom: '12%', right: '10%', fontSize: '36px', opacity: 0.2, animation: 'floatSlow1 6.5s infinite ease-in-out', pointerEvents: 'none' }}>🛰️</div>
      <div style={{ position: 'absolute', top: '42%', right: '4%', fontSize: '30px', opacity: 0.18, animation: 'floatSlow1 5.5s infinite ease-in-out', pointerEvents: 'none' }}>🤖</div>
      <div style={{ position: 'absolute', top: '48%', left: '3%', fontSize: '32px', opacity: 0.18, animation: 'floatSlow2 7.5s infinite ease-in-out', pointerEvents: 'none' }}>📊</div>

      {/* Background Ambient Color Orbs */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '18%',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '18%',
        width: '420px',
        height: '420px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245, 158, 11, 0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Floating Particle Emoji Burst Container */}
      {burstParticles.map(p => (
        <div key={p.id} style={{
          position: 'fixed',
          left: p.x,
          top: p.y,
          fontSize: '24px',
          pointerEvents: 'none',
          zIndex: 99999,
          animation: 'particleBurst 0.9s cubic-bezier(0.1, 0.8, 0.3, 1) forwards'
        }}>
          {p.emoji}
        </div>
      ))}

      {/* Main Content Container */}
      <div style={{
        maxWidth: '900px',
        width: '100%',
        position: 'relative',
        zIndex: 1,
        textAlign: 'center'
      }}>
        {/* Sound FX Toggle Pill */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
          <button
            onClick={() => setSoundEnabled(prev => !prev)}
            style={{
              padding: '4px 10px',
              borderRadius: '9999px',
              border: '1px solid var(--clr-outline-variant)',
              background: 'var(--clr-surface-container-lowest)',
              color: 'var(--clr-on-surface-variant)',
              fontSize: '10px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Toggle Sound Effects"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
              {soundEnabled ? 'volume_up' : 'volume_off'}
            </span>
            Sound {soundEnabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Animated Tractor Header Graphic */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 22px',
          borderRadius: '9999px',
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(245, 158, 11, 0.18) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          marginBottom: '20px',
          boxShadow: '0 6px 18px rgba(245, 158, 11, 0.2)'
        }}>
          <span style={{ fontSize: '26px', display: 'inline-block', animation: 'tractorBounce 2s infinite ease-in-out' }}>
            🚜
          </span>
          <span style={{
            fontSize: '18px',
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
            color: 'var(--clr-error)',
            letterSpacing: '0.06em'
          }}>
            ERROR 404: CROP ROUTE NOT FOUND
          </span>
          <span className="material-symbols-outlined" style={{ color: '#d97706', fontSize: '22px', animation: 'gearSpin 8s infinite linear' }}>
            settings
          </span>
        </div>

        {/* Big Main Title */}
        <h1 style={{
          fontSize: 'clamp(30px, 4.5vw, 46px)',
          fontWeight: 800,
          lineHeight: 1.15,
          margin: '0 0 14px 0',
          color: 'var(--clr-primary)',
          letterSpacing: '-0.02em'
        }}>
          Looks Like This Page Was Harvested Early! 🌾
        </h1>

        <p style={{
          fontSize: '15px',
          color: 'var(--clr-on-surface-variant)',
          maxWidth: '680px',
          margin: '0 auto 24px auto',
          lineHeight: 1.6
        }}>
          Our CatBoost ML decision trees scanned <strong>18 Mandi states</strong> and <strong>48+ commodity exchanges</strong>, but this URL yielded 0 Tons of data! Don't worry—even the smartest AI tractors occasionally wander off the field.
        </p>

        {/* ── Live AI Mandi Radar Scanner Bar ── */}
        <div style={{
          background: 'var(--clr-surface-container-low, #f3f4f5)',
          border: '1px solid var(--clr-outline-variant, #c1c8c2)',
          borderRadius: '14px',
          padding: '10px 16px',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          fontSize: '11px',
          fontFamily: 'var(--font-mono)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#10b981',
              animation: 'radarPulse 1.8s infinite ease-in-out',
              display: 'inline-block'
            }} />
            <span style={{ fontWeight: 700, color: 'var(--clr-primary)' }}>
              AI RADAR SCANNER:
            </span>
            <span style={{ color: 'var(--clr-on-surface)', fontWeight: 600 }}>
              Scanning <strong style={{ color: 'var(--clr-secondary)' }}>{scanLocation}</strong>...
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '110px', height: '6px', borderRadius: '9999px', background: 'var(--clr-surface-container-high, #e5e7eb)', overflow: 'hidden' }}>
              <div style={{ width: `${scanProgress}%`, height: '100%', background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)', transition: 'width 0.4s ease' }} />
            </div>
            <span style={{ color: 'var(--clr-error)', fontWeight: 700 }}>
              ✖ Target Route Lost
            </span>
          </div>
        </div>

        {/* ── Interactive Agricultural Joke Card ── */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(1, 45, 29, 0.15)',
          borderRadius: '20px',
          padding: '26px 30px',
          marginBottom: '28px',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.5) 0px 0px 0px 1px inset',
          textAlign: 'left',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Top Gradient Accent */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #10b981 0%, #f59e0b 50%, #ef4444 100%)'
          }} />

          <div style={{
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
            paddingBottom: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '24px' }}>{currentJoke.emoji}</span>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--clr-primary)', letterSpacing: '0.01em' }}>
                  🌾 Agri-AI Daily Humor Break
                </div>
                <div style={{ fontSize: '10px', color: 'var(--clr-outline)', fontWeight: 600 }}>
                  Category: {currentJoke.category}
                </div>
              </div>
            </div>

            <button
              onClick={handleNextJoke}
              className="animated-btn"
              style={{
                padding: '7px 15px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #012d1d 0%, #152b1c 100%)',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                lineHeight: 1,
                boxShadow: '0 4px 12px rgba(1, 45, 29, 0.25)'
              }}
              title="Click for another agricultural joke!"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '15px', lineHeight: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>auto_awesome</span>
              <span style={{ lineHeight: 1, display: 'inline-block' }}>Tell Me Another Joke!</span>
            </button>
          </div>

          <div style={{
            opacity: animating ? 0.2 : 1,
            transform: animating ? 'translateY(4px)' : 'translateY(0px)',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            padding: '4px 0'
          }}>
            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--clr-on-surface)', marginBottom: '10px', lineHeight: 1.4 }}>
              ❓ "{currentJoke.joke}"
            </div>
            <div style={{
              fontSize: '17px',
              fontWeight: 800,
              color: 'var(--clr-secondary)',
              fontStyle: 'italic',
              background: 'rgba(16, 185, 129, 0.08)',
              padding: '10px 14px',
              borderRadius: '10px',
              borderLeft: '4px solid var(--clr-secondary)',
              display: 'inline-block'
            }}>
              💡 {currentJoke.punchline}
            </div>
          </div>
        </div>

        {/* ── Interactive Mini ML Predictor Game Widget ── */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(16px)',
          border: '1px dashed rgba(16, 185, 129, 0.4)',
          borderRadius: '20px',
          padding: '22px 26px',
          marginBottom: '32px',
          textAlign: 'left',
          boxShadow: '0 8px 24px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '14px', color: 'var(--clr-primary)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--clr-primary)', fontSize: '20px' }}>
                sports_esports
              </span>
              <span>🎮 Try Instant 404 Mini AI Commodity Predictor</span>
            </div>
            <span style={{ fontSize: '10px', color: 'var(--clr-outline)', fontWeight: 600 }}>
              Test ML model without leaving this page!
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'end' }}>
            <div>
              <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--clr-outline)', display: 'block', marginBottom: '4px' }}>
                SELECT CROP
              </label>
              <select
                className="form-select"
                value={miniCrop}
                onChange={e => {
                  setMiniCrop(e.target.value);
                  setMiniPrice(String(CROP_PREDICTOR_PRESETS[e.target.value].basePrice));
                }}
                style={{ padding: '7px 10px', fontSize: '12px' }}
              >
                <option value="wheat">🌾 Wheat (Grade A)</option>
                <option value="cotton">🧵 Shankar-6 Cotton</option>
                <option value="rice">🍚 Basmati Rice</option>
                <option value="chilli">🌶️ Guntur Chilli Red</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--clr-outline)', display: 'block', marginBottom: '4px' }}>
                SPOT MANDI PRICE (₹/Qtl)
              </label>
              <input
                type="number"
                className="form-input"
                value={miniPrice}
                onChange={e => setMiniPrice(e.target.value)}
                placeholder="e.g. 2450"
                style={{ padding: '7px 10px', fontSize: '12px' }}
              />
            </div>

            <button
              onClick={handleRunMiniPrediction}
              disabled={miniPredicting}
              className="btn btn-primary btn-md animated-btn"
              style={{
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: 700,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              {miniPredicting ? (
                <><div className="spinner" style={{ width: '12px', height: '12px', borderTopColor: '#fff' }} /> Computing ML...</>
              ) : (
                <><span className="material-symbols-outlined" style={{ fontSize: '16px' }}>bolt</span>Run Mini Prediction</>
              )}
            </button>
          </div>

          {miniResult && (
            <div style={{
              marginTop: '14px',
              padding: '12px 14px',
              borderRadius: '12px',
              background: miniResult.trend === 'UP' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${miniResult.trend === 'UP' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)'
            }}>
              <div>
                <strong>{miniResult.cropName}:</strong> Predicted Tomorrow Price: <strong style={{ color: miniResult.trend === 'UP' ? '#059669' : '#dc2626' }}>₹{miniResult.predictedPrice}</strong> ({miniResult.trend === 'UP' ? `▲ +${miniResult.changePct}%` : `▼ -${miniResult.changePct}%`})
              </div>
              <span style={{ fontWeight: 700, color: miniResult.trend === 'UP' ? '#059669' : '#dc2626', background: 'rgba(255,255,255,0.8)', padding: '3px 8px', borderRadius: '6px' }}>
                {miniResult.confidence}% Confidence
              </span>
            </div>
          )}
        </div>

        {/* ── Feature Advertisement Spotlight Banner ── */}
        <div style={{
          background: 'linear-gradient(135deg, #012d1d 0%, #0d3827 50%, #152b1c 100%)',
          color: '#ffffff',
          borderRadius: '24px',
          padding: '30px 34px',
          marginBottom: '36px',
          boxShadow: '0 20px 48px rgba(1, 45, 29, 0.3)',
          position: 'relative',
          overflow: 'hidden',
          textAlign: 'left',
          border: '1px solid rgba(174, 238, 203, 0.2)'
        }}>
          {/* Animated Background Pulse Ring */}
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '240px',
            height: '240px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(174, 238, 203, 0.12) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          {/* Grid Accent Pattern */}
          <div style={{
            position: 'absolute',
            top: 0, right: 0, bottom: 0, left: 0,
            backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
            pointerEvents: 'none'
          }} />

          <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '24px', alignItems: 'center' }}>
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '9999px',
                background: 'rgba(174, 238, 203, 0.18)',
                color: '#aeeecb',
                fontSize: '10px',
                fontWeight: 800,
                letterSpacing: '0.06em',
                marginBottom: '12px'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>stars</span>
                AGRIPULSE AI PROMOTIONAL SPOTLIGHT
              </div>

              <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 10px 0', color: '#ffffff', lineHeight: 1.25 }}>
                Why Stay Lost? Start Predicting Prices with 94.7% ML Accuracy! 🚀
              </h2>

              <p style={{ fontSize: '13px', color: '#aeeecb', margin: 0, lineHeight: 1.55 }}>
                AgriPulse AI empowers farmers, Mandi traders, and agricultural enterprises with dual-ensemble ML price forecasting, live APMC Mandi feeds, and automated storage decay hedging.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { icon: 'target', label: '94.7% Accuracy Ensemble Models', badge: 'CatBoost + LR' },
                { icon: 'satellite_alt', label: 'Sentinel-2 Satellite Telemetry', badge: 'NDVI Index' },
                { icon: 'shield_with_heart', label: 'Automated Decay Risk Hedging', badge: 'APMC Ready' }
              ].map((feat, idx) => (
                <div
                  key={idx}
                  className="ad-chip"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  onClick={() => navigate('/predictions')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="material-symbols-outlined" style={{ color: '#aeeecb', fontSize: '18px' }}>
                      {feat.icon}
                    </span>
                    <span>{feat.label}</span>
                  </div>
                  <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: 'rgba(174, 238, 203, 0.2)', color: '#aeeecb' }}>
                    {feat.badge}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Action Navigation Triggers ── */}
        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/predictions')}
            className="btn btn-primary btn-md animated-btn"
            style={{
              padding: '13px 26px',
              fontSize: '13px',
              fontWeight: 700,
              borderRadius: '14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 6px 18px rgba(1, 45, 29, 0.3)',
              cursor: 'pointer'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>smart_toy</span>
            Run Full AI Price Prediction
          </button>

          <button
            onClick={() => navigate('/markets')}
            className="btn btn-secondary btn-md animated-btn"
            style={{
              padding: '13px 26px',
              fontSize: '13px',
              fontWeight: 700,
              borderRadius: '14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>candlestick_chart</span>
            Explore Live Mandi Markets
          </button>

          <button
            onClick={() => navigate('/')}
            className="animated-btn"
            style={{
              padding: '13px 26px',
              fontSize: '13px',
              fontWeight: 700,
              borderRadius: '14px',
              border: '1px solid var(--clr-outline-variant)',
              background: 'var(--clr-surface-container-lowest)',
              color: 'var(--clr-on-surface)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>home</span>
            Return Home
          </button>
        </div>
      </div>
    </div>
  );
}
