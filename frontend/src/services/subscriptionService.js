import api from './api';

const subscriptionService = {
  // Offers
  getOffers: async (params = {}) => {
    const response = await api.get('/offers', { params });
    return response.data;
  },

  getOffer: async (id) => {
    const response = await api.get(`/offers/${id}`);
    return response.data;
  },

  getOffersByCountry: async (country) => {
    const response = await api.get('/offers', {
      params: { country, active: true },
    });
    return response.data;
  },

  // Affiliate validation
  validateAffiliateCode: async (code) => {
    const response = await api.post('/affiliates/validate', { code });
    return response.data;
  },

  // Subscription creation
  createSubscription: async (data) => {
    const response = await api.post('/subscriptions', data);
    return response.data;
  },

  // Payment
  initiatePayment: async (subscriptionId, paymentData) => {
    const response = await api.post(
      `/subscriptions/${subscriptionId}/payment`,
      paymentData
    );
    return response.data;
  },

  checkPaymentStatus: async (subscriptionId) => {
    const response = await api.get(
      `/subscriptions/${subscriptionId}/payment/status`
    );
    return response.data;
  },

  verifyPayment: async (subscriptionId, paymentReference) => {
    const response = await api.post(
      `/subscriptions/${subscriptionId}/payment/verify`,
      { payment_reference: paymentReference }
    );
    return response.data;
  },

  // Subscription details
  getSubscription: async (reference) => {
    const response = await api.get(`/subscriptions/${reference}`);
    return response.data;
  },

  getSubscriptionByPhone: async (phone) => {
    const response = await api.post('/subscriptions/lookup', { phone });
    return response.data;
  },

  // Subscription activation
  activateSubscription: async (subscriptionId) => {
    const response = await api.post(
      `/subscriptions/${subscriptionId}/activate`
    );
    return response.data;
  },

  // Countries & Payment Providers
  getCountries: async () => {
    const response = await api.get('/countries');
    return response.data;
  },

  getPaymentProviders: async (country) => {
    const response = await api.get('/payment-providers', {
      params: { country },
    });
    return response.data;
  },

  // Webhooks (for testing)
  simulateWebhook: async (subscriptionId, status) => {
    const response = await api.post('/webhooks/simulate', {
      subscription_id: subscriptionId,
      status,
    });
    return response.data;
  },
};

export default subscriptionService;
