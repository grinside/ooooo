import api from './api';

const adminService = {
  // Authentication
  login: async (email, password) => {
    const response = await api.post('/admin/login', { email, password });
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/admin/logout');
    return response.data;
  },

  // Dashboard
  getDashboard: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  getSystemStats: async (period = '30d') => {
    const response = await api.get('/admin/stats', {
      params: { period },
    });
    return response.data;
  },

  // Affiliates Management
  getAffiliates: async (params = {}) => {
    const response = await api.get('/admin/affiliates', { params });
    return response.data;
  },

  getAffiliate: async (id) => {
    const response = await api.get(`/admin/affiliates/${id}`);
    return response.data;
  },

  approveAffiliate: async (id) => {
    const response = await api.post(`/admin/affiliates/${id}/approve`);
    return response.data;
  },

  suspendAffiliate: async (id, reason) => {
    const response = await api.post(`/admin/affiliates/${id}/suspend`, {
      reason,
    });
    return response.data;
  },

  activateAffiliate: async (id) => {
    const response = await api.post(`/admin/affiliates/${id}/activate`);
    return response.data;
  },

  verifyAffiliate: async (id) => {
    const response = await api.post(`/admin/affiliates/${id}/verify`);
    return response.data;
  },

  updateAffiliate: async (id, data) => {
    const response = await api.put(`/admin/affiliates/${id}`, data);
    return response.data;
  },

  getAffiliateStats: async (id, period = '30d') => {
    const response = await api.get(`/admin/affiliates/${id}/stats`, {
      params: { period },
    });
    return response.data;
  },

  getAffiliateNetwork: async (id) => {
    const response = await api.get(`/admin/affiliates/${id}/network`);
    return response.data;
  },

  // Subscriptions Management
  getSubscriptions: async (params = {}) => {
    const response = await api.get('/admin/subscriptions', { params });
    return response.data;
  },

  getSubscription: async (id) => {
    const response = await api.get(`/admin/subscriptions/${id}`);
    return response.data;
  },

  updateSubscription: async (id, data) => {
    const response = await api.put(`/admin/subscriptions/${id}`, data);
    return response.data;
  },

  cancelSubscription: async (id, reason) => {
    const response = await api.post(`/admin/subscriptions/${id}/cancel`, {
      reason,
    });
    return response.data;
  },

  refundSubscription: async (id, amount, reason) => {
    const response = await api.post(`/admin/subscriptions/${id}/refund`, {
      amount,
      reason,
    });
    return response.data;
  },

  // Payouts Management
  getPayouts: async (params = {}) => {
    const response = await api.get('/admin/payouts', { params });
    return response.data;
  },

  getPayout: async (id) => {
    const response = await api.get(`/admin/payouts/${id}`);
    return response.data;
  },

  approvePayout: async (id) => {
    const response = await api.post(`/admin/payouts/${id}/approve`);
    return response.data;
  },

  rejectPayout: async (id, reason) => {
    const response = await api.post(`/admin/payouts/${id}/reject`, { reason });
    return response.data;
  },

  completePayout: async (id, transactionReference) => {
    const response = await api.post(`/admin/payouts/${id}/complete`, {
      transaction_reference: transactionReference,
    });
    return response.data;
  },

  batchProcessPayouts: async (payoutIds) => {
    const response = await api.post('/admin/payouts/batch-process', {
      payout_ids: payoutIds,
    });
    return response.data;
  },

  // Offers Management
  getOffers: async (params = {}) => {
    const response = await api.get('/admin/offers', { params });
    return response.data;
  },

  getOffer: async (id) => {
    const response = await api.get(`/admin/offers/${id}`);
    return response.data;
  },

  createOffer: async (data) => {
    const response = await api.post('/admin/offers', data);
    return response.data;
  },

  updateOffer: async (id, data) => {
    const response = await api.put(`/admin/offers/${id}`, data);
    return response.data;
  },

  deleteOffer: async (id) => {
    const response = await api.delete(`/admin/offers/${id}`);
    return response.data;
  },

  toggleOfferStatus: async (id) => {
    const response = await api.post(`/admin/offers/${id}/toggle-status`);
    return response.data;
  },

  // Reports
  getSalesReport: async (params = {}) => {
    const response = await api.get('/admin/reports/sales', { params });
    return response.data;
  },

  getCommissionsReport: async (params = {}) => {
    const response = await api.get('/admin/reports/commissions', { params });
    return response.data;
  },

  getAffiliatesReport: async (params = {}) => {
    const response = await api.get('/admin/reports/affiliates', { params });
    return response.data;
  },

  getPayoutsReport: async (params = {}) => {
    const response = await api.get('/admin/reports/payouts', { params });
    return response.data;
  },

  exportReport: async (type, params = {}) => {
    const response = await api.get(`/admin/reports/${type}/export`, {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  // System & Queue Management
  getQueueStatus: async () => {
    const response = await api.get('/admin/system/queue-status');
    return response.data;
  },

  getFailedJobs: async (params = {}) => {
    const response = await api.get('/admin/system/failed-jobs', { params });
    return response.data;
  },

  retryFailedJob: async (id) => {
    const response = await api.post(`/admin/system/failed-jobs/${id}/retry`);
    return response.data;
  },

  deleteFailedJob: async (id) => {
    const response = await api.delete(`/admin/system/failed-jobs/${id}`);
    return response.data;
  },

  getSystemHealth: async () => {
    const response = await api.get('/admin/system/health');
    return response.data;
  },

  clearCache: async (type = 'all') => {
    const response = await api.post('/admin/system/clear-cache', { type });
    return response.data;
  },

  // Activity Logs
  getActivityLogs: async (params = {}) => {
    const response = await api.get('/admin/activity-logs', { params });
    return response.data;
  },

  // Settings
  getSettings: async () => {
    const response = await api.get('/admin/settings');
    return response.data;
  },

  updateSettings: async (data) => {
    const response = await api.put('/admin/settings', data);
    return response.data;
  },
};

export default adminService;
