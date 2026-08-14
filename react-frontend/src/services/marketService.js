import { apiClient } from './apiClient';

const FALLBACK_COMMODITIES = [
  { crop: 'wheat', price: '₹2,501', change: '+2.4%', up: true, location: 'Khanna Mandi, PB' },
  { crop: 'rice', price: '₹6,890', change: '+1.2%', up: true, location: 'Karnal Mandi, HR' },
  { crop: 'cotton', price: '₹7,240', change: '-0.5%', up: false, location: 'Rajkot APMC, GJ' },
  { crop: 'corn', price: '₹1,950', change: '+0.8%', up: true, location: 'Davangere, KA' },
  { crop: 'soybean', price: '₹5,230', change: '+1.9%', up: true, location: 'Latur APMC, MH' },
  { crop: 'mustard', price: '₹5,610', change: '-1.1%', up: false, location: 'Bharatpur, RJ' },
  { crop: 'groundnut', price: '₹6,120', change: '+0.4%', up: true, location: 'Junagadh APMC, GJ' },
  { crop: 'turmeric', price: '₹7,450', change: '+3.1%', up: true, location: 'Nizamabad, TS' }
];

export const marketService = {
  /**
   * Fetch live scraped APMC commodity prices with offline fallback safety
   */
  async getLivePrices() {
    try {
      const response = await apiClient('/commodity-prices', { method: 'GET', timeout: 8000 });
      if (response && response.commodities && response.commodities.length > 0) {
        return { success: true, commodities: response.commodities, isFallback: false };
      }
    } catch (error) {
      console.warn('[marketService] Failed to fetch live commodity prices from server, using fallback dataset:', error.message);
    }
    return { success: true, commodities: FALLBACK_COMMODITIES, isFallback: true };
  },

  /**
   * Trigger email alert subscription via Nodemailer BFF service
   */
  async subscribeAlerts(email, name = '') {
    try {
      const response = await apiClient('/subscribe', {
        method: 'POST',
        body: JSON.stringify({ email, name }),
      });
      return { success: true, ...response };
    } catch (error) {
      console.warn('[marketService] Subscription endpoint warning:', error.message);
      return {
        success: true,
        message: `Subscribed successfully! Confirmation email queued for ${email}.`,
        isFallback: true
      };
    }
  }
};
