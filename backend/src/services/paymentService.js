import axios from 'axios';
import crypto from 'crypto';
import { PaymentError, ExternalAPIError } from '../utils/errors.js';
import logger from '../utils/logger.js';

/**
 * Payment Service - Handles integrations with mobile money providers
 * Supports: Orange Money, Wave, MTN Mobile Money, Stripe
 */
class PaymentService {
  constructor() {
    this.providers = {
      orange_money: this.initOrangeMoney(),
      wave: this.initWave(),
      mtn_momo: this.initMTNMoMo(),
      stripe: this.initStripe()
    };
  }

  /**
   * Initialize Orange Money configuration
   */
  initOrangeMoney() {
    return {
      apiKey: process.env.ORANGE_MONEY_API_KEY,
      apiSecret: process.env.ORANGE_MONEY_API_SECRET,
      merchantId: process.env.ORANGE_MONEY_MERCHANT_ID,
      baseUrl: process.env.ORANGE_MONEY_BASE_URL || 'https://api.orange.com/orange-money-webpay/dev/v1',
      enabled: !!process.env.ORANGE_MONEY_API_KEY
    };
  }

  /**
   * Initialize Wave configuration
   */
  initWave() {
    return {
      apiKey: process.env.WAVE_API_KEY,
      secretKey: process.env.WAVE_SECRET_KEY,
      baseUrl: process.env.WAVE_BASE_URL || 'https://api.wave.com/v1',
      enabled: !!process.env.WAVE_API_KEY
    };
  }

  /**
   * Initialize MTN Mobile Money configuration
   */
  initMTNMoMo() {
    return {
      apiKey: process.env.MTN_MOMO_API_KEY,
      apiSecret: process.env.MTN_MOMO_API_SECRET,
      userId: process.env.MTN_MOMO_USER_ID,
      baseUrl: process.env.MTN_MOMO_BASE_URL || 'https://sandbox.momodeveloper.mtn.com',
      enabled: !!process.env.MTN_MOMO_API_KEY
    };
  }

  /**
   * Initialize Stripe configuration
   */
  initStripe() {
    return {
      secretKey: process.env.STRIPE_SECRET_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      enabled: !!process.env.STRIPE_SECRET_KEY
    };
  }

  /**
   * Process payment based on provider
   */
  async processPayment(paymentData) {
    const { provider, amount, currency, phone, reference, metadata = {} } = paymentData;

    logger.logPayment('initiated', {
      provider,
      amount,
      currency,
      reference,
      phone: this.maskPhone(phone)
    });

    try {
      let result;

      switch (provider) {
        case 'orange_money':
          result = await this.processOrangeMoney(paymentData);
          break;
        case 'wave':
          result = await this.processWave(paymentData);
          break;
        case 'mtn_momo':
          result = await this.processMTNMoMo(paymentData);
          break;
        case 'stripe':
          result = await this.processStripe(paymentData);
          break;
        default:
          throw new PaymentError(`Unsupported payment provider: ${provider}`, 'UNSUPPORTED_PROVIDER');
      }

      logger.logPayment('success', {
        provider,
        reference,
        transactionId: result.transactionId
      });

      return result;
    } catch (error) {
      logger.logError(error, {
        context: 'payment_processing',
        provider,
        reference
      });

      if (error instanceof PaymentError) {
        throw error;
      }

      throw new PaymentError(
        `Payment processing failed: ${error.message}`,
        'PROCESSING_FAILED',
        provider
      );
    }
  }

