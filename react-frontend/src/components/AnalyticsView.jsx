/**
 * Module Name: AnalyticsView
 * Purpose: Deep-dive data visualizations for agricultural commodities with crop selector, dynamic chart generator, tooltip tracking, sortable tables, and interactive satellite telemetry.
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import axios from 'axios';

// Monthly price datasets (₹/Quintal) for the last 12 months to generate dynamic charts
const HISTORICAL_DATASETS = {
  wheat:     [2200, 2250, 2180, 2300, 2350, 2400, 2380, 2420, 2460, 2410, 2450, 2490],
  rice:      [6200, 6300, 6400, 6350, 6450, 6500, 6600, 6580, 6700, 6720, 6800, 6850],
  corn:      [1800, 1850, 1820, 1890, 1920, 1950, 1910, 1960, 1980, 1940, 1950, 1970],
  cotton:    [6800, 6900, 6750, 6850, 7000, 7100, 7050, 7150, 7200, 7100, 7250, 7300],
  soybean:   [4800, 4950, 4900, 5050, 5100, 5150, 5080, 5200, 5250, 5180, 5200, 5280],
  sugarcane: [310,  320,  315,  325,  330,  335,  332,  338,  340,  336,  342,  345],
  mustard:   [5200, 5300, 5250, 5380, 5420, 5500, 5450, 5520, 5600, 5550, 5620, 5680],
  groundnut: [5800, 5900, 5850, 5950, 6000, 6080, 6020, 6100, 6150, 6080, 6120, 6200],
  turmeric:  [6900, 7100, 7050, 7200, 7300, 7350, 7280, 7400, 7450, 7380, 7420, 7500],
  chilli:    [8600, 8800, 8750, 8950, 9100, 9200, 9120, 9250, 9300, 9220, 9350, 9400],
};

const CROP_METRICS = {
  wheat:     { supply: '1.15B', supplyTrend: '+2.1%', demand: '85.2', demandTrend: '-0.8%', export: '380M', color: '#eab308' },
  rice:      { supply: '1.24B', supplyTrend: '+3.2%', demand: '89.4', demandTrend: '-1.5%', export: '450M', color: '#60a5fa' },
  corn:      { supply: '15,000', supplyTrend: '-0.8%', demand: '94.2', demandTrend: '+2.1%', export: '220M', color: '#f59e0b' },
  cotton:    { supply: '120M', supplyTrend: '+6.1%', demand: '78.5', demandTrend: '+4.2%', export: '48M', color: '#ec4899' },
  soybean:   { supply: '360M', supplyTrend: '+2.8%', demand: '85.9', demandTrend: '+1.1%', export: '95M', color: '#10b981' },
  sugarcane: { supply: '1.89B', supplyTrend: '+1.5%', demand: '91.0', demandTrend: 'Stable', export: '180M', color: '#84cc16' },
  mustard:   { supply: '85M', supplyTrend: '+3.9%', demand: '73.4', demandTrend: '-1.2%', export: '12M', color: '#facc15' },
  groundnut: { supply: '68M', supplyTrend: '+1.2%', demand: '80.6', demandTrend: '+0.8%', export: '28M', color: '#d97706' },
  turmeric:  { supply: '14M', supplyTrend: '-2.4%', demand: '88.5', demandTrend: '+3.0%', export: '9.5M', color: '#ea580c' },
  chilli:    { supply: '22M', supplyTrend: '+5.7%', demand: '87.1', demandTrend: '+1.9%', export: '14M', color: '#dc2626' }
};

const CROP_OPTIONS = Object.keys(HISTORICAL_DATASETS);

const MONTHS = ['Aug 25', 'Sep 25', 'Oct 25', 'Nov 25', 'Dec 25', 'Jan 26', 'Feb 26', 'Mar 26', 'Apr 26', 'May 26', 'Jun 26', 'Jul 26'];

// Regional yield data with baseline yields
const INITIAL_YIELD_DATA = [
  { region: 'North America', commodity: 'Corn',      baseline: 10.8, yield: 11.2, variance: '+0.4', status: 'Bullish' },
  { region: 'South America', commodity: 'Soybean',   baseline: 3.7,  yield: 3.5,  variance: '-0.2', status: 'Bearish' },
  { region: 'Europe',        commodity: 'Wheat',      baseline: 5.8,  yield: 5.8,  variance: '0.0',  status: 'Neutral' },
  { region: 'Asia Pacific',  commodity: 'Rice',       baseline: 4.8,  yield: 4.9,  variance: '+0.1', status: 'Bullish' },
  { region: 'India (Gujarat)',commodity: 'Cotton',     baseline: 1.5,  yield: 1.8,  variance: '+0.3', status: 'Bullish' },
  { region: 'India (MP)',     commodity: 'Mustard',    baseline: 1.4,  yield: 1.3,  variance: '-0.1', status: 'Bearish' },
  { region: 'India (AP)',     commodity: 'Chilli',     baseline: 1.6,  yield: 2.1,  variance: '+0.5', status: 'Bullish' },
  { region: 'India (TN)',     commodity: 'Turmeric',   baseline: 5.0,  yield: 5.2,  variance: '+0.2', status: 'Bullish' },
  { region: 'India (GJ)',     commodity: 'Groundnut',  baseline: 1.9,  yield: 1.9,  variance: '0.0',  status: 'Neutral' },
  { region: 'India (UP)',     commodity: 'Sugarcane',  baseline: 78.8, yield: 80.0, variance: '+1.2', status: 'Bullish' },
];

const calculateYieldsForNdvi = (ndvi) => {
  const scaleFactor = ndvi / 0.74;
  return INITIAL_YIELD_DATA.map(row => {
    const predictedYield = Number((row.baseline * scaleFactor).toFixed(1));
    const rawVariance = Number((predictedYield - row.baseline).toFixed(1));
    const varianceStr = rawVariance >= 0 ? `+${rawVariance.toFixed(1)}` : `${rawVariance.toFixed(1)}`;
    let status = 'Neutral';
    if (rawVariance <= -0.2) status = 'Bearish';
    else if (rawVariance >= 0.2) status = 'Bullish';
    return {
      ...row,
      yield: predictedYield,
      variance: varianceStr,
      status: status
    };
  });
};

export default function AnalyticsView() {
  const [selectedCrop, setSelectedCrop] = useState('corn');
  const [compareCrop, setCompareCrop] = useState('groundnut');
  const [timeRange, setTimeRange] = useState('1Y');
  
  // Live commodities pricing
  const [liveCommodities, setLiveCommodities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch live scraped prices on load and set up polling
  useEffect(() => {
    const fetchLivePrices = async () => {
      try {
        const token = localStorage.getItem('agripulse_token');
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const { data } = await axios.get(`${apiUrl}/api/commodity-prices`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (data && data.success) {
          setLiveCommodities(data.commodities || []);
        }
      } catch (err) {
        console.warn('Failed to fetch live prices in Analytics:', err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLivePrices();
    const interval = setInterval(fetchLivePrices, 10000);
    return () => clearInterval(interval);
  }, []);
  
  // Sort states
  const [yields, setYields] = useState(() => calculateYieldsForNdvi(0.67));
  const [sortField, setSortField] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [yieldSearch, setYieldSearch] = useState('');
  const [yieldStatusFilter, setYieldStatusFilter] = useState('All');

  const filteredYields = useMemo(() => {
    return yields.filter(item => {
      const matchesSearch = item.region.toLowerCase().includes(yieldSearch.toLowerCase()) || item.commodity.toLowerCase().includes(yieldSearch.toLowerCase());
      const matchesStatus = yieldStatusFilter === 'All' || item.status === yieldStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [yields, yieldSearch, yieldStatusFilter]);

  // Satellite Telemetry States
  const [showSatelliteModal, setShowSatelliteModal] = useState(false);
  const [ndviValue, setNdviValue] = useState(0.67);
  const [telemetryLogs, setTelemetryLogs] = useState([
    'Satellite Scan completed: Orbit ID-98421.',
    'Sentinel-2 spectral bands captured.',
    'IoT Soil Moisture node matches radar calibration.'
  ]);

  // Tooltip tracking states
  const [hoverIndex, setHoverIndex] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const chartContainerRef = useRef(null);

  // Helper: generates mathematical SVG path coordinates matching width/height
  const generateSvgPath = (data, width = 800, height = 220) => {
    if (!data || data.length === 0) return { path: '', points: [] };
    
    // Convert to number and filter out NaN values safely
    const cleanData = data.map(Number).filter(v => !isNaN(v));
    if (cleanData.length === 0) return { path: '', points: [] };

    const minVal = Math.min(...cleanData) * 0.95;
    const maxVal = Math.max(...cleanData) * 1.05;
    const range = maxVal - minVal || 1;

    const points = cleanData.map((val, idx) => {
      const x = (idx / (cleanData.length - 1)) * width;
      const y = height - ((val - minVal) / range) * (height - 40) - 20;
      return { x, y };
    });

    if (points.length === 0) return { path: '', points: [] };

    // Generate bezier path
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const cpX1 = points[i].x + (points[i+1].x - points[i].x) / 3;
      const cpY1 = points[i].y;
      const cpX2 = points[i].x + 2 * (points[i+1].x - points[i].x) / 3;
      const cpY2 = points[i+1].y;
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${points[i+1].x} ${points[i+1].y}`;
    }
    return { path, points };
  };

  const primaryDataset = useMemo(() => {
    const base = [...(HISTORICAL_DATASETS[selectedCrop] || [])];
    const liveItem = liveCommodities.find(c => c.crop === selectedCrop);
    if (liveItem && base.length > 0) {
      const val = Number(liveItem.priceNumeric);
      if (!isNaN(val)) {
        base[base.length - 1] = val;
      }
    }
    return base;
  }, [selectedCrop, liveCommodities]);

  const secondaryDataset = useMemo(() => {
    const base = [...(HISTORICAL_DATASETS[compareCrop] || [])];
    const liveItem = liveCommodities.find(c => c.crop === compareCrop);
    if (liveItem && base.length > 0) {
      const val = Number(liveItem.priceNumeric);
      if (!isNaN(val)) {
        base[base.length - 1] = val;
      }
    }
    return base;
  }, [compareCrop, liveCommodities]);

  const primaryChart = useMemo(() => generateSvgPath(primaryDataset), [primaryDataset]);
  const secondaryChart = useMemo(() => generateSvgPath(secondaryDataset), [secondaryDataset]);

  // Handle SVG Mouse tracking for Hover Tooltip
  const handleMouseMove = (e) => {
    if (!chartContainerRef.current) return;
    const rect = chartContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentX = x / rect.width;
    const index = Math.round(percentX * (primaryDataset.length - 1));
    
    if (index >= 0 && index < primaryDataset.length) {
      setHoverIndex(index);
      setTooltipPos({
        x: (index / (primaryDataset.length - 1)) * rect.width,
        y: e.clientY - rect.top - 50
      });
    }
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  // Sort Table function
  const handleSort = (field) => {
    const isAsc = sortField === field ? !sortAsc : true;
    setSortField(field);
    setSortAsc(isAsc);
    
    const sorted = [...yields].sort((a, b) => {
      let valA = a[field];
      let valB = b[field];

      if (field === 'yield') {
        valA = parseFloat(a[field]);
        valB = parseFloat(b[field]);
      } else if (field === 'variance') {
        valA = parseFloat(a[field].replace('+', ''));
        valB = parseFloat(b[field].replace('+', ''));
      }

      if (valA < valB) return isAsc ? -1 : 1;
      if (valA > valB) return isAsc ? 1 : -1;
      return 0;
    });
    setYields(sorted);
  };

  // Dynamic Crop metrics mapping
  const metrics = useMemo(() => {
    const baseMetrics = { ...(CROP_METRICS[selectedCrop] || CROP_METRICS.rice) };
    const liveItem = liveCommodities.find(c => c.crop === selectedCrop);
    if (liveItem) {
      baseMetrics.supply = liveItem.volume;
      baseMetrics.supplyTrend = liveItem.change;
    }
    return baseMetrics;
  }, [selectedCrop, liveCommodities]);

  // Export mock report download handler
  const handleExportReport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Month,Primary Crop Rate (INR),Comparison Crop Rate (INR)\n"
      + MONTHS.map((m, idx) => `${m},${primaryDataset[idx]},${secondaryDataset[idx]}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AgriPulse_Report_${selectedCrop}_vs_${compareCrop}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // IoT sensor stimulation trigger with ML model yield adjustment
  const triggerTelemetryScan = () => {
    const randomVal = 0.6 + Math.random() * 0.35;
    const newNdvi = Number(randomVal.toFixed(2));
    setNdviValue(newNdvi);
    const time = new Date().toLocaleTimeString();
    
    setYields(calculateYieldsForNdvi(newNdvi));

    setTelemetryLogs(prev => [
      `[${time}] Scan triggered: NDVI level updated to ${newNdvi}.`,
      `[${time}] Dynamic Yield ML core model re-predictions executed.`,
      `[${time}] Multispectral calibration check: OK.`,
      ...prev.slice(0, 3)
    ]);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' }}>
        <div className="spinner" style={{ width: '32px', height: '32px' }} />
        <span style={{ fontSize: '13px', color: 'var(--clr-on-surface-variant)', fontWeight: 600 }}>Loading Real-Time Analytics...</span>
      </div>
    );
  }

  return (
    <div className="animate-fade-up" id="analytics">
      {/* Page Header */}
      <div className="section-header">
        <div>
          <h1 style={{ fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
            Analytics Hub
          </h1>
          <p className="subtitle">Deep-dive data visualizations for agricultural commodities.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" id="btn-export" onClick={handleExportReport}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
            Export CSV Dataset
          </button>
          <button className="btn btn-primary" id="btn-filter" onClick={triggerTelemetryScan}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>sensors</span>
            Re-sync IoT Telemetry
          </button>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '24px', alignItems: 'stretch' }}>

        {/* Main Chart Card */}
        <div
          className="card"
          style={{ padding: '24px', display: 'flex', flexDirection: 'column', borderTop: '4px solid var(--clr-primary)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0 }}>Historical Price Trends</h3>
              <p style={{ fontSize: '12px', color: 'var(--clr-on-surface-variant)', marginTop: '4px' }}>
                {selectedCrop.toUpperCase()} vs. {compareCrop.toUpperCase()} (Trailing {timeRange})
              </p>
            </div>

            {/* Crop Selectors + Time Range */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Primary Crop Selector */}
              <select
                value={selectedCrop}
                onChange={e => setSelectedCrop(e.target.value)}
                className="form-select"
                style={{ width: 'auto', padding: '6px 12px', fontSize: '12px' }}
                aria-label="Primary crop"
              >
                {CROP_OPTIONS.map(c => (
                  <option key={c} value={c}>{c.toUpperCase()}</option>
                ))}
              </select>

              <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--clr-outline)' }}>VS</span>

              {/* Compare Crop Selector */}
              <select
                value={compareCrop}
                onChange={e => setCompareCrop(e.target.value)}
                className="form-select"
                style={{ width: 'auto', padding: '6px 12px', fontSize: '12px' }}
                aria-label="Compare crop"
              >
                {CROP_OPTIONS.filter(c => c !== selectedCrop).map(c => (
                  <option key={c} value={c}>{c.toUpperCase()}</option>
                ))}
              </select>

              {/* Time Range Selector */}
              <div style={{ display: 'flex', gap: '2px', background: 'var(--clr-surface-container-high)', borderRadius: '6px', padding: '3px' }}>
                {['1Y', '5Y', 'Max'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimeRange(t)}
                    style={{
                      padding: '4px 10px',
                      fontSize: '11px',
                      borderRadius: '4px',
                      border: 'none',
                      cursor: 'pointer',
                      background: timeRange === t ? 'var(--clr-surface-container-lowest)' : 'transparent',
                      color: timeRange === t ? 'var(--clr-primary)' : 'var(--clr-outline)',
                      fontWeight: timeRange === t ? 700 : 500,
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SVG Interactive Chart */}
          <div
            ref={chartContainerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              flex: 1,
              background: 'var(--clr-surface-bright)',
              border: '1px solid var(--clr-outline-variant)',
              borderRadius: '8px',
              padding: '16px 20px',
              position: 'relative',
              minHeight: '260px',
              cursor: 'crosshair',
            }}
          >
            <svg viewBox="0 0 800 220" width="100%" height="100%" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
              {/* Horizontal Grid guidelines */}
              {[0, 55, 110, 165, 220].map(y => (
                <line key={y} x1="0" y1={y} x2="800" y2={y} stroke="var(--clr-outline-variant)" strokeDasharray="3,3" strokeWidth="0.5" />
              ))}

              {/* Trend line paths */}
              <path
                d={secondaryChart.path}
                fill="none"
                stroke="var(--clr-outline)"
                strokeWidth="2"
                strokeDasharray="4,4"
                style={{ opacity: 0.6 }}
              />
              <path
                d={primaryChart.path}
                fill="none"
                stroke="var(--clr-primary)"
                strokeWidth="3.5"
              />

              {/* Vertical crosshair tracking line */}
              {hoverIndex !== null && primaryChart.points[hoverIndex] && (
                <>
                  <line
                    x1={primaryChart.points[hoverIndex].x}
                    y1="0"
                    x2={primaryChart.points[hoverIndex].x}
                    y2="220"
                    stroke="var(--clr-primary)"
                    strokeWidth="1"
                    style={{ opacity: 0.4 }}
                  />
                  <circle cx={primaryChart.points[hoverIndex].x} cy={primaryChart.points[hoverIndex].y} r="6" fill="var(--clr-primary)" stroke="#fff" strokeWidth="2" />
                  <circle cx={secondaryChart.points[hoverIndex].x} cy={secondaryChart.points[hoverIndex].y} r="5" fill="var(--clr-outline)" stroke="#fff" strokeWidth="2" />
                </>
              )}
            </svg>

            {/* Float Tooltip Box */}
            {hoverIndex !== null && (
              <div style={{
                position: 'absolute',
                left: `${tooltipPos.x + 10}px`,
                top: `${tooltipPos.y}px`,
                background: 'var(--clr-primary)',
                color: '#fff',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                pointerEvents: 'none',
                boxShadow: 'var(--shadow-level-2)',
                zIndex: 10,
                fontFamily: 'var(--font-mono)',
                display: 'flex',
                flexDirection: 'column',
                gap: '3px'
              }}>
                <strong style={{ color: '#aeeecb' }}>{MONTHS[hoverIndex]}</strong>
                <div>{selectedCrop.toUpperCase()}: ₹{primaryDataset[hoverIndex]}/Qtl</div>
                <div style={{ opacity: 0.85 }}>{compareCrop.toUpperCase()}: ₹{secondaryDataset[hoverIndex]}/Qtl</div>
              </div>
            )}

            {/* Custom chart legend */}
            <div style={{ display: 'flex', gap: '16px', position: 'absolute', bottom: '8px', left: '16px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '12px', height: '3px', background: 'var(--clr-primary)', borderRadius: '2px' }} />
                <span>{selectedCrop.toUpperCase()} (Primary)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '12px', height: '3px', borderTop: '2px dashed var(--clr-outline)', borderRadius: '2px' }} />
                <span>{compareCrop.toUpperCase()} (Compare)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Satellite Crop Health Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ height: '160px', position: 'relative', background: '#081c15' }}>
            {/* Satellite mock interface */}
            <img
              alt="Agricultural field view telemetry"
              src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80"
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.65 }}
            />
            {/* Scanning radar indicator */}
            <div style={{
              position: 'absolute', top: '15px', left: '15px',
              width: '10px', height: '10px', borderRadius: '50%',
              background: '#22c55e', boxShadow: '0 0 10px #22c55e',
              animation: 'pulse 1.5s infinite'
            }} />
            <div style={{ position: 'absolute', bottom: '10px', left: '15px', color: '#fff', fontSize: '10px', fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '4px' }}>
              SAT-RECON-5 // RESOLUTION: 0.5m/px
            </div>
          </div>
          
          <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge badge-active" style={{ fontSize: '10px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>satellite_alt</span>
                  Active Monitor
                </span>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--clr-secondary)', fontWeight: 700 }}>
                  NDVI Index: {ndviValue}
                </span>
              </div>
              <h3 style={{ margin: '8px 0', fontSize: '16px' }}>Crop Health Index</h3>
              <p style={{ fontSize: '12px', lineHeight: '1.5', color: 'var(--clr-on-surface-variant)' }}>
                Satellite imagery integrated with on-ground IoT sensors indicates optimal growth conditions, predicting a higher yield margin for Q3.
              </p>
            </div>
            
            <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => setShowSatelliteModal(true)}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>dashboard</span>
              Analyze Spectral Bands
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', margin: '24px 0' }}>
        {[
          { label: 'Supply Forecast', value: metrics.supply, unit: 'Tonnes', trend: `${metrics.supplyTrend} vs last year`, trendUp: !metrics.supplyTrend.includes('-') },
          { label: 'Global Demand Index', value: metrics.demand, unit: '/ 100', trend: `${metrics.demandTrend} from peak`, trendUp: metrics.demandTrend.includes('+') },
          { label: 'Export Volume (Est)', value: metrics.export, unit: 'MT', trend: 'Stable output', trendUp: null }
        ].map((m, i) => (
          <div key={i} className="card" style={{ padding: '20px', borderLeft: '4px solid var(--clr-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--clr-on-surface-variant)', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{m.label}</span>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>analytics</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '26px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{m.value}</span>
              <span style={{ fontSize: '12px', color: 'var(--clr-outline)', fontFamily: 'var(--font-sans)' }}>{m.unit}</span>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', fontSize: '11px', fontWeight: 700,
              color: m.trendUp === true ? 'var(--clr-secondary)' : m.trendUp === false ? 'var(--clr-error)' : 'var(--clr-outline)'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                {m.trendUp === true ? 'trending_up' : m.trendUp === false ? 'trending_down' : 'trending_flat'}
              </span>
              {m.trend}
            </div>
          </div>
        ))}
      </div>

      {/* Regional Yield Predictions Table */}
      <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--clr-outline-variant)', background: 'var(--clr-surface-bright)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h3 style={{ margin: 0 }}>Regional Yield Predictions</h3>
            <span className="badge badge-active" style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
              {filteredYields.length} Regional Forecasts
            </span>
          </div>

          {/* Filter Pills & Search */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative', width: '180px' }}>
              <span className="material-symbols-outlined" style={{
                position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--clr-outline)', fontSize: '14px', pointerEvents: 'none',
              }}>search</span>
              <input
                type="text"
                placeholder="Filter region..."
                value={yieldSearch}
                onChange={e => setYieldSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '4px 8px 4px 26px',
                  border: '1px solid var(--clr-outline-variant)',
                  borderRadius: '6px',
                  background: 'var(--clr-surface-container-lowest)',
                  fontSize: '11px',
                  outline: 'none'
                }}
              />
            </div>

            {/* Status Pills */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {['All', 'Bullish', 'Bearish', 'Neutral'].map(st => (
                <button
                  key={st}
                  onClick={() => setYieldStatusFilter(st)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: yieldStatusFilter === st ? '1px solid var(--clr-primary)' : '1px solid var(--clr-outline-variant)',
                    background: yieldStatusFilter === st ? 'var(--clr-primary)' : 'transparent',
                    color: yieldStatusFilter === st ? '#fff' : 'var(--clr-outline)'
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr style={{ cursor: 'pointer' }}>
                <th onClick={() => handleSort('region')}>Region {sortField === 'region' ? (sortAsc ? '▲' : '▼') : ''}</th>
                <th onClick={() => handleSort('commodity')}>Commodity {sortField === 'commodity' ? (sortAsc ? '▲' : '▼') : ''}</th>
                <th style={{ textAlign: 'right' }}>Baseline (MT/ha)</th>
                <th onClick={() => handleSort('yield')} style={{ textAlign: 'right' }}>Est. Yield (MT/ha) {sortField === 'yield' ? (sortAsc ? '▲' : '▼') : ''}</th>
                <th onClick={() => handleSort('variance')} style={{ textAlign: 'right' }}>Variance {sortField === 'variance' ? (sortAsc ? '▲' : '▼') : ''}</th>
                <th style={{ textAlign: 'center' }}>Yield Index</th>
                <th onClick={() => handleSort('status')} style={{ textAlign: 'center' }}>Status {sortField === 'status' ? (sortAsc ? '▲' : '▼') : ''}</th>
              </tr>
            </thead>
            <tbody>
              {filteredYields.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--clr-outline)' }}>
                    No regional yield predictions match filter '{yieldSearch || yieldStatusFilter}'.
                  </td>
                </tr>
              ) : (
                filteredYields.map((row, idx) => {
                  const pctYield = Math.min(100, Math.round((row.yield / (row.baseline || 1)) * 50));
                  return (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{row.region}</td>
                      <td>{row.commodity}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--clr-outline)' }}>{row.baseline}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{row.yield}</td>
                      <td style={{
                        textAlign: 'right',
                        fontFamily: 'var(--font-mono)',
                        color: row.variance.startsWith('+') ? 'var(--clr-secondary)' :
                               row.variance.startsWith('-') ? 'var(--clr-error)' : 'var(--clr-outline)',
                        fontWeight: 700
                      }}>
                        {row.variance}
                      </td>
                      <td style={{ textAlign: 'center', width: '120px' }}>
                        <div className="progress-bar" style={{ height: '4px' }}>
                          <div className="progress-fill" style={{
                            width: `${pctYield}%`,
                            background: row.status === 'Bullish' ? 'var(--clr-secondary)' : row.status === 'Bearish' ? 'var(--clr-error)' : 'var(--clr-primary)'
                          }} />
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${row.status === 'Bullish' ? 'badge-bullish' : row.status === 'Bearish' ? 'badge-bearish' : 'badge-neutral'}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Satellite Telemetry Modal */}
      {showSatelliteModal && (
        <div className="modal-overlay" onClick={() => setShowSatelliteModal(false)}>
          <div className="modal-card" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--clr-outline-variant)', paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--clr-primary)' }}>satellite_alt</span>
                <h3 style={{ margin: 0 }}>Spectral Band Analysis</h3>
              </div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowSatelliteModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: 'var(--clr-surface-container-low)', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--clr-outline)', textTransform: 'uppercase' }}>NDVI index</div>
                  <strong style={{ fontSize: '20px', color: 'var(--clr-secondary)', fontFamily: 'var(--font-mono)' }}>{ndviValue}</strong>
                </div>
                <div style={{ background: 'var(--clr-surface-container-low)', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--clr-outline)', textTransform: 'uppercase' }}>IoT moisture</div>
                  <strong style={{ fontSize: '20px', color: 'var(--clr-primary)', fontFamily: 'var(--font-mono)' }}>42.8%</strong>
                </div>
              </div>

              <div style={{ background: '#0a0f0d', color: '#7bc49b', padding: '12px', borderRadius: '6px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                <div style={{ borderBottom: '1px solid #1a2f24', paddingBottom: '4px', marginBottom: '6px', color: '#c4ebd5', fontWeight: 'bold' }}>
                  LIVE NDVI SPECTRAL CONSOLE
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', height: '100px', overflowY: 'auto' }}>
                  {telemetryLogs.map((log, i) => (
                    <div key={i} style={{ opacity: i === 0 ? 1 : 0.75 }}>{log}</div>
                  ))}
                </div>
              </div>

              <button className="btn btn-primary" style={{ width: '100%' }} onClick={triggerTelemetryScan}>
                Trigger Live Sentinel Scan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

