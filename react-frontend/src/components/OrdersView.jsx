import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';

/* ─── Inline Styles for premium glassmorphic UI ─── */
const styles = {
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '12px',
    marginBottom: '16px',
  },
  statCard: {
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    position: 'relative',
    overflow: 'hidden',
    borderLeft: '4px solid var(--clr-primary)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  statIconWrap: (bg) => ({
    width: 32, height: 32,
    borderRadius: '8px',
    background: bg,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff',
    fontSize: '16px',
    flexShrink: 0,
  }),
  statLabel: {
    fontSize: '10px', fontWeight: 600, textTransform: 'uppercase',
    letterSpacing: '0.06em', color: 'var(--clr-on-surface-variant)',
  },
  statValue: {
    fontSize: '20px', fontWeight: 700,
    fontFamily: 'var(--font-mono)', color: 'var(--clr-on-surface)',
    lineHeight: 1.1,
  },
  chipRow: {
    display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center',
  },
  chip: (active) => ({
    padding: '4px 10px',
    borderRadius: '9999px',
    border: `1px solid ${active ? 'var(--clr-primary)' : 'var(--clr-outline-variant)'}`,
    background: active ? 'var(--clr-primary)' : 'var(--clr-surface-container-lowest)',
    color: active ? '#fff' : 'var(--clr-on-surface-variant)',
    fontSize: '11px', fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'var(--font-sans)',
    display: 'flex', alignItems: 'center', gap: '4px',
  }),
  expandRow: (open) => ({
    maxHeight: open ? '500px' : '0',
    overflow: 'hidden',
    transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  }),
  detailGrid: {
    padding: '16px 20px',
    display: 'grid',
    gridTemplateColumns: '1.2fr 1.8fr',
    gap: '16px',
    background: 'var(--clr-surface-container-low)',
    borderTop: '1px solid var(--clr-outline-variant)',
    borderBottom: '1px solid var(--clr-outline-variant)',
  },
  detailLabel: {
    fontSize: '9px', fontWeight: 700, textTransform: 'uppercase',
    color: 'var(--clr-outline)', letterSpacing: '0.05em', marginBottom: '3px',
  },
  detailValue: {
    fontSize: '13px', fontWeight: 600,
    color: 'var(--clr-on-surface)',
  },
  actionBtn: (isDanger) => ({
    padding: '4px 8px',
    borderRadius: '4px',
    border: `1px solid ${isDanger ? 'var(--clr-error)' : 'var(--clr-primary)'}`,
    background: isDanger ? 'rgba(186, 26, 26, 0.05)' : 'rgba(1, 45, 29, 0.05)',
    color: isDanger ? 'var(--clr-error)' : 'var(--clr-primary)',
    fontSize: '10px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontFamily: 'var(--font-sans)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
  }),
  miniInput: {
    width: '50px',
    padding: '3px 5px',
    border: '1px solid var(--clr-outline-variant)',
    borderRadius: '4px',
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    marginRight: '4px',
    outline: 'none',
    textAlign: 'center',
  },
  actionGroup: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
  },
  searchWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchInput: {
    padding: '5px 8px 5px 26px',
    border: '1px solid var(--clr-outline-variant)',
    borderRadius: '6px',
    background: 'var(--clr-surface-container-lowest)',
    fontSize: '11px',
    fontFamily: 'var(--font-sans)',
    outline: 'none',
  },
  searchIcon: {
    position: 'absolute',
    left: '6px',
    fontSize: '14px',
    color: 'var(--clr-outline)',
  }
};

const fmtINR = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;

// Risk details for each crop
const CROP_RISK_FACTORS = {
  wheat: { level: 'Low', pct: 25, reason: 'Highly durable storage conditions & consistent government minimum support price protection.', decayCoeff: 0.02 },
  rice: { level: 'Medium', pct: 45, reason: 'Susceptible to moisture levels during holding. Stable export demand keeps market volatility moderate.', decayCoeff: 0.05 },
  corn: { level: 'Medium', pct: 50, reason: 'High feed industry linkage causes medium-high demand fluctuations during harvesting season.', decayCoeff: 0.07 },
  cotton: { level: 'High', pct: 75, reason: 'Extremely volatile international indices, high storage decay risk if exposed to damp weather.', decayCoeff: 0.12 },
  soybean: { level: 'High', pct: 70, reason: 'High industrial oil extraction competition leads to rapid pricing changes across regional exchanges.', decayCoeff: 0.10 },
  sugarcane: { level: 'Low', pct: 30, reason: 'Heavy linkage with mills, low short-term storage holding periods keeps market exposure limited.', decayCoeff: 0.15 },
  mustard: { level: 'Medium', pct: 40, reason: 'Oilseed market changes based on import tariffs. Storage decay is relatively low.', decayCoeff: 0.04 },
  groundnut: { level: 'Medium', pct: 48, reason: 'Prone to aflatoxin development if stored poorly. High oil mill demand provides floor pricing support.', decayCoeff: 0.06 },
  turmeric: { level: 'High', pct: 68, reason: 'High crop cycle duration makes holding vulnerable to pricing cycles and regional production reports.', decayCoeff: 0.08 },
  chilli: { level: 'High', pct: 80, reason: 'Extremely high volatility due to export quality standards and seasonal weather disruptions in cultivation.', decayCoeff: 0.14 }
};

