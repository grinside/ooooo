import api from './api';

const affiliateService = {
  // Authentication
  register: async (data) => {
    const response = await api.post('/affiliates/register', data);
    return response.data;
  },

  login: async (phone, pin) => {
    const response = await api.post('/affiliates/login', { phone, pin });
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/affiliates/logout');
    return response.data;
  },

  requestOTP: async (phone) => {
    const response = await api.post('/affiliates/request-otp', { phone });
    return response.data;
  },

  verifyOTP: async (phone, otp) => {
    const response = await api.post('/affiliates/verify-otp', { phone, otp });
    return response.data;
  },

  resetPin: async (phone, otp, newPin) => {
    const response = await api.post('/affiliates/reset-pin', {
      phone,
      otp,
      new_pin: newPin,
    });
    return response.data;
  },

  // Profile
  getProfile: async () => {
    const response = await api.get('/affiliates/profile');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put('/affiliates/profile', data);
    return response.data;
  },

  changePin: async (oldPin, newPin) => {
    const response = await api.post('/affiliates/change-pin', {
      old_pin: oldPin,
      new_pin: newPin,
    });
    return response.data;
  },

  updateBankAccount: async (data) => {
    const response = await api.post('/affiliates/bank-account', data);
    return response.data;
  },

  // Dashboard & Statistics
  getDashboard: async () => {
    const response = await api.get('/affiliates/dashboard');
    return response.data;
  },

  getStats: async (period = '30d') => {
    const response = await api.get('/affiliates/stats', {
      params: { period },
    });
    return response.data;
  },

  getSalesChart: async (period = '30d') => {
    const response = await api.get('/affiliates/stats/sales-chart', {
      params: { period },
    });
    return response.data;
  },

  getCommissionsChart: async (period = '30d') => {
    const response = await api.get('/affiliates/stats/commissions-chart', {
      params: { period },
    });
    return response.data;
  },

  // Network
  getNetwork: async (params = {}) => {
    const response = await api.get('/affiliates/network', { params });
    return response.data;
  },

  getNetworkTree: async () => {
    const response = await api.get('/affiliates/network/tree');
    return response.data;
  },

  getNetworkStats: async () => {
    const response = await api.get('/affiliates/network/stats');
    return response.data;
  },

  // Commissions
  getCommissions: async (params = {}) => {
    const response = await api.get('/affiliates/commissions', { params });
    return response.data;
  },

  getCommissionDetails: async (id) => {
    const response = await api.get(`/affiliates/commissions/${id}`);
    return response.data;
  },

  // Payouts
  getPayouts: async (params = {}) => {
    const response = await api.get('/affiliates/payouts', { params });
    return response.data;
  },

  requestPayout: async (data) => {
    const response = await api.post('/affiliates/payouts/request', data);
    return response.data;
  },

  getPayoutDetails: async (id) => {
    const response = await api.get(`/affiliates/payouts/${id}`);
    return response.data;
  },

  // QR Code & Links
  getQRCode: async () => {
    const response = await api.get('/affiliates/qr-code');
    return response.data;
  },

  getAffiliateLink: async () => {
    const response = await api.get('/affiliates/link');
    return response.data;
  },

  // Sponsor validation
  validateSponsor: async (code) => {
    const response = await api.post('/affiliates/validate-sponsor', { code });
    return response.data;
  },

  // Sales
  getSales: async (params = {}) => {
    const response = await api.get('/affiliates/sales', { params });
    return response.data;
  },

  getSaleDetails: async (id) => {
    const response = await api.get(`/affiliates/sales/${id}`);
    return response.data;
  },
};

export default affiliateService;