  /**
   * Process Orange Money payment
   */
  async processOrangeMoney({ amount, currency, phone, reference, metadata }) {
    const config = this.providers.orange_money;

    if (!config.enabled) {
      throw new PaymentError('Orange Money is not configured', 'PROVIDER_NOT_CONFIGURED', 'orange_money');
    }

    try {
      // Get access token
      const tokenResponse = await axios.post(
        `${config.baseUrl}/oauth/token`,
        new URLSearchParams({
          grant_type: 'client_credentials'
        }),
        {
          auth: {
            username: config.apiKey,
            password: config.apiSecret
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const accessToken = tokenResponse.data.access_token;

      // Initialize payment
      const paymentResponse = await axios.post(
        `${config.baseUrl}/webpayment/v1/transactionInit`,
        {
          merchant_key: config.merchantId,
          currency,
          order_id: reference,
          amount: amount.toString(),
          return_url: `${process.env.APP_URL}/payment/callback`,
          cancel_url: `${process.env.APP_URL}/payment/cancel`,
          notif_url: `${process.env.API_URL}/api/v1/webhooks/orange-money`,
          lang: 'fr',
          reference: reference,
          customer_phone: phone
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        provider: 'orange_money',
        transactionId: paymentResponse.data.pay_token,
        reference,
        status: 'pending',
        paymentUrl: paymentResponse.data.payment_url,
        metadata: {
          payToken: paymentResponse.data.pay_token,
          notifToken: paymentResponse.data.notif_token
        }
      };
    } catch (error) {
      throw new ExternalAPIError(
        error.response?.data?.message || error.message,
        'orange_money',
        error.response?.status || 502
      );
    }
  }

  /**
   * Process Wave payment
   */
  async processWave({ amount, currency, phone, reference, metadata }) {
    const config = this.providers.wave;

    if (!config.enabled) {
      throw new PaymentError('Wave is not configured', 'PROVIDER_NOT_CONFIGURED', 'wave');
    }

    try {
      const response = await axios.post(
        `${config.baseUrl}/checkout/sessions`,
        {
          amount: amount * 100, // Wave uses cents
          currency,
          error_url: `${process.env.APP_URL}/payment/error`,
          success_url: `${process.env.APP_URL}/payment/success`,
          client_reference: reference,
          metadata: {
            ...metadata,
            phone
          }
        },
        {
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        provider: 'wave',
        transactionId: response.data.id,
        reference,
        status: 'pending',
        paymentUrl: response.data.wave_launch_url,
        metadata: {
          sessionId: response.data.id
        }
      };
    } catch (error) {
      throw new ExternalAPIError(
        error.response?.data?.message || error.message,
        'wave',
        error.response?.status || 502
      );
    }
  }

  /**
   * Process MTN Mobile Money payment
   */
  async processMTNMoMo({ amount, currency, phone, reference, metadata }) {
    const config = this.providers.mtn_momo;

    if (!config.enabled) {
      throw new PaymentError('MTN MoMo is not configured', 'PROVIDER_NOT_CONFIGURED', 'mtn_momo');
    }

    try {
      // Generate API user if not exists (sandbox)
      const referenceId = crypto.randomUUID();

      // Request to pay
      const response = await axios.post(
        `${config.baseUrl}/collection/v1_0/requesttopay`,
        {
          amount: amount.toString(),
          currency,
          externalId: reference,
          payer: {
            partyIdType: 'MSISDN',
            partyId: phone.replace('+', '')
          },
          payerMessage: 'Payment for Max IT TV subscription',
          payeeNote: `Order ${reference}`
        },
        {
          headers: {
            'X-Reference-Id': referenceId,
            'X-Target-Environment': process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
            'Ocp-Apim-Subscription-Key': config.apiKey,
            'Content-Type': 'application/json',
            Authorization: `Bearer ${await this.getMTNAccessToken()}`
          }
        }
      );

      return {
        success: true,
        provider: 'mtn_momo',
        transactionId: referenceId,
        reference,
        status: 'pending',
        metadata: {
          referenceId
        }
      };
    } catch (error) {
      throw new ExternalAPIError(
        error.response?.data?.message || error.message,
        'mtn_momo',
        error.response?.status || 502
      );
    }
  }

  /**
   * Get MTN MoMo access token
   */
  async getMTNAccessToken() {
    const config = this.providers.mtn_momo;

    try {
      const response = await axios.post(
        `${config.baseUrl}/collection/token/`,
        {},
        {
          headers: {
            'Ocp-Apim-Subscription-Key': config.apiKey,
            Authorization: `Basic ${Buffer.from(`${config.userId}:${config.apiSecret}`).toString('base64')}`
          }
        }
      );

      return response.data.access_token;
    } catch (error) {
      throw new ExternalAPIError('Failed to get MTN access token', 'mtn_momo', 401);
    }
  }

  /**
   * Process Stripe payment (backup for card payments)
   */
  async processStripe({ amount, currency, reference, metadata }) {
    const config = this.providers.stripe;

    if (!config.enabled) {
      throw new PaymentError('Stripe is not configured', 'PROVIDER_NOT_CONFIGURED', 'stripe');
    }

    // Note: In production, use the official Stripe SDK
    try {
      const response = await axios.post(
        'https://api.stripe.com/v1/payment_intents',
        new URLSearchParams({
          amount: amount * 100, // Stripe uses cents
          currency: currency.toLowerCase(),
          'metadata[reference]': reference,
          'metadata[type]': 'subscription',
          ...Object.entries(metadata).reduce((acc, [key, value]) => {
            acc[`metadata[${key}]`] = value;
            return acc;
          }, {})
        }),
        {
          headers: {
            Authorization: `Bearer ${config.secretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return {
        success: true,
        provider: 'stripe',
        transactionId: response.data.id,
        reference,
        status: 'pending',
        clientSecret: response.data.client_secret,
        metadata: {
          paymentIntentId: response.data.id
        }
      };
    } catch (error) {
      throw new ExternalAPIError(
        error.response?.data?.error?.message || error.message,
        'stripe',
        error.response?.status || 502
      );
    }
  }

  /**
   * Verify payment status
   */
  async verifyPayment(provider, transactionId) {
    logger.info(`Verifying payment: ${provider} - ${transactionId}`);

    try {
      switch (provider) {
        case 'orange_money':
          return await this.verifyOrangeMoney(transactionId);
        case 'wave':
          return await this.verifyWave(transactionId);
        case 'mtn_momo':
          return await this.verifyMTNMoMo(transactionId);
        case 'stripe':
          return await this.verifyStripe(transactionId);
        default:
          throw new PaymentError(`Unsupported provider: ${provider}`, 'UNSUPPORTED_PROVIDER');
      }
    } catch (error) {
      logger.logError(error, { context: 'payment_verification', provider, transactionId });
      throw error;
    }
  }

  /**
   * Verify Orange Money payment
   */
  async verifyOrangeMoney(payToken) {
    const config = this.providers.orange_money;

    try {
      const tokenResponse = await axios.post(
        `${config.baseUrl}/oauth/token`,
        new URLSearchParams({ grant_type: 'client_credentials' }),
        {
          auth: { username: config.apiKey, password: config.apiSecret },
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }
      );

      const response = await axios.get(
        `${config.baseUrl}/webpayment/v1/transactionStatus/${payToken}`,
        {
          headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` }
        }
      );

      return {
        verified: response.data.status === 'SUCCESS',
        status: this.mapOrangeMoneyStatus(response.data.status),
        transactionId: response.data.txnid,
        amount: parseFloat(response.data.amount),
        currency: response.data.currency,
        metadata: response.data
      };
    } catch (error) {
      throw new ExternalAPIError(error.message, 'orange_money', error.response?.status || 502);
    }
  }

  /**
   * Map Orange Money status to standard status
   */
  mapOrangeMoneyStatus(status) {
    const statusMap = {
      SUCCESS: 'completed',
      PENDING: 'pending',
      FAILED: 'failed',
      EXPIRED: 'expired',
      CANCELLED: 'cancelled'
    };
    return statusMap[status] || 'unknown';
  }

  /**
   * Verify Wave payment
   */
  async verifyWave(sessionId) {
    const config = this.providers.wave;

    try {
      const response = await axios.get(`${config.baseUrl}/checkout/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${config.apiKey}` }
      });

      return {
        verified: response.data.status === 'completed',
        status: response.data.status,
        transactionId: response.data.wave_transaction_id,
        amount: response.data.amount / 100,
        currency: response.data.currency,
        metadata: response.data
      };
    } catch (error) {
      throw new ExternalAPIError(error.message, 'wave', error.response?.status || 502);
    }
  }

  /**
   * Verify MTN MoMo payment
   */
  async verifyMTNMoMo(referenceId) {
    const config = this.providers.mtn_momo;

    try {
      const accessToken = await this.getMTNAccessToken();

      const response = await axios.get(
        `${config.baseUrl}/collection/v1_0/requesttopay/${referenceId}`,
        {
          headers: {
            'X-Target-Environment': process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
            'Ocp-Apim-Subscription-Key': config.apiKey,
            Authorization: `Bearer ${accessToken}`
          }
        }
      );

      return {
        verified: response.data.status === 'SUCCESSFUL',
        status: this.mapMTNStatus(response.data.status),
        transactionId: response.data.financialTransactionId,
        amount: parseFloat(response.data.amount),
        currency: response.data.currency,
        metadata: response.data
      };
    } catch (error) {
      throw new ExternalAPIError(error.message, 'mtn_momo', error.response?.status || 502);
    }
  }

  /**
   * Map MTN status to standard status
   */
  mapMTNStatus(status) {
    const statusMap = {
      SUCCESSFUL: 'completed',
      PENDING: 'pending',
      FAILED: 'failed'
    };
    return statusMap[status] || 'unknown';
  }

  /**
   * Verify Stripe payment
   */
  async verifyStripe(paymentIntentId) {
    const config = this.providers.stripe;

    try {
      const response = await axios.get(
        `https://api.stripe.com/v1/payment_intents/${paymentIntentId}`,
        {
          headers: { Authorization: `Bearer ${config.secretKey}` }
        }
      );

      return {
        verified: response.data.status === 'succeeded',
        status: this.mapStripeStatus(response.data.status),
        transactionId: response.data.id,
        amount: response.data.amount / 100,
        currency: response.data.currency.toUpperCase(),
        metadata: response.data
      };
    } catch (error) {
      throw new ExternalAPIError(error.message, 'stripe', error.response?.status || 502);
    }
  }

  /**
   * Map Stripe status to standard status
   */
  mapStripeStatus(status) {
    const statusMap = {
      succeeded: 'completed',
      processing: 'pending',
      requires_payment_method: 'pending',
      requires_confirmation: 'pending',
      requires_action: 'pending',
      canceled: 'cancelled',
      failed: 'failed'
    };
    return statusMap[status] || 'unknown';
  }

  /**
   * Process payout (reverse payment)
   */
  async processPayout(payoutData) {
    const { provider, amount, currency, phone, reference, affiliateId } = payoutData;

    logger.logPayment('payout_initiated', {
      provider,
      amount,
      currency,
      reference,
      affiliateId,
      phone: this.maskPhone(phone)
    });

    // Payout logic would be similar to payment but in reverse
    // For now, return a mock response
    return {
      success: true,
      provider,
      transactionId: crypto.randomUUID(),
      reference,
      status: 'processing',
      estimatedCompletion: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };
  }

  /**
   * Mask phone number for logging
   */
  maskPhone(phone) {
    if (!phone) return null;
    return phone.slice(0, 4) + '****' + phone.slice(-2);
  }

  /**
   * Get supported providers for a country
   */
  getSupportedProviders(countryCode) {
    const providersByCountry = {
      SN: ['orange_money', 'wave'],
      CI: ['orange_money', 'wave', 'mtn_momo'],
      ML: ['orange_money'],
      BF: ['orange_money'],
      CM: ['orange_money', 'mtn_momo'],
      GN: ['orange_money'],
      MG: ['orange_money'],
      CD: ['orange_money'],
      MA: ['stripe'],
      TN: ['stripe'],
      NE: ['orange_money'],
      BJ: ['mtn_momo'],
      TG: ['wave'],
      GA: ['stripe'],
      CG: ['stripe'],
      RW: ['mtn_momo'],
      DJ: ['orange_money']
    };

    return providersByCountry[countryCode] || ['stripe'];
  }
}

export default new PaymentService();
