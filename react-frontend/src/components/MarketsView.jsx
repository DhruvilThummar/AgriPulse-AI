/**
 * Module Name: MarketsView
 * Purpose: Displays real-time commodity market prices fetched via API with crop filtering and live updates.
 * Redesigned to fetch data from /api/commodity-prices instead of hardcoded values.
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from '../services/apiClient';

// All available crop categories for filtering
const CROP_CATEGORIES = ['All', 'Wheat', 'Rice', 'Corn', 'Cotton', 'Soybean', 'Sugarcane', 'Mustard', 'Groundnut', 'Turmeric', 'Chilli'];

export default function MarketsView({ token, autoSync }) {
  const [search, setSearch] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('All');
  const [commodities, setCommodities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [updatedFlash, setUpdatedFlash] = useState({});

  useEffect(() => {
    document.title = "AgriCast AI — Mandi Board Feed";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "Monitor live spot prices across Indian APMC Mandi exchanges and financial commodity benchmarks.");
    }
  }, []);

  // Fetch commodity data on mount and auto-refresh every 8 seconds
  useEffect(() => {
    fetchCommodityPrices();
    let interval;
    if (autoSync) {
      interval = setInterval(fetchCommodityPrices, 8000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoSync]);

  // Track previous prices to determine changes for flash animation
  const fetchCommodityPrices = async () => {
    try {
      const savedToken = token || localStorage.getItem('agripulse_token');
      const { data } = await axios.get(`${BASE_URL}/commodity-prices`, {
        headers: { Authorization: `Bearer ${savedToken}` }
      });
      const newComms = data.commodities || [];
      
      if (commodities.length > 0) {
        const flashes = {};
        newComms.forEach(nc => {
          const old = commodities.find(o => o.crop === nc.crop);
          if (old && old.price !== nc.price) {
            flashes[nc.crop] = true;
          }
        });
        if (Object.keys(flashes).length > 0) {
          setUpdatedFlash(flashes);
          setTimeout(() => setUpdatedFlash({}), 1500); // clear after 1.5 seconds
        }
      }

      setCommodities(newComms);
      setLastUpdated(new Date());
      setError('');
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch commodity prices:', err);
      // Keep existing data if refresh fails, only show error on first load
      if (commodities.length === 0) {
        setError('Unable to load market data. Please check your connection.');
        setLoading(false);
      }
    }
  };

  const [sortBy, setSortBy] = useState('default');
  const [exchangeFilter, setExchangeFilter] = useState('All');

  // Filter & Sort
  const filtered = commodities.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchesCrop = selectedCrop === 'All' || c.crop === selectedCrop.toLowerCase();
    const matchesExchange = exchangeFilter === 'All' || (c.exchange && c.exchange.includes(exchangeFilter));
    return matchesSearch && matchesCrop && matchesExchange;
  }).sort((a, b) => {
    if (sortBy === 'price-desc') return Number(b.priceNumeric || 0) - Number(a.priceNumeric || 0);
    if (sortBy === 'price-asc') return Number(a.priceNumeric || 0) - Number(b.priceNumeric || 0);
    if (sortBy === 'gainers') return (b.bullish ? 1 : -1) - (a.bullish ? 1 : -1);
    return 0;
  });

  // Calculate market stats
  const bullishCount = commodities.filter(c => c.bullish === true).length;
  const bearishCount = commodities.filter(c => c.bullish === false).length;

  return (
    <div className="animate-fade-up" id="markets">

      {/* Page Header */}
      <div className="section-header">
        <div>
          <h1 style={{ fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 700, margin: 0 }}>Commodity Markets</h1>
          <p className="subtitle">
            Real-time pricing index & exchange telemetry across active Mandi trading floors.
            {lastUpdated && (
              <span style={{ marginLeft: '8px', fontSize: '11px', color: 'var(--clr-outline)', fontFamily: 'var(--font-mono)' }}>
                ● Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>

        {/* Search & Sort Controls */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '220px' }}>
            <span className="material-symbols-outlined" style={{
              position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
              color: 'var(--clr-on-surface-variant)', fontSize: '18px', pointerEvents: 'none',
            }}>search</span>
            <input
              type="text"
              placeholder="Search commodity..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 12px 6px 34px',
                border: '1px solid var(--clr-outline-variant)',
                borderRadius: '6px',
                background: 'var(--clr-surface-container-lowest)',
                color: 'var(--clr-on-surface)',
                fontSize: '13px',
                fontFamily: 'var(--font-sans)',
                outline: 'none',
              }}
              aria-label="Search commodities"
            />
          </div>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="form-select"
            style={{ width: 'auto', padding: '6px 10px', fontSize: '12px' }}
          >
            <option value="default">Sort: Default</option>
            <option value="price-desc">Sort: Highest Price</option>
            <option value="price-asc">Sort: Lowest Price</option>
            <option value="gainers">Sort: Top Bullish</option>
          </select>
        </div>
      </div>

      {/* Top Market Overview Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
        marginBottom: '16px'
      }}>
        <div className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderLeft: '4px solid var(--clr-secondary)' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--clr-secondary)', fontSize: '24px' }}>trending_up</span>
          <div>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--clr-outline)', fontWeight: 600 }}>Bullish Trend</div>
            <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{bullishCount} Commodities</div>
          </div>
        </div>

        <div className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderLeft: '4px solid var(--clr-error)' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--clr-error)', fontSize: '24px' }}>trending_down</span>
          <div>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--clr-outline)', fontWeight: 600 }}>Bearish Trend</div>
            <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{bearishCount} Commodities</div>
          </div>
        </div>

        <div className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderLeft: '4px solid var(--clr-primary)' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--clr-primary)', fontSize: '24px' }}>storefront</span>
          <div>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--clr-outline)', fontWeight: 600 }}>Active Mandi Exchanges</div>
            <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>14 APMC Trading Hubs</div>
          </div>
        </div>
      </div>

      {/* Crop Filter Pills */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '8px',
        marginBottom: '20px', marginTop: '4px',
      }}>
        {CROP_CATEGORIES.map(crop => (
          <button
            key={crop}
            onClick={() => setSelectedCrop(crop)}
            style={{
              padding: '6px 14px',
              border: selectedCrop === crop ? '1px solid var(--clr-primary)' : '1px solid var(--clr-outline-variant)',
              borderRadius: '20px',
              background: selectedCrop === crop ? 'var(--clr-primary)' : 'var(--clr-surface-container-lowest)',
              color: selectedCrop === crop ? 'var(--clr-on-primary)' : 'var(--clr-on-surface-variant)',
              fontWeight: selectedCrop === crop ? 600 : 400,
              fontSize: '12px',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              transition: 'all 0.2s ease',
            }}
          >
            {crop}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="grid-3" style={{ marginTop: '8px' }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="card" style={{ padding: '20px', minHeight: '180px' }}>
              <div style={{
                background: 'linear-gradient(90deg, var(--clr-surface-container) 25%, var(--clr-surface-container-highest) 50%, var(--clr-surface-container) 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
                borderRadius: '4px', height: '16px', width: '60%', marginBottom: '12px'
              }} />
              <div style={{
                background: 'linear-gradient(90deg, var(--clr-surface-container) 25%, var(--clr-surface-container-highest) 50%, var(--clr-surface-container) 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
                borderRadius: '4px', height: '32px', width: '40%', marginBottom: '12px'
              }} />
            </div>
          ))}
        </div>
      ) : error ? (
        /* Error State */
        <div style={{
          textAlign: 'center', padding: '48px',
          color: 'var(--clr-on-error-container)',
          background: 'var(--clr-error-container)',
          borderRadius: '8px',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '36px', marginBottom: '8px', display: 'block' }}>cloud_off</span>
          {error}
          <br />
          <button className="btn btn-secondary" style={{ marginTop: '16px' }} onClick={fetchCommodityPrices}>
            Retry Connection
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--clr-on-surface-variant)' }}>
          No results for "{search}" {selectedCrop !== 'All' ? `in ${selectedCrop}` : ''}
        </div>
      ) : (
        /* Cards Grid */
        <div className="grid-3" style={{ marginTop: '8px' }}>
          {filtered.map((item, idx) => {
            const isFlashed = !!updatedFlash[item.crop];
            const isUp = item.bullish === true;

            // Generate intraday sparkline path
            const valNum = Number(item.priceNumeric || 2000);
            const sparkPoints = isUp
              ? [valNum * 0.96, valNum * 0.97, valNum * 0.965, valNum * 0.98, valNum * 0.99, valNum]
              : [valNum * 1.03, valNum * 1.02, valNum * 1.025, valNum * 1.01, valNum * 0.995, valNum];
            
            const minS = Math.min(...sparkPoints);
            const maxS = Math.max(...sparkPoints);
            const rangeS = maxS - minS || 1;

            const svgPoints = sparkPoints.map((v, i) => `${i * 20 + 5},${35 - ((v - minS) / rangeS) * 25}`).join(' ');

            return (
              <div
                key={idx}
                className={`card ${isFlashed ? 'price-flash' : ''}`}
                style={{
                  padding: '20px',
                  borderLeft: `4px solid ${
                    isUp ? 'var(--clr-secondary)' :
                    item.bullish === false ? 'var(--clr-error)' : 'var(--clr-outline)'
                  }`,
                  background: isFlashed 
                    ? 'rgba(16, 185, 129, 0.15)' 
                    : 'var(--clr-surface-container-lowest)',
                  transition: 'all 0.4s ease',
                  transform: isFlashed ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: isFlashed ? '0 0 12px rgba(16, 185, 129, 0.3)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between'
                }}
              >
                {/* Card top row */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--clr-primary)' }}>
                          {item.icon || 'eco'}
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--clr-on-surface)' }}>
                          {item.name}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--clr-on-surface-variant)', marginTop: '2px' }}>
                        Vol: {item.volume}
                      </div>
                    </div>

                    <span className={`badge ${isUp ? 'badge-bullish' : item.bullish === false ? 'badge-bearish' : 'badge-neutral'}`}>
                      <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>
                        {isUp ? 'trending_up' : item.bullish === false ? 'trending_down' : 'trending_flat'}
                      </span>
                      {item.change}
                    </span>
                  </div>

                  {/* Price & Sparkline */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0 12px' }}>
                    <div>
                      <span style={{
                        fontSize: '26px', fontWeight: 700,
                        color: isFlashed ? 'var(--clr-secondary)' : 'var(--clr-on-surface)',
                        fontFamily: 'var(--font-mono)',
                        letterSpacing: '-0.01em',
                        transition: 'color 0.4s ease'
                      }}>
                        {item.price}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--clr-on-surface-variant)', marginLeft: '4px' }}>
                        / {item.unit}
                      </span>
                    </div>

                    {/* Intraday Sparkline SVG */}
                    <div style={{ width: '110px', height: '40px' }}>
                      <svg viewBox="0 0 110 40" width="100%" height="100%" style={{ overflow: 'visible' }}>
                        <polyline
                          fill="none"
                          stroke={isUp ? 'var(--clr-secondary)' : 'var(--clr-error)'}
                          strokeWidth="2"
                          points={svgPoints}
                        />
                        <circle
                          cx="105"
                          cy={35 - ((valNum - minS) / rangeS) * 25}
                          r="3"
                          fill={isUp ? 'var(--clr-secondary)' : 'var(--clr-error)'}
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Daily range */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: '11px',
                    color: 'var(--clr-on-surface-variant)',
                    borderTop: '1px solid var(--clr-outline-variant)',
                    paddingTop: '10px',
                  }}>
                    <span>Daily Range</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--clr-on-surface)' }}>
                      {item.range}
                    </span>
                  </div>
                </div>

                {/* Source indicator & AI Action */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '8px', borderTop: '1px dashed var(--clr-outline-variant)' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '10px',
                    color: 'var(--clr-secondary)',
                    fontWeight: 600
                  }}>
                    <span style={{ 
                      width: '6px', 
                      height: '6px', 
                      borderRadius: '50%', 
                      background: 'var(--clr-secondary)', 
                      animation: 'pulse 1.5s infinite' 
                    }} />
                    APMC Live Feed
                  </div>

                  <a
                    href="#dashboard"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '10px', padding: '3px 8px', textDecoration: 'none' }}
                  >
                    🤖 Predict
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
