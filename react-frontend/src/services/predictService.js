import { apiClient } from './apiClient';

export const predictService = {
  /**
   * Run ML Ensemble prediction
   */
  async runPrediction(params) {
    return apiClient('/predict', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  /**
   * Get Pandas Data Analytics (Unit 1 & 10)
   */
  async getAnalytics() {
    return apiClient('/predict/analytics', { method: 'GET' });
  },

  /**
   * Get Scikit-Learn Model Summary & Metrics (Unit 3-5 & 10)
   */
  async getModelSummary() {
    return apiClient('/predict/summary', { method: 'GET' });
  },

  /**
   * Get prediction history log
   */
  async getHistory() {
    return apiClient('/predict/history', { method: 'GET' });
  },

  /**
   * Clear all prediction history
   */
  async clearAllHistory() {
    return apiClient('/predict/history', { method: 'DELETE' });
  },

  /**
   * Delete single prediction log item by ID
   */
  async deleteHistoryItem(id) {
    return apiClient(`/predict/history/${id}`, { method: 'DELETE' });
  }
};
