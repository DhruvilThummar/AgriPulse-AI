import { apiClient } from './apiClient';

export const authService = {
  /**
   * Log in user with email & password
   */
  async login(email, password) {
    return apiClient('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  /**
   * Register new user account
   */
  async signup(name, email, password) {
    return apiClient('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  },

  /**
   * Verify email via 6-digit OTP
   */
  async verifyOtp(email, otp) {
    return apiClient('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  },

  /**
   * Request password reset OTP email
   */
  async forgotPassword(email) {
    return apiClient('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  /**
   * Submit new password with OTP reset token
   */
  async resetPassword(email, otp, newPassword) {
    return apiClient('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword }),
    });
  },

  /**
   * Clear session state across storage mechanisms
   */
  clearSession() {
    localStorage.removeItem('agripulse_token');
    localStorage.removeItem('agripulse_user');
    sessionStorage.removeItem('agripulse_token');
    sessionStorage.removeItem('agripulse_user');
    document.cookie = "agripulse_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "agripulse_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  },

  /**
   * Save session token and user data
   */
  saveSession(user, token) {
    localStorage.setItem('agripulse_token', token);
    localStorage.setItem('agripulse_user', JSON.stringify(user));
    sessionStorage.setItem('agripulse_token', token);
    sessionStorage.setItem('agripulse_user', JSON.stringify(user));
    document.cookie = `agripulse_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
    document.cookie = `agripulse_user=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
  }
};
