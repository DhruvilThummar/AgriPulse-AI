import { apiClient } from './apiClient';

export const marketService = {
  /**
   * Fetch live scraped APMC commodity prices
   */
  async getLivePrices() {
    return apiClient('/commodity-prices', { method: 'GET' });
  },

  /**
   * Trigger email alert subscription via Nodemailer
   */
  async subscribeAlerts(email) {
    return apiClient('/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }
};