export default function OrdersView({ showToast, autoSync }) {
  const [crop, setCrop] = useState('wheat');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [volumeUnit, setVolumeUnit] = useState('Tons'); // 'Tons', 'kg', 'Quintals', 'Bags'
  const [facilityTerminal, setFacilityTerminal] = useState('GJ-ColdStorage-1');
  const [qualityGrade, setQualityGrade] = useState('Grade A');
  const [holdingHorizon, setHoldingHorizon] = useState('3 Months');
  const [targetSellPrice, setTargetSellPrice] = useState('');
  const [moisturePct, setMoisturePct] = useState('9.5');
  const [insurancePolicy, setInsurancePolicy] = useState('Comprehensive');
  const [procurementSource, setProcurementSource] = useState('Direct APMC Mandi');
  const [commodities, setCommodities] = useState([]);

  // Unit conversion helper to convert entered quantity to Tons (MT)
  const getTonnage = (qty, unit) => {
    const v = Number(qty) || 0;
    if (unit === 'kg') return v / 1000;
    if (unit === 'Quintals') return v / 10;
    if (unit === 'Bags') return (v * 50) / 1000;
    return v; // Tons
  };
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [backendPredictions, setBackendPredictions] = useState({});
  const [showLogBot, setShowLogBot] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Local simulated predictions & logs
  const [predictionsLog, setPredictionsLog] = useState([
    '[10:38:55 am] AI Core re-evaluated MUSTARD: predicted tomorrow trend UP (65% confidence).',
    '[10:38:50 am] AI Core re-evaluated COTTON: predicted tomorrow trend UP (89% confidence).',
    '[10:38:45 am] AI Core re-evaluated WHEAT: predicted tomorrow trend UP (86% confidence).'
  ]);
  const [tickerTick, setTickerTick] = useState(0);
  const [activeTooltip, setActiveTooltip] = useState(null);

  // Quick Action States inside Table
  const [adjustQty, setAdjustQty] = useState({});

  // Initial user inventory stock state
  const [inventory, setInventory] = useState([
    { crop: 'wheat', quantity: 80, purchasePrice: 2420, dateAdded: '2026-07-01' },
    { crop: 'rice', quantity: 45, purchasePrice: 6750, dateAdded: '2026-07-04' },
    { crop: 'cotton', quantity: 20, purchasePrice: 7100, dateAdded: '2026-07-08' },
    { crop: 'corn', quantity: 66, purchasePrice: 1980, dateAdded: '2026-07-10' }
  ]);

  const [cashReserves, setCashReserves] = useState(2103280);
  const [storageLimit, setStorageLimit] = useState(400);
  const activeToken = localStorage.getItem('agripulse_token');

  // Fetch persistent user inventory from database
  const fetchUserInventory = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/inventory', {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      if (response.data && response.data.success) {
        if (response.data.inventory && response.data.inventory.length > 0) {
          setInventory(response.data.inventory);
        }
        if (response.data.cashReserves !== undefined) {
          setCashReserves(response.data.cashReserves);
        }
        if (response.data.storageLimit !== undefined) {
          setStorageLimit(response.data.storageLimit);
        }
      }
    } catch (error) {
      console.error('Failed to fetch user inventory:', error);
    }
  };

  // Sync inventory & cash updates to DB
  const saveInventoryToDb = async (newInventory, newCash, newLimit) => {
    try {
      await axios.post('http://localhost:5000/api/inventory/adjust', {
        inventory: newInventory,
        cashReserves: newCash,
        storageLimit: newLimit !== undefined ? newLimit : storageLimit
      }, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
    } catch (error) {
      console.error('Failed to persist inventory state to DB:', error);
      if (showToast) showToast('Error syncing inventory state to database', 'error');
    }
  };

  // Fetch live commodity prices
  const fetchCommodityPrices = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/commodity-prices', {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      setCommodities(data.commodities || []);
      setLoadingPrices(false);
    } catch (err) {
      console.error('Failed to fetch prices in inventory:', err);
      setLoadingPrices(false);
    }
  };

  useEffect(() => {
    fetchCommodityPrices();
    if (activeToken) {
      fetchUserInventory();
    }
    const handleUpdated = () => {
      fetchUserInventory();
    };
    window.addEventListener('inventoryUpdated', handleUpdated);
    
    let interval;
    if (autoSync) {
      interval = setInterval(fetchCommodityPrices, 8000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
      window.removeEventListener('inventoryUpdated', handleUpdated);
    };
  }, [activeToken, autoSync]);

  // Fetch real ML predictions for inventory crops
  useEffect(() => {
    const fetchPredictions = async () => {
      if (inventory.length === 0) return;
      const newPreds = { ...backendPredictions };
      let updated = false;

      for (const item of inventory) {
        try {
          const liveItem = commodities.find(c => c.crop === item.crop);
          const prevPrice = liveItem ? Number(liveItem.price.replace(/[^\d]/g, '')) : item.purchasePrice;

          const payload = {
            previous_price: prevPrice,
            supply_volume: item.quantity,
            transport_cost_index: 100,
            market_demand_score: 7,
            crop: item.crop
          };

          const response = await axios.post('http://localhost:5000/api/predict', payload, {
            headers: { Authorization: `Bearer ${activeToken}` }
          });

          if (response.data) {
            newPreds[item.crop] = {
              prediction: response.data.prediction,
              confidence: response.data.confidence,
              probabilityUp: response.data.probability_up
            };
            updated = true;
          }
        } catch (err) {
          console.warn(`Failed to fetch ML prediction for ${item.crop}:`, err.message);
        }
      }

      if (updated) {
        setBackendPredictions(newPreds);
      }
    };

    fetchPredictions();
  }, [inventory, commodities, tickerTick]);

  // Continual prediction simulation loop
  useEffect(() => {
    if (!autoSync) return;
    const predictorTimer = setInterval(() => {
      setTickerTick(prev => prev + 1);

      // Randomly choose a crop to trigger a "live prediction update" in the AI logs
      const crops = Object.keys(CROP_RISK_FACTORS);
      const selectedCrop = crops[Math.floor(Math.random() * crops.length)];
      const trend = Math.random() > 0.4 ? 'UP' : 'DOWN';
      const confidence = Math.floor(Math.random() * 30) + 65;

      const timeStr = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }).toLowerCase();

      const logMsg = `[${timeStr}] AI Core re-evaluated ${selectedCrop.toUpperCase()}: predicted tomorrow trend ${trend} (${confidence}% confidence).`;
      setPredictionsLog(prev => [logMsg, ...prev.slice(0, 7)]);
    }, 5000);

    return () => clearInterval(predictorTimer);
  }, [autoSync]);

  // Autofill purchase price when selected crop changes
  useEffect(() => {
    if (commodities.length > 0) {
      const matched = commodities.find(c => c.crop === crop);
      if (matched) {
        const numeric = matched.price.replace(/[^\d]/g, '');
        if (numeric) setPurchasePrice(numeric);
      }
    } else {
      // Static fallback defaults
      const defaults = { wheat: 2450, rice: 6800, corn: 1950, cotton: 7200, soybean: 5200, sugarcane: 340, mustard: 5600, groundnut: 6100, turmeric: 7400, chilli: 9200 };
      setPurchasePrice(defaults[crop] || 2000);
    }
  }, [crop, commodities]);

  // Handle adding new stock
  const handleAddStock = (e) => {
    if (e) e.preventDefault();
    if (!quantity || !purchasePrice) {
      showToast('Please fill in quantity and purchase price', 'error');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      const qNum = Number(quantity);
      const pNum = Number(purchasePrice);
      const cost = qNum * pNum * 10; // Quintals scale factor (approx)

      if (cashReserves < cost) {
        showToast('Insufficient cash reserves for this purchase!', 'error');
        setSubmitting(false);
        return;
      }

      let nextInv = [];
      setInventory(prev => {
        const index = prev.findIndex(item => item.crop === crop);
        if (index > -1) {
          const updated = [...prev];
          const oldQty = updated[index].quantity;
          const oldPrice = updated[index].purchasePrice;
          updated[index] = {
            ...updated[index],
            quantity: oldQty + qNum,
            purchasePrice: Math.round(((oldQty * oldPrice) + (qNum * pNum)) / (oldQty + qNum)),
            dateAdded: new Date().toISOString().split('T')[0]
          };
          nextInv = updated;
          return updated;
        } else {
          nextInv = [...prev, {
            crop,
            quantity: qNum,
            purchasePrice: pNum,
            dateAdded: new Date().toISOString().split('T')[0]
          }];
          return nextInv;
        }
      });

      const nextCash = cashReserves - cost;
      setCashReserves(nextCash);
      saveInventoryToDb(nextInv.length > 0 ? nextInv : inventory, nextCash);

      showToast(`Added ${qNum} Tons of ${crop.toUpperCase()} stock successfully`, 'success');
      setPredictionsLog(prev => [`[${new Date().toLocaleTimeString()}] USER ACTION: Added ${qNum} Tons of ${crop.toUpperCase()} @ ₹${pNum}/Qtl. Portfolio exposure re-weighted.`, ...prev]);
      setQuantity('');
      setSubmitting(false);
    }, 600);
  };

  // Inline Quick Add/Remove action executor
  const handleQuickAdjust = (targetCrop, type) => {
    const amountStr = adjustQty[targetCrop];
    if (!amountStr || isNaN(amountStr) || Number(amountStr) <= 0) {
      showToast('Enter a valid amount of Tons', 'error');
      return;
    }
    const amount = Number(amountStr);

    if (type === 'ADD') {
      const matchedInv = inventory.find(i => i.crop === targetCrop);
      const liveItem = commodities.find(c => c.crop === targetCrop);
      const priceVal = liveItem ? Number(liveItem.price.replace(/[^\d]/g, '')) : (matchedInv ? matchedInv.purchasePrice : 2000);
      const cost = amount * priceVal * 10;

      if (cashReserves < cost) {
        showToast('Insufficient cash reserves!', 'error');
        return;
      }

      let nextInv = [];
      setInventory(prev => {
        const index = prev.findIndex(item => item.crop === targetCrop);
        if (index > -1) {
          const updated = [...prev];
          const oldQty = updated[index].quantity;
          const oldPrice = updated[index].purchasePrice;
          updated[index] = {
            ...updated[index],
            quantity: oldQty + amount,
            purchasePrice: Math.round(((oldQty * oldPrice) + (amount * priceVal)) / (oldQty + amount))
          };
          nextInv = updated;
          return updated;
        } else {
          nextInv = [...prev, { crop: targetCrop, quantity: amount, purchasePrice: priceVal, dateAdded: new Date().toISOString().split('T')[0] }];
          return nextInv;
        }
      });
      const nextCash = cashReserves - cost;
      setCashReserves(nextCash);
      saveInventoryToDb(nextInv.length > 0 ? nextInv : inventory, nextCash);

      showToast(`Added ${amount} Tons of ${targetCrop.toUpperCase()} via Quick Adjustment.`, 'success');
      setPredictionsLog(prev => [`[${new Date().toLocaleTimeString()}] Quick Adjust: Added ${amount} Tons of ${targetCrop.toUpperCase()}.`, ...prev]);
    } else {
      // SELL / LIQUIDATE
      const matchedInv = inventory.find(i => i.crop === targetCrop);
      if (!matchedInv || matchedInv.quantity < amount) {
        showToast('Cannot sell more than holding volume!', 'error');
        return;
      }

      const liveItem = commodities.find(c => c.crop === targetCrop);
      const priceVal = liveItem ? Number(liveItem.price.replace(/[^\d]/g, '')) : matchedInv.purchasePrice;
      const credit = amount * priceVal * 10;

      let nextInv = [];
      setInventory(prev => {
        const res = prev.map(item => {
          if (item.crop === targetCrop) {
            return { ...item, quantity: item.quantity - amount };
          }
          return item;
        }).filter(item => item.quantity > 0);
        nextInv = res;
        return res;
      });

      const nextCash = cashReserves + credit;
      setCashReserves(nextCash);
      saveInventoryToDb(nextInv.length > 0 ? nextInv : inventory, nextCash);

      showToast(`Removed/Sold ${amount} Tons of ${targetCrop.toUpperCase()}. Received ${fmtINR(credit)}.`, 'success');
      setPredictionsLog(prev => [`[${new Date().toLocaleTimeString()}] Quick Adjust: Sold ${amount} Tons of ${targetCrop.toUpperCase()} at market rate.`, ...prev]);
    }

    setAdjustQty(prev => ({ ...prev, [targetCrop]: '' }));
  };

  // Liquidate stock fully or partially suggested by AI
  const handleLiquidate = (targetCrop, amountToLiquidate) => {
    const matchedInv = inventory.find(i => i.crop === targetCrop);
    if (!matchedInv) return;

    const actualLiquidate = Math.min(matchedInv.quantity, amountToLiquidate);
    const liveItem = commodities.find(c => c.crop === targetCrop);
    const currentPriceNumeric = liveItem ? Number(liveItem.price.replace(/[^\d]/g, '')) : matchedInv.purchasePrice;
    const recoveryAmt = actualLiquidate * currentPriceNumeric * 10;

    let nextInv = [];
    setInventory(prev => {
      const res = prev.map(item => {
        if (item.crop === targetCrop) {
          return { ...item, quantity: Math.max(0, item.quantity - actualLiquidate) };
        }
        return item;
      }).filter(item => item.quantity > 0);
      nextInv = res;
      return res;
    });

    const nextCash = cashReserves + recoveryAmt;
    setCashReserves(nextCash);
    saveInventoryToDb(nextInv.length > 0 ? nextInv : inventory, nextCash);

    showToast(`AI Suggested Liquidation Executed: Sold ${actualLiquidate} Tons of ${targetCrop.toUpperCase()}. Received ${fmtINR(recoveryAmt)}`, 'success');
    setPredictionsLog(prev => [`[${new Date().toLocaleTimeString()}] AI EXECUTE: Liquidated ${actualLiquidate} Tons of ${targetCrop.toUpperCase()} based on risk decay parameters.`, ...prev]);
  };

  // Compile detailed inventory stats matching live feeds
  const processedInventory = useMemo(() => {
    return inventory.map(item => {
      const liveItem = commodities.find(c => c.crop === item.crop);

      // Setup dynamic fluctuations based on tickerTick so they actually continually update
      let priceFluctuation = 0;
      if (tickerTick > 0) {
        const hash = item.crop.charCodeAt(0) + item.crop.charCodeAt(1) + tickerTick;
        priceFluctuation = (hash % 11 - 5) * 5; // e.g., -25 to +25 INR
      }

      const rawPriceVal = liveItem ? Number(liveItem.price.replace(/[^\d]/g, '')) : item.purchasePrice;
      const currentPriceVal = rawPriceVal + priceFluctuation;
      const currentPriceStr = `₹${currentPriceVal.toLocaleString('en-IN')}`;

      const totalValue = item.quantity * currentPriceVal * 10; // Tons to Quintals conversion factor
      const purchaseValue = item.quantity * item.purchasePrice * 10;
      const pnl = totalValue - purchaseValue;
      const pnlPercent = purchaseValue > 0 ? (pnl / purchaseValue) * 100 : 0;

      // Extract trend and confidence from real backend ensemble model predictions (with live scraped fallback)
      const realPred = backendPredictions[item.crop];
      const forecastTrend = realPred ? realPred.prediction : (liveItem ? (liveItem.bullish ? 'UP' : 'DOWN') : 'UP');
      const confidence = realPred ? realPred.confidence : Math.min(99, Math.max(65, Math.round(75 + (liveItem ? Math.abs(parseFloat(liveItem.change)) : 1.2) * 8 + (tickerTick % 5))));

      // Generate AI Recommendations dynamically based on forecast and holding levels
      let recommendation = 'HOLD';
      let suggestionText = 'Hold current levels. Trend is stable and matching market parameters.';
      let suggestAmount = 0;

      if (forecastTrend === 'DOWN') {
        recommendation = 'LIQUIDATE';
        suggestAmount = Math.round(item.quantity * 0.4); // Suggest removing 40%
        if (suggestAmount === 0 && item.quantity > 0) suggestAmount = item.quantity;
        suggestionText = `AI Recommendation: Forecast shows price downward risk (${confidence}% confidence). Liquidate ${suggestAmount} Tons to avoid potential loss.`;
      } else if (item.quantity > 100) {
        recommendation = 'REDUCE';
        suggestAmount = Math.round(item.quantity - 80);
        suggestionText = `AI Recommendation: Holding quantity exceeds storage health threshold. Sell ${suggestAmount} Tons to optimize cash liquidity.`;
      } else if (forecastTrend === 'UP') {
        recommendation = 'ACCUMULATE';
        suggestionText = `AI Recommendation: High confidence bullish breakout expected. Holding current position is highly optimal.`;
      }

      const riskInfo = CROP_RISK_FACTORS[item.crop] || { level: 'Medium', pct: 50, reason: 'Moderate market exposure.', decayCoeff: 0.05 };

      return {
        ...item,
        currentPrice: currentPriceStr,
        currentPriceNumeric: currentPriceVal,
        totalValue,
        pnl,
        pnlPercent,
        forecastTrend,
        confidence,
        recommendation,
        suggestionText,
        suggestAmount,
        risk: riskInfo
      };
    });
  }, [inventory, commodities, tickerTick]);

  // General inventory stats
  const totalStockValue = useMemo(() => {
    return processedInventory.reduce((sum, item) => sum + item.totalValue, 0);
  }, [processedInventory]);

  const totalTonnage = useMemo(() => {
    return inventory.reduce((sum, item) => sum + item.quantity, 0);
  }, [inventory]);

  const avgRiskPct = useMemo(() => {
    if (inventory.length === 0) return 0;
    const sum = processedInventory.reduce((s, i) => s + i.risk.pct, 0);
    return Math.round(sum / inventory.length);
  }, [processedInventory, inventory]);

  // Sort risk items so High Risk & High Value appear at the top
  const sortedRiskInventory = useMemo(() => {
    return [...processedInventory].sort((a, b) => {
      if (b.risk.pct !== a.risk.pct) {
        return b.risk.pct - a.risk.pct;
      }
      return b.totalValue - a.totalValue;
    });
  }, [processedInventory]);

  const filteredInventory = useMemo(() => {
    let list = processedInventory;
    if (filter !== 'All') {
      list = list.filter(i => i.recommendation === filter.toUpperCase());
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i => i.crop.includes(q));
    }
    return list;
  }, [processedInventory, filter, search]);

  const holdingCapacityPct = Math.min(100, Math.round((totalTonnage / storageLimit) * 100));

  // Risk Pre-take simulator computations
  const simulatorPreview = useMemo(() => {
    if (!quantity || isNaN(quantity) || Number(quantity) <= 0) return null;
    const qNum = Number(quantity);
    const pNum = Number(purchasePrice) || 2000;
    const itemRisk = CROP_RISK_FACTORS[crop] || { level: 'Medium', pct: 50, decayCoeff: 0.06 };

    // Simulate portfolio risk change
    const simulatedInventory = [...inventory];
    const index = simulatedInventory.findIndex(item => item.crop === crop);
    if (index > -1) {
      simulatedInventory[index] = { ...simulatedInventory[index], quantity: simulatedInventory[index].quantity + qNum };
    } else {
      simulatedInventory.push({ crop, quantity: qNum });
    }

    const totalNewTonnage = simulatedInventory.reduce((s, i) => s + i.quantity, 0);
    const simulatedAvgRisk = Math.round(simulatedInventory.reduce((s, i) => {
      const cropRisk = CROP_RISK_FACTORS[i.crop]?.pct || 50;
      return s + cropRisk;
    }, 0) / simulatedInventory.length);

    const cost = qNum * pNum * 10;
    const potentialStorageDecayVal = cost * itemRisk.decayCoeff;
    const isCapacityExceeded = totalNewTonnage > storageLimit;

    return {
      cost,
      potentialStorageDecayVal,
      simulatedAvgRisk,
      isCapacityExceeded,
      riskLevel: itemRisk.level,
      decayRate: (itemRisk.decayCoeff * 100).toFixed(1)
    };
  }, [crop, quantity, purchasePrice, inventory]);

  return (
    <div className="animate-fade-up" id="stock-panel">
      {/* Page Header */}
      <div className="section-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
            <h1 style={{ fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 700, margin: 0 }}>AI Stock Management Panel</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(52, 211, 153, 0.1)', color: 'var(--clr-secondary)', padding: '4px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700 }}>
              <span className="material-symbols-outlined" style={{ fontSize: '12px', animation: 'pulse 1.5s infinite' }}>online_prediction</span>
              LIVE AI AUTO-PREDICT RUNNING
            </div>
            
            {/* Bell Toggle Button */}
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: showNotifications ? 'var(--clr-primary)' : 'var(--clr-outline)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                borderRadius: '50%',
                transition: 'background 0.2s',
                position: 'relative'
              }}
              title="Toggle AI Stock Alerts"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>notifications</span>
              <span style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--clr-error)'
              }} />
            </button>

            {/* Notifications Dropdown inside stock view */}
            {showNotifications && (
              <div style={{
                position: 'absolute',
                top: '36px',
                left: '0',
                width: '300px',
                background: 'var(--clr-surface-container-lowest)',
                border: '1px solid var(--clr-outline-variant)',
                borderRadius: '12px',
                boxShadow: 'var(--shadow-level-3)',
                zIndex: 10000,
                padding: '12px',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--clr-outline-variant)', paddingBottom: '8px', marginBottom: '8px', fontWeight: 'bold', fontSize: '12px', color: 'var(--clr-on-surface)' }}>
                  <span>Notifications</span>
                  <span style={{ fontSize: '10px', color: 'var(--clr-secondary)' }}>3 New Alerts</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { id: 1, text: "AI Alert: Cotton tomorrow forecast has high volatility risk (89%).", time: "2m ago", unread: true },
                    { id: 2, text: "Satellite Re-sync: Sentinel-2 telemetry updated successfully.", time: "10m ago", unread: false },
                    { id: 3, text: "System Audit: Model log core is online.", time: "1h ago", unread: false }
                  ].map(n => (
                    <div key={n.id} style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '6px', borderRadius: '6px', background: n.unread ? 'rgba(52, 211, 153, 0.05)' : 'transparent', borderBottom: '1px solid var(--clr-outline-variant)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--clr-on-surface)', fontWeight: n.unread ? '700' : '500' }}>{n.text}</div>
                      <div style={{ fontSize: '9px', color: 'var(--clr-outline)' }}>{n.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <p className="subtitle">Continual ML-powered predictions and automated risk liquidation suggestions.</p>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div style={styles.statsGrid} className="orders-stats-grid">
        {[
          {
            label: 'Total Inventory Value',
            value: fmtINR(totalStockValue),
            icon: 'inventory_2',
            bg: 'var(--clr-primary)',
            desc: 'Combined value of all active stock holdings calculated dynamically using the latest live exchange spot rates and regional index offsets.'
          },
          {
            label: 'Holding Tonnage',
            value: `${totalTonnage} / ${storageLimit} Tons`,
            icon: 'scale',
            bg: 'var(--clr-secondary)',
            desc: `Total weight of stored crops relative to the warehouse facility's max holding capacity (${storageLimit} Tons limit).`
          },
          {
            label: 'Average Risk Score',
            value: `${avgRiskPct}%`,
            icon: 'warning',
            bg: avgRiskPct > 60 ? 'var(--clr-error)' : '#ea580c',
            desc: 'The overall portfolio risk coefficient determined by averaging the moisture, decay, and price volatility indices of active holdings.'
          },
          {
            label: 'Cash Reserves',
            value: fmtINR(cashReserves),
            icon: 'payments',
            bg: '#9333ea',
            desc: 'Total available capital balance for commodity procurement. Balance decreases when adding stock and increases upon selling/liquidation.'
          }
        ].map((s, i) => (
          <div className="card" style={{ ...styles.statCard, position: 'relative' }} key={i}>
            {/* Info toggle button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveTooltip(activeTooltip === i ? null : i);
              }}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--clr-outline)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2px',
                borderRadius: '50%',
                transition: 'background 0.2s',
                zIndex: 5
              }}
              title="Click to view metric details"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>info</span>
            </button>

            {/* Premium glassmorphic tooltip details overlay */}
            {activeTooltip === i && (
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'var(--clr-surface-container-high)',
                backdropFilter: 'blur(10px)',
                zIndex: 10,
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderRadius: '8px',
                border: '1px solid var(--clr-outline-variant)',
                boxShadow: 'var(--shadow-level-2)',
                animation: 'fadeIn 0.2s ease'
              }}>
                <div style={{ fontSize: '11px', color: 'var(--clr-on-surface)', lineHeight: '1.4' }}>
                  <strong>{s.label} Definition:</strong>
                  <p style={{ margin: '4px 0 0 0', fontSize: '10px', color: 'var(--clr-on-surface-variant)' }}>{s.desc}</p>
                </div>
                <button
                  className="btn btn-secondary"
                  style={{ alignSelf: 'flex-end', padding: '2px 8px', fontSize: '10px', minHeight: 'auto', height: 'auto', marginTop: '6px' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTooltip(null);
                  }}
                >
                  Close
                </button>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={styles.statIconWrap(s.bg)}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{s.icon}</span>
              </div>
              <div>
                <div style={styles.statLabel}>{s.label}</div>
                <div style={styles.statValue}>{s.value}</div>
              </div>
            </div>
            {i === 1 && (
              <div className="progress-bar" style={{ marginTop: '8px', height: '4px' }}>
                <div className="progress-fill" style={{ width: `${holdingCapacityPct}%`, background: 'var(--clr-secondary)' }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Form and Portfolio Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', alignItems: 'start', marginTop: '8px' }}>

        {/* Add Stock Card with Pre-take Simulator */}
        <div className="card-predictor" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="material-symbols-outlined icon-filled" style={{ color: 'var(--clr-primary)', fontSize: '18px' }}>add_box</span>
              <h4 style={{ margin: 0, fontSize: '14px' }}>Register New Commodity Stock</h4>
            </div>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--clr-outline)', background: 'var(--clr-surface-container)', padding: '2px 6px', borderRadius: '4px' }}>
              LOT-{crop.toUpperCase()}-2026
            </span>
          </div>

          <form onSubmit={handleAddStock} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="grid-2" style={{ gap: '10px' }}>
              {/* Crop Selector */}
              <div className="form-group">
                <label className="form-label" htmlFor="stock-crop" style={{ fontSize: '10px', marginBottom: '3px' }}>Commodity Crop</label>
                <select id="stock-crop" className="form-select" value={crop} onChange={e => setCrop(e.target.value)} style={{ padding: '6px 8px', fontSize: '11px' }}>
                  <option value="wheat">Wheat (Premium)</option>
                  <option value="rice">Basmati Rice</option>
                  <option value="corn">Yellow Corn</option>
                  <option value="cotton">Shankar-6 Cotton</option>
                  <option value="soybean">Soybean Yellow</option>
                  <option value="sugarcane">Sugarcane Raw</option>
                  <option value="mustard">Mustard Seed</option>
                  <option value="groundnut">Groundnut Bold</option>
                  <option value="turmeric">Salem Turmeric</option>
                  <option value="chilli">Guntur Chilli Red</option>
                </select>
              </div>

              {/* Volume Input */}
              <div className="form-group">
                <label className="form-label" htmlFor="stock-quantity" style={{ fontSize: '10px', marginBottom: '3px' }}>Stock Volume (Tons)</label>
                <input id="stock-quantity" type="number" className="form-input" placeholder="e.g. 50" value={quantity} onChange={e => setQuantity(e.target.value)} min="1" required style={{ padding: '6px 8px', fontSize: '11px' }} />
              </div>

              {/* Purchase Price Input + Live Rate Autofill */}
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                  <label className="form-label" htmlFor="stock-price" style={{ fontSize: '10px', margin: 0 }}>Purchase Price (₹/Quintal)</label>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: 'var(--clr-primary)', cursor: 'pointer', fontSize: '10px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}
                    onClick={() => {
                      const matched = commodities.find(c => c.crop === crop);
                      if (matched) {
                        setPurchasePrice(matched.price.replace(/[^\d]/g, ''));
                        if (showToast) showToast(`Auto-filled live ${crop.toUpperCase()} price`, 'info');
                      }
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>bolt</span>
                    Auto-Fill Live Rate
                  </button>
                </div>
                <input id="stock-price" type="number" className="form-input" placeholder="e.g. 2400" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} min="1" required style={{ padding: '6px 8px', fontSize: '11px' }} />
              </div>

              {/* Facility Storage Terminal */}
              <div className="form-group">
                <label className="form-label" htmlFor="facility-terminal" style={{ fontSize: '10px', marginBottom: '3px' }}>Warehouse Terminal</label>
                <select id="facility-terminal" className="form-select" value={facilityTerminal} onChange={e => setFacilityTerminal(e.target.value)} style={{ padding: '6px 8px', fontSize: '11px' }}>
                  <option value="GJ-ColdStorage-1">GJ Cold Storage #1</option>
                  <option value="PB-Silo-North">PB APMC Silo Hub</option>
                  <option value="MH-Warehouse-3">MH Regional Vault #3</option>
                  <option value="EXIM-Port-Gateway">EXIM Port Gateway</option>
                </select>
              </div>

              {/* Quality & Moisture Grade */}
              <div className="form-group">
                <label className="form-label" htmlFor="quality-grade" style={{ fontSize: '10px', marginBottom: '3px' }}>Quality / Moisture Grade</label>
                <select id="quality-grade" className="form-select" value={qualityGrade} onChange={e => setQualityGrade(e.target.value)} style={{ padding: '6px 8px', fontSize: '11px' }}>
                  <option value="Grade A">Grade A (&lt; 9% Moisture)</option>
                  <option value="Grade B">Grade B (Standard 12%)</option>
                  <option value="Grade C">Grade C (Moisture Deficit)</option>
                </select>
              </div>

              {/* Target Holding Horizon */}
              <div className="form-group">
                <label className="form-label" htmlFor="holding-horizon" style={{ fontSize: '10px', marginBottom: '3px' }}>Target Holding Horizon</label>
                <select id="holding-horizon" className="form-select" value={holdingHorizon} onChange={e => setHoldingHorizon(e.target.value)} style={{ padding: '6px 8px', fontSize: '11px' }}>
                  <option value="1-3 Months">Short Term (1-3 Months)</option>
                  <option value="3-6 Months">Medium Horizon (3-6 Months)</option>
                  <option value="6-12 Months">Long Term Reserve (6-12 Months)</option>
                </select>
              </div>

              {/* Target Exit Price Goal */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                  <label className="form-label" htmlFor="target-price" style={{ fontSize: '10px', margin: 0 }}>Target Exit Price (₹/Qtl)</label>
                  {targetSellPrice && purchasePrice && (
                    <span style={{ fontSize: '9px', fontWeight: 700, color: Number(targetSellPrice) > Number(purchasePrice) ? 'var(--clr-secondary)' : 'var(--clr-error)' }}>
                      {(((Number(targetSellPrice) - Number(purchasePrice)) / Number(purchasePrice)) * 100).toFixed(1)}% Goal
                    </span>
                  )}
                </div>
                <input
                  id="target-price"
                  type="number"
                  className="form-input"
                  placeholder="e.g. 2750"
                  value={targetSellPrice}
                  onChange={e => setTargetSellPrice(e.target.value)}
                  style={{ padding: '6px 8px', fontSize: '11px' }}
                />
              </div>

              {/* Moisture Level Sensor Reading */}
              <div className="form-group">
                <label className="form-label" htmlFor="moisture-pct" style={{ fontSize: '10px', marginBottom: '3px' }}>Moisture Level Sensor (%)</label>
                <input
                  id="moisture-pct"
                  type="number"
                  step="0.1"
                  className="form-input"
                  placeholder="e.g. 9.5"
                  value={moisturePct}
                  onChange={e => setMoisturePct(e.target.value)}
                  style={{ padding: '6px 8px', fontSize: '11px' }}
                />
              </div>

              {/* Procurement Mandi Source */}
              <div className="form-group">
                <label className="form-label" htmlFor="procurement-source" style={{ fontSize: '10px', marginBottom: '3px' }}>Procurement Mandi Source</label>
                <select id="procurement-source" className="form-select" value={procurementSource} onChange={e => setProcurementSource(e.target.value)} style={{ padding: '6px 8px', fontSize: '11px' }}>
                  <option value="Direct APMC Mandi">Direct APMC Mandi Auction</option>
                  <option value="Contract Farming Alliance">Contract Farming Alliance</option>
                  <option value="Cooperative Federation">Cooperative Mandi Federation</option>
                </select>
              </div>

              {/* Storage Insurance Warranty */}
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label" htmlFor="insurance-policy" style={{ fontSize: '10px', marginBottom: '3px' }}>Storage Insurance & Protection Policy</label>
                <select id="insurance-policy" className="form-select" value={insurancePolicy} onChange={e => setInsurancePolicy(e.target.value)} style={{ padding: '6px 8px', fontSize: '11px' }}>
                  <option value="Comprehensive">Comprehensive Moisture & Fire Insurance</option>
                  <option value="Standard">Standard Mandi Transit Protection</option>
                  <option value="None">No Additional Storage Cover</option>
                </select>
              </div>
            </div>

            {/* Pre-take Risk Assessment UI */}
            {simulatorPreview && (
              <div style={{ padding: '10px', background: 'var(--clr-surface-container-low)', borderRadius: '6px', border: '1px solid var(--clr-outline-variant)', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: 'var(--clr-primary)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>shield_with_heart</span>
                  AI Pre-Take Risk & Impact Evaluation
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 10px', marginTop: '2px' }}>
                  <div>Total Cost: <strong>{fmtINR(simulatorPreview.cost)}</strong></div>
                  <div>Storage Decay Risk: <strong style={{ color: simulatorPreview.riskLevel === 'High' ? 'var(--clr-error)' : 'var(--clr-secondary)' }}>{simulatorPreview.decayRate}% / year ({simulatorPreview.riskLevel})</strong></div>
                  <div>New Portfolio Risk: <strong>{simulatorPreview.simulatedAvgRisk}%</strong></div>
                  <div>Capacity Check: <strong style={{ color: simulatorPreview.isCapacityExceeded ? 'var(--clr-error)' : 'var(--clr-secondary)' }}>{simulatorPreview.isCapacityExceeded ? 'EXCEEDED' : 'OK'}</strong></div>
                </div>
                {simulatorPreview.isCapacityExceeded && (
                  <div style={{ color: 'var(--clr-error)', fontWeight: 600, fontSize: '10px', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>error</span>
                    Warning: Purchase exceeds 400T storage terminal limit!
                  </div>
                )}
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-md" disabled={submitting || (simulatorPreview && simulatorPreview.isCapacityExceeded)} style={{ width: '100%', padding: '8px 12px', fontSize: '12px', marginTop: '4px' }}>
              {submitting ? (
                <><div className="spinner" style={{ width: '12px', height: '12px', borderTopColor: '#fff' }} /> Registering Stock...</>
              ) : (
                <><span className="material-symbols-outlined" style={{ fontSize: '14px' }}>add_to_photos</span>Add to Active Inventory</>
              )}
            </button>
          </form>
        </div>

        {/* Dynamic Risk Allocation & Live AI Core Terminal Logs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="card" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--clr-primary)', fontSize: '18px' }}>shield</span>
                <h4 style={{ margin: 0, fontSize: '14px' }}>AI Risk Exposure Mapping</h4>
              </div>
              <span className="badge" style={{
                fontSize: '10px',
                background: avgRiskPct > 60 ? 'var(--clr-error-container)' : 'var(--clr-secondary-container)',
                color: avgRiskPct > 60 ? 'var(--clr-error)' : 'var(--clr-secondary)',
                fontWeight: 700
              }}>
                Overall Portfolio Risk: {avgRiskPct}%
              </span>
            </div>
            
            <p style={{ fontSize: '11px', color: 'var(--clr-on-surface-variant)', margin: '0 0 12px 0' }}>
              Sorted by highest risk factors &amp; total asset valuation.
            </p>
            
            {/* Scroll Container showing 4 items in frame */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              maxHeight: '360px',
              overflowY: 'auto',
              paddingRight: '4px',
              cursor: 'pointer'
            }}>
              {sortedRiskInventory.map((item) => {
                const isHighRisk = item.risk.pct > 60;
                const decayAmount = Math.round(item.totalValue * item.risk.decayCoeff);
                
                return (
                  <div key={item.crop} style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'var(--clr-surface-container-low)',
                    border: `1px solid ${isHighRisk ? 'rgba(239, 68, 68, 0.25)' : 'var(--clr-outline-variant)'}`,
                    transition: 'all 0.2s ease'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '14px', color: isHighRisk ? 'var(--clr-error)' : 'var(--clr-primary)' }}>
                          {isHighRisk ? 'warning' : 'eco'}
                        </span>
                        <span style={{ fontWeight: 700, color: 'var(--clr-on-surface)' }}>{item.crop.toUpperCase()}</span>
                        <span style={{ fontSize: '10px', color: 'var(--clr-outline)' }}>({item.quantity} Tons)</span>
                        <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--clr-primary)', marginLeft: '4px' }}>
                          {fmtINR(item.totalValue)}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '10px', color: 'var(--clr-outline)', fontFamily: 'var(--font-mono)' }}>
                          Decay Est: {fmtINR(decayAmount)}/yr
                        </span>
                        <span style={{ fontWeight: 700, color: isHighRisk ? 'var(--clr-error)' : 'var(--clr-primary)' }}>
                          {item.risk.pct}% Risk ({item.risk.level})
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="progress-bar" style={{ height: '5px', marginBottom: '6px' }}>
                      <div className="progress-fill" style={{
                        width: `${item.risk.pct}%`,
                        background: isHighRisk ? 'var(--clr-error)' : 'var(--clr-primary)'
                      }} />
                    </div>

                    {/* Risk Rationale & Action Trigger */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: 'var(--clr-on-surface-variant)', marginTop: '4px' }}>
                      <span style={{ flex: 1, paddingRight: '8px', fontStyle: 'italic' }}>
                        💡 {item.risk.reason}
                      </span>
                      
                      {isHighRisk && (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '9px', padding: '2px 6px', color: 'var(--clr-error)', borderColor: 'var(--clr-error)' }}
                          onClick={(e) => { e.stopPropagation(); handleLiquidate(item.crop, Math.round(item.quantity * 0.5)); }}
                          title="Liquidate 50% high risk inventory position"
                        >
                          ⚡ Risk Hedge 50%
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {sortedRiskInventory.length === 0 && (
                <div style={{ textAlign: 'center', padding: '16px', color: 'var(--clr-outline)', fontSize: '11px' }}>
                  No active stock holding to map risk.
                </div>
              )}
            </div>

            {/* View More Frame Bar */}
            {sortedRiskInventory.length > 4 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--clr-outline-variant)', paddingTop: '10px', marginTop: '10px', fontSize: '10px', color: 'var(--clr-outline)' }}>
                <span>Showing top 4 high-risk assets in frame</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--clr-primary)', fontWeight: 600, cursor: 'pointer' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>unfold_more</span>
                  Scroll to view {sortedRiskInventory.length - 4} more
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stock Inventory Table */}
      <div className="card" style={{ marginTop: '16px', overflow: 'hidden', padding: 0 }}>
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--clr-outline-variant)',
          background: 'var(--clr-surface-bright)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: '10px',
        }}>
          <h3 style={{ margin: 0 }}>Stock Monitoring Ledger</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={styles.chipRow}>
              {['All', 'Hold', 'Reduce', 'Liquidate'].map(t => (
                <button
                  key={t}
                  style={styles.chip(filter === t)}
                  onClick={() => setFilter(t)}
                >
                  {t}
                </button>
              ))}
            </div>
            {/* Search */}
            <div style={styles.searchWrap}>
              <span className="material-symbols-outlined" style={styles.searchIcon}>search</span>
              <input
                type="text"
                placeholder="Search stock..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={styles.searchInput}
              />
            </div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" aria-label="Stock inventory levels ledger">
            <thead>
              <tr>
                <th style={{ width: '28px' }}></th>
                <th>Crop Commodity</th>
                <th>Holding Vol</th>
                <th style={{ textAlign: 'right' }}>Avg Cost</th>
                <th style={{ textAlign: 'right' }}>Live Exchange Rate</th>
                <th style={{ textAlign: 'center' }}>AI Tomorrow Forecast</th>
                <th style={{ textAlign: 'right' }}>Total Valuation</th>
                <th style={{ textAlign: 'center' }}>AI Suggestion Status</th>
                <th style={{ textAlign: 'center' }}>Optimization Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--clr-outline)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '32px', display: 'block', marginBottom: '8px', opacity: 0.4 }}>inventory_2</span>
                    No active stock logs registered.
                  </td>
                </tr>
              )}
              {filteredInventory.map((item) => (
                <React.Fragment key={item.crop}>
                  <tr
                    style={{ cursor: 'pointer', transition: 'background 0.15s' }}
                    onClick={() => setExpanded(expanded === item.crop ? null : item.crop)}
                  >
                    <td style={{ padding: '12px 8px 12px 16px', width: '28px' }}>
                      <span className="material-symbols-outlined" style={{
                        fontSize: '18px',
                        color: 'var(--clr-outline)',
                        transform: expanded === item.crop ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                        display: 'inline-block',
                      }}>chevron_right</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{item.crop.toUpperCase()}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{item.quantity} Tons</td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmtINR(item.purchasePrice)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--clr-primary)' }}>{item.currentPrice}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${item.forecastTrend === 'UP' ? 'badge-bullish' : 'badge-bearish'}`}>
                        <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>
                          {item.forecastTrend === 'UP' ? 'trending_up' : 'trending_down'}
                        </span>
                        {item.forecastTrend} ({item.confidence}%)
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{fmtINR(item.totalValue)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${item.recommendation === 'LIQUIDATE' ? 'badge-bearish' :
                        item.recommendation === 'REDUCE' ? 'badge-neutral' :
                          'badge-bullish'
                        }`}>
                        {item.recommendation}
                      </span>
                    </td>
                    {/* Optimization Action column containing add stock and remove stock inputs and buttons */}
                    <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                      <div style={styles.actionGroup}>
                        <input
                          type="number"
                          placeholder="Tons"
                          style={styles.miniInput}
                          value={adjustQty[item.crop] || ''}
                          onChange={e => setAdjustQty({ ...adjustQty, [item.crop]: e.target.value })}
                        />
                        <button
                          style={{ ...styles.actionBtn(false), padding: '4px 8px' }}
                          onClick={() => handleQuickAdjust(item.crop, 'ADD')}
                          title="Quick Add Stock Volume"
                        >
                          Add
                        </button>
                        <button
                          style={{ ...styles.actionBtn(true), padding: '4px 8px' }}
                          onClick={() => handleQuickAdjust(item.crop, 'SELL')}
                          title="Quick Sell Stock Volume"
                        >
                          Sell
                        </button>
                        {item.suggestAmount > 0 && (
                          <button
                            style={{ ...styles.actionBtn(item.recommendation === 'LIQUIDATE'), background: item.recommendation === 'LIQUIDATE' ? 'var(--clr-error)' : 'var(--clr-primary)', color: '#fff', border: 'none', padding: '4px 8px', marginLeft: '4px' }}
                            onClick={() => handleLiquidate(item.crop, item.suggestAmount)}
                            title="Execute AI suggestion"
                          >
                            Suggest: {item.recommendation === 'LIQUIDATE' ? 'Liquidate' : 'Reduce'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Expandable Detail Section */}
                  <tr>
                    <td colSpan={9} style={{ padding: 0, border: 'none' }}>
                      <div style={styles.expandRow(expanded === item.crop)}>
                        <div style={styles.detailGrid}>
                          <div>
                            <div style={styles.detailLabel}>Crop Risk Profile</div>
                            <div style={{ ...styles.detailValue, fontWeight: 700, color: item.risk.pct > 60 ? 'var(--clr-error)' : 'var(--clr-secondary)' }}>
                              {item.risk.level} Risk Rating ({item.risk.pct}%)
                            </div>
                            <p style={{ fontSize: '12px', color: 'var(--clr-on-surface-variant)', marginTop: '8px', lineHeight: '1.4' }}>
                              {item.risk.reason}
                            </p>
                          </div>
                          <div style={{ background: 'var(--clr-surface-container-highest)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                              <span className="material-symbols-outlined" style={{ color: 'var(--clr-primary)' }}>psychology</span>
                              <span style={{ fontWeight: 600, fontSize: '13px' }}>AI Optimizer Logic Feed</span>
                            </div>
                            <p style={{ fontSize: '12px', margin: 0, lineHeight: '1.5', color: 'var(--clr-on-surface)' }}>
                              {item.suggestionText}
                            </p>
                            {item.pnl !== 0 && (
                              <div style={{ marginTop: '12px', fontSize: '12px', display: 'flex', gap: '12px' }}>
                                <span>Unrealized P&L:</span>
                                <strong style={{ color: item.pnl >= 0 ? 'var(--clr-secondary)' : 'var(--clr-error)' }}>
                                  {item.pnl >= 0 ? '+' : ''}{fmtINR(item.pnl)} ({item.pnlPercent.toFixed(2)}%)
                                </strong>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
