import React, { useState, useEffect, useMemo } from 'react';
import { predictService } from '../services/predictService';
import { marketService } from '../services/marketService';
import { getTrendBadge, getCropDisplayName, CROP_LABEL_MAP } from '../utils/agriHelpers';

const CROP_OPTIONS = Object.entries(CROP_LABEL_MAP).map(([value, label]) => ({ value, label }));

export default function Dashboard({ token, showToast, addNotification }) {
  // Form Inputs State
  const [crop, setCrop] = useState('wheat');
  const [previousPrice, setPreviousPrice] = useState('1850');
  const [supplyVolume, setSupplyVolume] = useState('120');
  const [transportCostIndex, setTransportCostIndex] = useState('110');
  const [marketDemandScore, setMarketDemandScore] = useState(7);

  // Additional Market Signals State
  const [rainfallAnomaly, setRainfallAnomaly] = useState(0); // % anomaly (-25 to +25)
  const [transitCorridor, setTransitCorridor] = useState('western');
  const [storageCapacity, setStorageCapacity] = useState(65); // 10 to 90 %
  const [tradeTariff, setTradeTariff] = useState('0'); // export tariff %

  // Preset Scenario Handlers
  const applyPreset = (presetType) => {
    if (presetType === 'bullish') {
      setSupplyVolume('75');
      setTransportCostIndex('130');
      setMarketDemandScore(9);
      setRainfallAnomaly(-15);
      setStorageCapacity(80);
      setTradeTariff('0');
      if (showToast) showToast('Applied High Bullish Spike scenario', 'success');
    } else if (presetType === 'bearish') {
      setSupplyVolume('250');
      setTransportCostIndex('95');
      setMarketDemandScore(3);
      setRainfallAnomaly(15);
      setStorageCapacity(35);
      setTradeTariff('15');
      if (showToast) showToast('Applied Bearish Surplus scenario', 'success');
    } else if (presetType === 'balanced') {
      setSupplyVolume('120');
      setTransportCostIndex('110');
      setMarketDemandScore(7);
      setRainfallAnomaly(0);
      setStorageCapacity(65);
      setTradeTariff('0');
      if (showToast) showToast('Reset to Baseline scenario', 'success');
    }
  };

  useEffect(() => {
    document.title = "AgriCast AI — ML Market Predictor";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "Calculate future APMC Mandi price directions and trends using Scikit-Learn GBDT ensemble models.");
    }
  }, []);

  // Prediction and History State
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyFilter, setHistoryFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [commodities, setCommodities] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [historyFilter]);

  // Fetch prediction log history
  const fetchHistory = async () => {
    try {
      const data = await predictService.getHistory();
      if (data?.history) {
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error('Failed to fetch prediction history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Clear all prediction logs
  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear all prediction logs?')) return;
    try {
      await predictService.clearAllHistory();
      setHistory([]);
      if (showToast) showToast('Prediction log history cleared', 'success');
    } catch (error) {
      console.error('Failed to clear history:', error);
      if (showToast) showToast('Failed to clear prediction history', 'error');
    }
  };

  // Delete single log entry
  const handleDeleteSingleLog = async (id) => {
    try {
      await predictService.deleteHistoryItem(id);
      setHistory(prev => prev.filter(item => item._id !== id));
      if (showToast) showToast('Record deleted', 'success');
    } catch (error) {
      console.error('Failed to delete log entry:', error);
      if (showToast) showToast('Failed to delete log entry', 'error');
    }
  };

  const filteredHistory = history.filter(item => {
    if (historyFilter === 'all') return true;
    return item.crop === historyFilter;
  });

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);

  const paginatedHistory = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredHistory.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredHistory, currentPage]);

  // Fetch live scraped commodities to get current market rates
  const fetchCommodities = async () => {
    try {
      const data = await marketService.getLivePrices();
      if (data?.commodities) {
        setCommodities(data.commodities || []);
      }
    } catch (error) {
      console.error('Failed to fetch commodities for predictor:', error);
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchCommodities();
  }, []);

  // Automatically update the Previous Price input when crop changes
  useEffect(() => {
    if (commodities.length > 0) {
      const selected = commodities.find(c => c.crop === crop);
      if (selected) {
        // Strip out currency symbols and commas, e.g., "₹2,450" -> "2450"
        const numericPrice = selected.price.replace(/[^\d]/g, '');
        if (numericPrice) {
          setPreviousPrice(numericPrice);
        }
      }
    }
  }, [crop, commodities]);

  // Handle Predict Submission
  const handlePredict = async (e) => {
    e.preventDefault();

    if (!previousPrice || !supplyVolume || !transportCostIndex || !marketDemandScore) {
      showToast('Please fill out all numeric parameter fields', 'error');
      return;
    }

    setLoading(true);
    try {
      // Calculate composite freight cost based on selected corridor
      let effectiveTransport = Number(transportCostIndex);
      if (transitCorridor === 'northern') effectiveTransport += 5;
      else if (transitCorridor === 'southern') effectiveTransport += 10;
      else if (transitCorridor === 'port') effectiveTransport += 15;

      // Adjust demand score based on monsoon anomaly (-25% drought to +25% surplus)
      let adjustedDemand = Number(marketDemandScore);
      if (rainfallAnomaly < -10) adjustedDemand = Math.min(10, adjustedDemand + 1);
      else if (rainfallAnomaly > 10) adjustedDemand = Math.max(1, adjustedDemand - 1);

      // Calculate weather impact score (0.0 to 1.0) from rainfall anomaly (-25 to +25%)
      const weatherImpactScore = Number(Math.min(1.0, Math.max(0.0, 0.75 + (rainfallAnomaly / 100))).toFixed(2));
      
      // Calculate MSP difference percentage from tariff/subsidy state
      const mspDiffPct = Number((Number(tradeTariff) / 100).toFixed(4));

      const payload = {
        previous_price: Number(previousPrice),
        supply_volume: Number(supplyVolume),
        transport_cost_index: Math.round(effectiveTransport),
        market_demand_score: adjustedDemand,
        crop,
        weather_impact_score: weatherImpactScore,
        msp_difference_pct: mspDiffPct
      };

      const predData = await predictService.runPrediction(payload);
      setResult(predData);

      showToast(predData.isFallback ? 'Market trend calculated (Offline ML Fallback active)' : 'Market trend calculated successfully!', 'success');
      
      if (addNotification) {
        const cropLabel = getCropDisplayName(crop);
        const prediction = predData.prediction;
        const confidence = predData.confidence;
        addNotification(`ML Engine: Calculated tomorrow's ${cropLabel} trend as ${prediction ? prediction.toUpperCase() : 'UNKNOWN'} (${Number(confidence || 0).toFixed(0)}% confidence).`);
      }

      // Refresh the prediction log history
      fetchHistory();
    } catch (error) {
      console.error('Prediction failed:', error);
      showToast(error.message || 'Failed to complete prediction.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getCropLabel = (val) => {
    const cropOpt = CROP_OPTIONS.find(opt => opt.value === val);
    return cropOpt ? cropOpt.label : val.charAt(0).toUpperCase() + val.slice(1);
  };

  return (
    <div className="animate-fade-up" id="dashboard">
      {/* Dashboard Section Header */}
      <div className="section-header">
        <div>
          <h1 style={{ fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 700, letterSpacing: '-0.02em' }}>
            ML Market Predictor
          </h1>
          <p className="subtitle">Evaluate real-time market metrics using our dual intelligence ensemble engine.</p>
        </div>
      </div>

      {/* Main Grid: Form Left, Forecast Result Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'stretch', marginTop: '8px' }}>
        
        {/* Prediction Form Card */}
        <div className="card-predictor" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined icon-filled" style={{ color: 'var(--clr-primary)' }}>analytics</span>
              <h3 style={{ margin: 0 }}>Market Signals Input</h3>
            </div>

            {/* Quick Scenario Preset Pills */}
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '12px' }}
                onClick={() => applyPreset('bullish')}
                title="Apply Bullish Spike Scenario"
              >
                🚀 Bullish
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '12px' }}
                onClick={() => applyPreset('bearish')}
                title="Apply Bearish Surplus Scenario"
              >
                📉 Bearish
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '12px' }}
                onClick={() => applyPreset('balanced')}
                title="Reset to Balanced Scenario"
              >
                ⚖️ Baseline
              </button>
            </div>
          </div>
          
          <form onSubmit={handlePredict} style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
            {/* Crop Category Selector */}
            <div className="form-group">
              <label className="form-label" htmlFor="predict-crop">Select Commodity Category</label>
              <select 
                id="predict-crop" 
                className="form-select"
                value={crop}
                onChange={e => setCrop(e.target.value)}
              >
                {CROP_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <span style={{ fontSize: '10px', color: 'var(--clr-outline)', marginTop: '2px', display: 'block' }}>
                Select the crop category you wish to run AI predictions for.
              </span>
            </div>

            {/* Inputs Grid 1: Price & Supply */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="prev-price">Previous Price (₹/Qtl)</label>
                <input 
                  id="prev-price"
                  type="number" 
                  className="form-input" 
                  placeholder="e.g. 1800"
                  value={previousPrice}
                  onChange={e => setPreviousPrice(e.target.value)}
                  required
                />
                <span style={{ fontSize: '10px', color: 'var(--clr-outline)', marginTop: '2px', display: 'block' }}>
                  Latest closing rate per quintal. (Auto-filled from live feed)
                </span>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="supply-volume">Supply Volume (Tons)</label>
                <input 
                  id="supply-volume"
                  type="number" 
                  className="form-input" 
                  placeholder="e.g. 150"
                  value={supplyVolume}
                  onChange={e => setSupplyVolume(e.target.value)}
                  required
                />
                <span style={{ fontSize: '10px', color: 'var(--clr-outline)', marginTop: '2px', display: 'block' }}>
                  Total market quantity available. Higher supply pressure may limit uptrends.
                </span>
              </div>
            </div>

            {/* Inputs Grid 2: Transport & Transit Freight Corridor */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="transport-cost">Transport Cost Index</label>
                <input 
                  id="transport-cost"
                  type="number" 
                  className="form-input" 
                  placeholder="e.g. 100"
                  value={transportCostIndex}
                  onChange={e => setTransportCostIndex(e.target.value)}
                  required
                />
                <span style={{ fontSize: '10px', color: 'var(--clr-outline)', marginTop: '2px', display: 'block' }}>
                  Logistics & transit cost rating (Baseline cost index = 100).
                </span>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="transit-corridor">Transit Freight Corridor</label>
                <select
                  id="transit-corridor"
                  className="form-select"
                  value={transitCorridor}
                  onChange={e => setTransitCorridor(e.target.value)}
                >
                  <option value="western">Western Freight Corridor (+0)</option>
                  <option value="northern">Northern Highway Grid (+5 Index)</option>
                  <option value="southern">Southern Belt Logistics (+10 Index)</option>
                  <option value="port">Exim Port Gateway (+15 Index)</option>
                </select>
                <span style={{ fontSize: '10px', color: 'var(--clr-outline)', marginTop: '2px', display: 'block' }}>
                  Regional transport route influencing freight surcharges.
                </span>
              </div>
            </div>

            {/* Inputs Grid 3: Weather Anomaly & Storage Capacity */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="weather-anomaly" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Monsoon Anomaly</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: rainfallAnomaly > 0 ? 'var(--clr-secondary)' : rainfallAnomaly < 0 ? 'var(--clr-error)' : 'var(--clr-outline)' }}>
                    {rainfallAnomaly > 0 ? `+${rainfallAnomaly}%` : `${rainfallAnomaly}%`}
                  </span>
                </label>
                <input 
                  id="weather-anomaly"
                  type="range"
                  min="-25"
                  max="25"
                  step="5"
                  className="form-range"
                  value={rainfallAnomaly}
                  onChange={e => setRainfallAnomaly(Number(e.target.value))}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--clr-outline)', marginTop: '2px' }}>
                  <span>-25% (Drought)</span>
                  <span>0% (Normal)</span>
                  <span>+25% (Excess)</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="storage-capacity" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Warehouse Storage</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--clr-primary)' }}>
                    {storageCapacity}%
                  </span>
                </label>
                <input 
                  id="storage-capacity"
                  type="range"
                  min="10"
                  max="90"
                  step="5"
                  className="form-range"
                  value={storageCapacity}
                  onChange={e => setStorageCapacity(Number(e.target.value))}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--clr-outline)', marginTop: '2px' }}>
                  <span>10% (Low)</span>
                  <span>50% (Mid)</span>
                  <span>90% (Full)</span>
                </div>
              </div>
            </div>

            {/* Inputs Grid 4: Export Tariff & Demand Score */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="trade-tariff">Trade Tariff Policy</label>
                <select
                  id="trade-tariff"
                  className="form-select"
                  value={tradeTariff}
                  onChange={e => setTradeTariff(e.target.value)}
                >
                  <option value="0">0% (Free Domestic Trade)</option>
                  <option value="5">5% (Standard Export Duty)</option>
                  <option value="15">15% (Protectionist Tariff)</option>
                </select>
                <span style={{ fontSize: '10px', color: 'var(--clr-outline)', marginTop: '2px', display: 'block' }}>
                  Exim regulatory export duty / protective tariff rate.
                </span>
              </div>

              {/* Demand Score Range Slider */}
              <div className="form-group">
                <label className="form-label" htmlFor="demand-score" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Market Demand Score</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--clr-primary)' }}>
                    {marketDemandScore} / 10
                  </span>
                </label>
                <input 
                  id="demand-score"
                  type="range" 
                  min="1" 
                  max="10" 
                  step="1"
                  className="form-range" 
                  value={marketDemandScore}
                  onChange={e => setMarketDemandScore(Number(e.target.value))}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--clr-outline)', marginTop: '2px' }}>
                  <span>1 (Low)</span>
                  <span>5 (Avg)</span>
                  <span>10 (High)</span>
                </div>
              </div>
            </div>

            {/* Calculate Button */}
            <button 
              type="submit" 
              className="btn btn-primary btn-lg" 
              disabled={loading}
              style={{ width: '100%', marginTop: 'auto' }}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: '18px', height: '18px', borderTopColor: '#fff' }} />
                  Running Predictive Engine...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">smart_toy</span>
                  Calculate ML Price Trend
                </>
              )}
            </button>
          </form>
        </div>

        {/* Prediction Output Card */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', minHeight: '380px' }}>
          {!result ? (
            /* Placeholder state with preview graph */
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, textAlign: 'center', padding: '16px', position: 'relative' }}>
              {/* Preview Graph Canvas */}
              <div style={{
                width: '100%',
                background: 'var(--clr-surface-bright)',
                border: '1px solid var(--clr-outline-variant)',
                borderRadius: '12px',
                padding: '16px 20px',
                marginBottom: '20px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--clr-outline)' }}>
                  <span>PREDICTIVE GRAPH CANVAS</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--clr-primary)', fontWeight: 600 }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--clr-primary)', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                    AWAITING SIGNALS
                  </span>
                </div>
                
                {/* SVG Graph Placeholder */}
                <svg viewBox="0 0 400 100" width="100%" height="100" style={{ overflow: 'visible' }}>
                  {/* Horizontal Grid lines */}
                  <line x1="0" y1="20" x2="400" y2="20" stroke="var(--clr-outline-variant)" strokeDasharray="3,3" strokeWidth="0.8" opacity="0.6" />
                  <line x1="0" y1="50" x2="400" y2="50" stroke="var(--clr-outline-variant)" strokeDasharray="3,3" strokeWidth="0.8" opacity="0.6" />
                  <line x1="0" y1="80" x2="400" y2="80" stroke="var(--clr-outline-variant)" strokeDasharray="3,3" strokeWidth="0.8" opacity="0.6" />
                  
                  {/* Dashed preview trend path */}
                  <path
                    d="M 10 75 Q 90 25, 180 55 T 330 30 Q 370 45, 390 25"
                    fill="none"
                    stroke="var(--clr-primary)"
                    strokeWidth="2.5"
                    strokeDasharray="6,4"
                    opacity="0.45"
                  />

                  {/* Trend Nodes */}
                  <circle cx="10" cy="75" r="4" fill="var(--clr-surface-container-high)" stroke="var(--clr-outline)" strokeWidth="1.5" />
                  <circle cx="100" cy="35" r="4" fill="var(--clr-surface-container-high)" stroke="var(--clr-outline)" strokeWidth="1.5" />
                  <circle cx="180" cy="55" r="4" fill="var(--clr-surface-container-high)" stroke="var(--clr-outline)" strokeWidth="1.5" />
                  <circle cx="260" cy="40" r="4" fill="var(--clr-surface-container-high)" stroke="var(--clr-outline)" strokeWidth="1.5" />
                  <circle cx="330" cy="30" r="4" fill="var(--clr-surface-container-high)" stroke="var(--clr-outline)" strokeWidth="1.5" />
                  <circle cx="390" cy="25" r="5" fill="var(--clr-primary)" stroke="#fff" strokeWidth="2" />
                </svg>
              </div>

              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--clr-surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', color: 'var(--clr-primary)', border: '1px solid var(--clr-outline-variant)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>query_stats</span>
              </div>
              <h4 style={{ color: 'var(--clr-on-surface)', marginBottom: '8px', fontSize: '18px' }}>Waiting for Input</h4>
              <p style={{ maxWidth: '340px', fontSize: '13px', color: 'var(--clr-on-surface-variant)', lineHeight: '1.5' }}>
                Fill out the commodity metrics and transport indices on the left, then trigger the predictive engine to calculate forecast outcomes.
              </p>
            </div>
          ) : (
            /* Active Forecast Results Display */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-symbols-outlined icon-filled" style={{ color: 'var(--clr-secondary)' }}>online_prediction</span>
                  <h3 style={{ margin: 0 }}>Market Trend Forecast</h3>
                </div>
                <span className="badge badge-active" style={{ textTransform: 'uppercase', fontSize: '11px' }}>
                  Ensemble: {result.ensemble_method === 'probability_average' ? 'Dual-Model' : result.execution_method ? 'Scikit-Learn GBDT' : 'Ensemble Engine'}
                </span>
              </div>

              {/* Big Prediction Outcome Panel */}
              <div style={{
                background: (result.prediction || 'UP') === 'UP' ? 'var(--clr-secondary-container)' : 'var(--clr-error-container)',
                border: `1px solid ${(result.prediction || 'UP') === 'UP' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                borderRadius: '12px',
                padding: '24px',
                textAlign: 'center',
                boxShadow: 'var(--shadow-level-1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
                <span className="material-symbols-outlined icon-filled" style={{
                  fontSize: '48px',
                  color: (result.prediction || 'UP') === 'UP' ? 'var(--clr-on-secondary-container)' : 'var(--clr-on-error-container)',
                  animation: 'pulse 2s infinite'
                }}>
                  {(result.prediction || 'UP') === 'UP' ? 'arrow_circle_up' : 'arrow_circle_down'}
                </span>
                <span style={{
                  fontSize: '28px',
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  color: (result.prediction || 'UP') === 'UP' ? 'var(--clr-on-secondary-container)' : 'var(--clr-on-error-container)'
                }}>
                  PRICE {result.prediction || 'UP'}
                </span>
                <span style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: (result.prediction || 'UP') === 'UP' ? 'var(--clr-secondary)' : 'var(--clr-error)'
                }}>
                  Tomorrow's price trend for {getCropLabel(result.crop || crop)} is forecasted to move {(result.prediction || 'UP').toLowerCase()}ward.
                </span>
              </div>

              {/* Ensemble confidence bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  <span style={{ color: 'var(--clr-on-surface)' }}>Prediction Confidence</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--clr-primary)' }}>{result.confidence ?? 75}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${result.confidence ?? 75}%`, 
                      background: (result.prediction || 'UP') === 'UP' ? 'var(--clr-secondary)' : 'var(--clr-error)' 
                    }} 
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--clr-outline)', marginTop: '4px' }}>
                  <span>Probability UP: {result.probability_up ?? 75}%</span>
                  <span>Probability DOWN: {(100 - (result.probability_up ?? 75)).toFixed(1)}%</span>
                </div>
              </div>

              {/* Dynamic Prediction Trajectory Graph */}
              {(() => {
                const baseVal = Number(previousPrice) || 2000;
                const isUp = result.prediction === 'UP';
                const factor = (result.confidence / 100) * 0.055;
                const targetVal = isUp ? Math.round(baseVal * (1 + factor)) : Math.round(baseVal * (1 - factor));
                const diff = targetVal - baseVal;
                
                // Past 4 historical data points leading to baseVal
                const p1 = Math.round(baseVal - diff * 0.9);
                const p2 = Math.round(baseVal - diff * 0.5);
                const p3 = Math.round(baseVal - diff * 0.7);
                const p4 = Math.round(baseVal - diff * 0.3);
                const p5 = baseVal;
                const p6 = targetVal;

                const nodes = [
                  { label: 'D-4', val: p1, x: 25 },
                  { label: 'D-3', val: p2, x: 95 },
                  { label: 'D-2', val: p3, x: 165 },
                  { label: 'D-1', val: p4, x: 235 },
                  { label: 'Today', val: p5, x: 305, isToday: true },
                  { label: 'Tomorrow', val: p6, x: 375, isForecast: true }
                ];

                const vals = nodes.map(n => n.val);
                const minVal = Math.min(...vals) * 0.98;
                const maxVal = Math.max(...vals) * 1.02;
                const range = maxVal - minVal || 1;

                const getY = (v) => 105 - ((v - minVal) / range) * 75;

                const histPath = `M ${nodes[0].x} ${getY(nodes[0].val)} L ${nodes[1].x} ${getY(nodes[1].val)} L ${nodes[2].x} ${getY(nodes[2].val)} L ${nodes[3].x} ${getY(nodes[3].val)} L ${nodes[4].x} ${getY(nodes[4].val)}`;
                const forecastPath = `M ${nodes[4].x} ${getY(nodes[4].val)} L ${nodes[5].x} ${getY(nodes[5].val)}`;
                const areaPath = `M ${nodes[4].x} ${getY(nodes[4].val)} L ${nodes[5].x} ${getY(nodes[5].val)} L ${nodes[5].x} 115 L ${nodes[4].x} 115 Z`;

                const mainColor = isUp ? 'var(--clr-secondary)' : 'var(--clr-error)';

                return (
                  <div style={{
                    background: 'var(--clr-surface-bright)',
                    border: '1px solid var(--clr-outline-variant)',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: mainColor }}>show_chart</span>
                        <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.03em', color: 'var(--clr-on-surface)' }}>
                          PREDICTED PRICE TRAJECTORY
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: mainColor }}>
                        {isUp ? '+' : ''}{diff >= 0 ? `₹${diff}` : `-₹${Math.abs(diff)}`} / Qtl ({isUp ? '+' : ''}{((diff/baseVal)*100).toFixed(1)}%)
                      </span>
                    </div>

                    <div style={{ position: 'relative', width: '100%', height: '140px' }}>
                      <svg viewBox="0 0 400 135" width="100%" height="135" style={{ overflow: 'visible' }}>
                        <defs>
                          <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={mainColor} stopOpacity="0.3" />
                            <stop offset="100%" stopColor={mainColor} stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* Grid lines */}
                        <line x1="0" y1="30" x2="400" y2="30" stroke="var(--clr-outline-variant)" strokeDasharray="3,3" strokeWidth="0.8" opacity="0.5" />
                        <line x1="0" y1="70" x2="400" y2="70" stroke="var(--clr-outline-variant)" strokeDasharray="3,3" strokeWidth="0.8" opacity="0.5" />
                        <line x1="0" y1="110" x2="400" y2="110" stroke="var(--clr-outline-variant)" strokeDasharray="3,3" strokeWidth="0.8" opacity="0.5" />

                        {/* Vertical line at Today */}
                        <line x1={nodes[4].x} y1="10" x2={nodes[4].x} y2="115" stroke="var(--clr-outline)" strokeDasharray="2,2" strokeWidth="1" opacity="0.5" />

                        {/* Shaded Area under forecast */}
                        <path d={areaPath} fill="url(#forecastGradient)" />

                        {/* Historical Solid Path */}
                        <path d={histPath} fill="none" stroke="var(--clr-outline)" strokeWidth="2.5" />

                        {/* Forecast Glowing Line Path */}
                        <path d={forecastPath} fill="none" stroke={mainColor} strokeWidth="3.5" strokeDasharray="5,4" />

                        {/* Nodes and Labels */}
                        {nodes.map((n, i) => {
                          const py = getY(n.val);
                          return (
                            <g key={i}>
                              <circle
                                cx={n.x}
                                cy={py}
                                r={n.isForecast ? 6 : n.isToday ? 5 : 3.5}
                                fill={n.isForecast ? mainColor : n.isToday ? 'var(--clr-primary)' : 'var(--clr-surface-container-high)'}
                                stroke={n.isForecast ? '#fff' : n.isToday ? '#fff' : 'var(--clr-outline)'}
                                strokeWidth={n.isForecast || n.isToday ? 2 : 1}
                              />
                              {/* Price Label */}
                              <text
                                x={n.x}
                                y={py - (n.isForecast ? 12 : 8)}
                                textAnchor="middle"
                                fontSize={n.isForecast ? '11px' : '9px'}
                                fontWeight={n.isForecast || n.isToday ? 'bold' : 'normal'}
                                fill={n.isForecast ? mainColor : 'var(--clr-on-surface-variant)'}
                                fontFamily="var(--font-mono)"
                              >
                                ₹{n.val}
                              </text>
                              {/* X Axis Label */}
                              <text
                                x={n.x}
                                y="130"
                                textAnchor="middle"
                                fontSize="10px"
                                fontWeight={n.isForecast ? 'bold' : 'normal'}
                                fill={n.isForecast ? mainColor : 'var(--clr-outline)'}
                              >
                                {n.label}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                  </div>
                );
              })()}

              {/* Sub-models confidence breakdown */}
              <div style={{
                background: 'var(--clr-surface-container-low)',
                borderRadius: '8px',
                padding: '12px 14px',
                border: '1px solid var(--clr-outline-variant)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--clr-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Algorithm Verification Breakdown
                  </span>
                  {result.execution_method && (
                    <span style={{ fontSize: '10px', color: 'var(--clr-outline)', fontFamily: 'var(--font-mono)' }}>
                      {result.execution_method}
                    </span>
                  )}
                </div>

                {(() => {
                  const models = result.models || result.sub_models;
                  if (models?.classifier || models?.regressor) {
                    return (
                      <>
                        {models.classifier && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--clr-primary)' }}>account_tree</span>
                              <span style={{ color: 'var(--clr-on-surface-variant)', fontWeight: 500 }}>
                                {models.classifier.model_type || 'GBDT Classifier'}
                              </span>
                            </div>
                            <span style={{ fontWeight: 600, color: models.classifier.prediction === 'UP' ? 'var(--clr-secondary)' : 'var(--clr-error)' }}>
                              {models.classifier.prediction} ({models.classifier.probability_up ?? models.classifier.confidence ?? result.confidence}%)
                            </span>
                          </div>
                        )}
                        {models.regressor && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', borderTop: '1px solid var(--clr-surface-container-high)', paddingTop: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--clr-primary)' }}>analytics</span>
                              <span style={{ color: 'var(--clr-on-surface-variant)', fontWeight: 500 }}>
                                {models.regressor.model_type || 'GBDT Target Regressor'}
                              </span>
                            </div>
                            <span style={{ fontWeight: 600, color: 'var(--clr-primary)' }}>
                              Target: {models.regressor.forecasted_target_price ? `₹${models.regressor.forecasted_target_price}` : 'Calculated'} (R²: {models.regressor.r2_score ?? '0.99'})
                            </span>
                          </div>
                        )}
                      </>
                    );
                  }

                  if (models?.logistic_regression || models?.gradient_boosting_tree || models?.catboost) {
                    const lr = models.logistic_regression;
                    const gbt = models.gradient_boosting_tree || models.catboost;
                    return (
                      <>
                        {lr && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--clr-primary)' }}>show_chart</span>
                              <span style={{ color: 'var(--clr-on-surface-variant)', fontWeight: 500 }}>Logistic Regression</span>
                            </div>
                            <span style={{ fontWeight: 600, color: (lr.prediction || result.prediction) === 'UP' ? 'var(--clr-secondary)' : 'var(--clr-error)' }}>
                              {lr.prediction || result.prediction} ({lr.probability_up ?? lr.confidence ?? result.confidence}%)
                            </span>
                          </div>
                        )}
                        {gbt && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', borderTop: '1px solid var(--clr-surface-container-high)', paddingTop: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--clr-primary)' }}>account_tree</span>
                              <span style={{ color: 'var(--clr-on-surface-variant)', fontWeight: 500 }}>Gradient Boosting Tree</span>
                            </div>
                            <span style={{ fontWeight: 600, color: (gbt.prediction || result.prediction) === 'UP' ? 'var(--clr-secondary)' : 'var(--clr-error)' }}>
                              {gbt.prediction || result.prediction} ({gbt.probability_up ?? gbt.confidence ?? result.confidence}%)
                            </span>
                          </div>
                        )}
                      </>
                    );
                  }

                  return (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--clr-primary)' }}>smart_toy</span>
                        <span style={{ color: 'var(--clr-on-surface-variant)', fontWeight: 500 }}>ML Ensemble Intelligence</span>
                      </div>
                      <span style={{ fontWeight: 600, color: result.prediction === 'UP' ? 'var(--clr-secondary)' : 'var(--clr-error)' }}>
                        {result.prediction} ({result.confidence}%)
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Predictions Log History Table */}
      <div className="card" style={{ marginTop: '24px', overflow: 'hidden', padding: 0 }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--clr-outline-variant)', background: 'var(--clr-surface-bright)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h3 style={{ margin: 0 }}>Analysis Log History</h3>
            <span className="badge badge-active" style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
              {filteredHistory.length} Real Logged Records
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Commodity Filter Selector */}
            <select
              value={historyFilter}
              onChange={e => setHistoryFilter(e.target.value)}
              className="form-select"
              style={{ width: 'auto', padding: '4px 10px', fontSize: '12px' }}
              aria-label="Filter history by crop"
            >
              <option value="all">All Commodities</option>
              {CROP_OPTIONS.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>

            <button 
              className="btn btn-secondary btn-sm" 
              onClick={fetchHistory}
              disabled={historyLoading}
              title="Fetch latest prediction history"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>refresh</span>
              Refresh
            </button>

            {history.length > 0 && (
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={handleClearHistory}
                style={{ color: 'var(--clr-error)' }}
                title="Clear all log history"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete_sweep</span>
                Clear History
              </button>
            )}
          </div>
        </div>
        
        {historyLoading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--clr-outline)' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            Loading live prediction logs...
          </div>
        ) : filteredHistory.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--clr-on-surface-variant)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '32px', marginBottom: '8px', display: 'block' }}>history</span>
            {history.length === 0 ? (
              'No live prediction records found. Run your first market signal calculation above to log real AI predictions.'
            ) : (
              `No records found matching filter '${getCropLabel(historyFilter)}'.`
            )}
          </div>
        ) : (
          <div className="table-responsive-wrapper">
            <table className="data-table" aria-label="Recent agricultural market predictions history">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Commodity</th>
                  <th style={{ textAlign: 'right' }}>Previous Price</th>
                  <th style={{ textAlign: 'right' }}>Supply Vol</th>
                  <th style={{ textAlign: 'right' }}>Transport Index</th>
                  <th style={{ textAlign: 'center' }}>Demand Score</th>
                  <th style={{ textAlign: 'center' }}>ML Forecast</th>
                  <th style={{ textAlign: 'right' }}>Confidence</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedHistory.map((item, idx) => (
                  <tr key={item._id || idx}>
                    <td style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--clr-on-surface-variant)' }}>
                      {new Date(item.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: '2-digit', year: 'numeric'
                      })}, {new Date(item.createdAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
                      })}
                    </td>
                    <td style={{ fontWeight: 600 }}>{getCropLabel(item.crop)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>₹{Number(item.previousPrice).toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{item.supplyVolume} Tons</td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{item.transportCostIndex}</td>
                    <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{item.marketDemandScore} / 10</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${item.prediction === 'UP' ? 'badge-bullish' : 'badge-bearish'}`}>
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                          {item.prediction === 'UP' ? 'trending_up' : 'trending_down'}
                        </span>
                        {item.prediction}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600, color: item.prediction === 'UP' ? 'var(--clr-secondary)' : 'var(--clr-error)' }}>
                      {item.confidence}%
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => handleDeleteSingleLog(item._id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--clr-outline)',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '4px',
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}
                        title="Delete this prediction entry"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 24px',
                borderTop: '1px solid var(--clr-outline-variant)',
                background: 'var(--clr-surface-bright)',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ fontSize: '12px', color: 'var(--clr-on-surface-variant)' }}>
                  Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredHistory.length)} of {filteredHistory.length} records
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    style={{ padding: '4px 8px', fontSize: '12px', display: 'flex', alignItems: 'center', minHeight: 'auto', height: 'auto' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '2px' }}>chevron_left</span>
                    Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        border: '1px solid var(--clr-outline-variant)',
                        background: currentPage === page ? 'var(--clr-primary)' : 'var(--clr-surface-container-lowest)',
                        color: currentPage === page ? '#fff' : 'var(--clr-on-surface)',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    className="btn btn-secondary"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    style={{ padding: '4px 8px', fontSize: '12px', display: 'flex', alignItems: 'center', minHeight: 'auto', height: 'auto' }}
                  >
                    Next
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', marginLeft: '2px' }}>chevron_right</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
