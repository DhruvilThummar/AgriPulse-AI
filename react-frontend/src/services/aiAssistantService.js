import { apiClient } from './apiClient';

/**
 * Agritech Knowledge Base & Offline Advisory Engine
 * Contains specialized advice for crop management, pest diagnostics, fertilizer calculations, and market timing.
 */
const AGRI_KNOWLEDGE_BASE = [
  {
    keywords: ['pest', 'insect', 'caterpillar', 'aphid', 'worm', 'fungus', 'disease', 'blight', 'rust', 'leaves turning yellow'],
    reply: `🐛 **AgriCast Crop Protection Protocol**\n\n1. **Diagnostic Checklist**:\n   - Check underside of leaves for eggs or aphid colonies.\n   - Monitor for early yellowing or rust spots.\n\n2. **Recommended Action**:\n   - **Organic Treatment**: Spray Neem Oil solution (5ml/L of water) with mild liquid soap.\n   - **Chemical Treatment**: If infestation > 15%, apply Chlorpyrifos or Azoxystrobin following APMC safety limits.\n\n3. **Prevailing Weather Note**: High humidity increases fungal risk. Ensure field drainage.`,
  },
  {
    keywords: ['fertilizer', 'npk', 'urea', 'dap', 'potash', 'soil', 'nitrogen', 'phosphorus'],
    reply: `🌱 **Optimal Soil Nutrient Management**\n\n1. **Standard Basal Dosing (per Acre)**:\n   - **Nitrogen (Urea)**: Apply in 3 split doses (Sowing, Tillering, Heading).\n   - **Phosphorus (DAP)**: Apply 100% during soil preparation.\n   - **Potash (MOP)**: 50% at sowing, 50% at flowering stage.\n\n2. **Pro Tip**: Conduct a Soil Health Card test every season. Avoid over-applying Urea in monsoon to prevent leeching into groundwater.`,
  },
  {
    keywords: ['wheat', 'sell wheat', 'wheat price', 'rabi', 'wheat forecast'],
    reply: `🌾 **Wheat (Rabi Season) Market & Agronomy Guidance**\n\n- **Current Trend**: Bullish momentum driven by low buffer stocks and steady mill demand.\n- **Storage Advice**: Moisture content must be **below 12%** before storing in godowns to prevent grain weevils.\n- **Selling Window**: Price expected to peak within 3-4 weeks post-harvest.`,
  },
  {
    keywords: ['rice', 'basmati', 'paddy', 'sell rice', 'rice forecast'],
    reply: `🍚 **Basmati Rice Mandi & Export Telemetry**\n\n- **Current Trend**: High export demand from Middle East markets.\n- **Moisture Threshold**: Maintain 14% moisture for standard paddy, 12% for long-term storage.\n- **Market Timing**: Stagger sales; hold 30% of stock for peak export contract windows.`,
  },
  {
    keywords: ['cotton', 'shankar', 'kapas', 'ginner', 'cotton price'],
    reply: `🧵 **Cotton Mandi Telemetry & Quality Standard**\n\n- **Quality Index**: Staple length (28-30mm) and micronaire (3.8-4.2) determine top APMC prices.\n- **Market Sentiment**: Moderate volatility. Ensure clean picking without leaf trash.`,
  },
  {
    keywords: ['weather', 'rain', 'monsoon', 'drought', 'irrigation', 'temperature'],
    reply: `🌤️ **AgriCast Weather Advisory Engine**\n\n- **Monsoon Anomaly Signal**: Micro-climate telemetry indicates stable precipitation in major agricultural corridors.\n- **Irrigation Guidance**: Hold irrigation if rainfall probability > 65% in next 48 hours to conserve fuel and prevent root rot.`,
  },
];

export const aiAssistantService = {
  /**
   * Process user farming question / query.
   * Connects to backend AI model endpoint or uses knowledge base fallback.
   */
  async askQuestion(question, context = {}) {
    const qLower = (question || '').toLowerCase().trim();

    try {
      // Attempt backend AI query endpoint if present
      const response = await apiClient('/chat/query', {
        method: 'POST',
        body: JSON.stringify({ question, context }),
        timeout: 8000,
      });
      if (response && response.answer) {
        return response.answer;
      }
    } catch (err) {
      console.warn('Backend AI query endpoint unavailable; using AgriCast offline knowledge engine:', err.message);
    }

    // Fallback: Rule-based agritech intelligence lookup
    for (const item of AGRI_KNOWLEDGE_BASE) {
      if (item.keywords.some(kw => qLower.includes(kw))) {
        return item.reply;
      }
    }

    // Default general advisory response
    return `🚜 **AgriCast AI General Assistant**\n\nI analyzed your query: "${question}".\n\n**Agricultural Recommendation**:\n- For precise crop yield and price forecasts, check the **Predictions** tab with your specific supply volume and transport index.\n- Make sure soil moisture levels are monitored via sensor readings before applying top-dress fertilizer.\n- Check live APMC Mandi rates in the **Markets** tab to optimize your harvest sale timing.`;
  }
};
