/**
 * ════════════════════════════════════════════════════════════
 * FILE: chatRoutes.js
 * WHERE IT IS: node-auth-backend/src/routes/chatRoutes.js
 * WHAT IT DOES: Provides the API endpoint POST /api/chat/query
 *               for the interactive AgriChatbot widget.
 * ════════════════════════════════════════════════════════════
 */

const express = require('express');
const router = express.Router();

const AGRI_RESPONSES = [
  {
    keywords: ['pest', 'disease', 'insect', 'yellow', 'blight', 'spot', 'caterpillar', 'aphid', 'rust', 'leaves', 'treat'],
    reply: `🐛 **AgriCast Crop Protection Advisory**\n\n1. **Diagnosis**: Symptoms indicate potential fungal pathogen or aphid activity.\n2. **Immediate Action**:\n   - **Organic**: Apply Neem Oil spray (5ml per Liter water with mild soap).\n   - **Chemical**: For severe leaf spot, use Azoxystrobin (1ml/L) or Chlorpyrifos as per APMC safety limits.\n3. **Field Tip**: Avoid spraying during high heat hours and ensure proper field drainage.`
  },
  {
    keywords: ['fertilizer', 'urea', 'dap', 'npk', 'potash', 'dose', 'acre', 'soil', 'ratio', 'nutrient'],
    reply: `🌱 **Nutrient Management & Fertilizer Dosing**\n\n1. **Basal Application**: Apply 100% DAP and 50% MOP during seedbed preparation.\n2. **Split Nitrogen Dosing**: Apply Urea in 3 equal splits (at Sowing, Tillering, and Heading stage).\n3. **Micronutrients**: Add Zinc Sulphate (10 kg/acre) to boost crop vigor.`
  },
  {
    keywords: ['wheat', 'basmati', 'rice', 'paddy', 'cotton', 'crop', 'mandi', 'sell', 'price', 'trend', 'predict', 'forecast'],
    reply: `🌾 **AgriCast Mandi Price Intelligence**\n\n- **Market Analysis**: Demand remains steady across APMC corridors with manageable arrival volumes.\n- **Selling Strategy**: Stagger mandi sales over a 2-to-3 week window post-harvest to capture peak spot premiums.\n- **Moisture Standard**: Maintain grain moisture below 12-14% before storage to prevent quality deductions.`
  },
  {
    keywords: ['weather', 'monsoon', 'rain', 'humidity', 'drought', 'storm', 'heat', 'storage', 'godown'],
    reply: `🌤️ **AgriCast Micro-Climate Telemetry**\n\n- **Atmospheric Index**: High relative humidity (>85%) increases fungal risk in grain godowns.\n- **Advisory**: Ensure aeration fans are running in storage facilities. Pause open field irrigation if rain probability >60%.`
  }
];

router.post('/query', (req, res) => {
  try {
    const { question } = req.body || {};
    const qLower = (question || '').toLowerCase().trim();

    let answer = `🤖 **AgriCast AI Assistant Telemetry**\n\nOur GBDT machine learning model predicts favorable price dynamics across APMC Mandis.\n\nFor specialized crop protection, fertilizer planning, or weather advisories, ask a specific question or tap a quick prompt chip!`;

    for (const item of AGRI_RESPONSES) {
      if (item.keywords.some(kw => qLower.includes(kw))) {
        answer = item.reply;
        break;
      }
    }

    return res.status(200).json({ success: true, answer });
  } catch (error) {
    console.error('Chat query error:', error);
    return res.status(500).json({ success: false, error: 'Internal chat assistant error' });
  }
});

module.exports = router;
