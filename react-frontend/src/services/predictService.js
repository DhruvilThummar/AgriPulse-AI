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
