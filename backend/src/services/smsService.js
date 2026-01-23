import axios from 'axios';
import { ExternalAPIError } from '../utils/errors.js';
import logger from '../utils/logger.js';
import FormData from 'form-data';

/**
 * SMS Service - Handles SMS notifications
 * Supports: Orange SMS API, Twilio, Africa's Talking
 */
class SMSService {
  constructor() {
    this.provider = process.env.SMS_PROVIDER || 'orange';
    this.senderName = process.env.SMS_SENDER_NAME || 'MaxITTV';
    this.config = this.initializeConfig();
  }

  /**
   * Initialize provider configuration
   */
  initializeConfig() {
    switch (this.provider) {
      case 'orange':
        return {
          clientId: process.env.ORANGE_SMS_CLIENT_ID,
          clientSecret: process.env.ORANGE_SMS_CLIENT_SECRET,
          baseUrl: process.env.ORANGE_SMS_BASE_URL || 'https://api.orange.com/smsmessaging/v1',
          enabled: !!process.env.ORANGE_SMS_CLIENT_ID
        };
      case 'twilio':
        return {
          accountSid: process.env.TWILIO_ACCOUNT_SID,
          authToken: process.env.TWILIO_AUTH_TOKEN,
          phoneNumber: process.env.TWILIO_PHONE_NUMBER,
          enabled: !!process.env.TWILIO_ACCOUNT_SID
        };
      case 'africas_talking':
        return {
          apiKey: process.env.AFRICAS_TALKING_API_KEY,
          username: process.env.AFRICAS_TALKING_USERNAME,
          enabled: !!process.env.AFRICAS_TALKING_API_KEY
        };
      default:
        logger.warn(`Unknown SMS provider: ${this.provider}`);
        return { enabled: false };
    }
  }

  /**
   * Send SMS message
   */
  async sendSMS(phone, message, options = {}) {
    if (!this.config.enabled) {
      logger.warn('SMS service is not configured, skipping SMS send');
      return { success: false, reason: 'SMS service not configured' };
    }

    // Validate phone number
    if (!this.validatePhone(phone)) {
      throw new Error(`Invalid phone number: ${phone}`);
    }

    logger.info(`Sending SMS via ${this.provider}`, {
      phone: this.maskPhone(phone),
      messageLength: message.length
    });

    try {
      let result;

      switch (this.provider) {
        case 'orange':
          result = await this.sendOrangeSMS(phone, message, options);
          break;
        case 'twilio':
          result = await this.sendTwilioSMS(phone, message, options);
          break;
        case 'africas_talking':
          result = await this.sendAfricasTalkingSMS(phone, message, options);
          break;
        default:
          throw new Error(`Unsupported SMS provider: ${this.provider}`);
      }

      logger.info('SMS sent successfully', {
        phone: this.maskPhone(phone),
        messageId: result.messageId,
        provider: this.provider
      });

      return result;
    } catch (error) {
      logger.logError(error, {
        context: 'sms_send',
        provider: this.provider,
        phone: this.maskPhone(phone)
      });

      throw new ExternalAPIError(
        `Failed to send SMS: ${error.message}`,
        this.provider,
        error.response?.status || 502
      );
    }
  }

  /**
   * Send SMS via Orange SMS API
   */
  async sendOrangeSMS(phone, message, options) {
    const { clientId, clientSecret, baseUrl } = this.config;

    try {
      // Get access token
      const tokenResponse = await axios.post(
        'https://api.orange.com/oauth/v3/token',
        new URLSearchParams({
          grant_type: 'client_credentials'
        }),
        {
          auth: {
            username: clientId,
            password: clientSecret
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const accessToken = tokenResponse.data.access_token;

      // Send SMS
      const smsResponse = await axios.post(
        `${baseUrl}/outbound/${encodeURIComponent(this.senderName)}/requests`,
        {
          outboundSMSMessageRequest: {
            address: `tel:${phone.replace('+', '')}`,
            senderAddress: `tel:${this.senderName}`,
            outboundSMSTextMessage: {
              message
            }
          }
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
        messageId: smsResponse.data.outboundSMSMessageRequest.resourceURL,
        provider: 'orange',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new ExternalAPIError(
        error.response?.data?.message || error.message,
        'orange_sms',
        error.response?.status || 502
      );
    }
  }

  /**
   * Send SMS via Twilio
   */
  async sendTwilioSMS(phone, message, options) {
    const { accountSid, authToken, phoneNumber } = this.config;

    try {
      const response = await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        new URLSearchParams({
          To: phone,
          From: phoneNumber,
          Body: message
        }),
        {
          auth: {
            username: accountSid,
            password: authToken
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return {
        success: true,
        messageId: response.data.sid,
        provider: 'twilio',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new ExternalAPIError(
        error.response?.data?.message || error.message,
        'twilio',
        error.response?.status || 502
      );
    }
  }

  /**
   * Send SMS via Africa's Talking
   */
  async sendAfricasTalkingSMS(phone, message, options) {
    const { apiKey, username } = this.config;

    try {
      const formData = new URLSearchParams({
        username,
        to: phone,
        message,
        from: this.senderName
      });

      const response = await axios.post(
        'https://api.africastalking.com/version1/messaging',
        formData,
        {
          headers: {
            'apiKey': apiKey,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          }
        }
      );

      const recipient = response.data.SMSMessageData.Recipients[0];

      if (recipient.status !== 'Success') {
        throw new Error(recipient.status);
      }

      return {
        success: true,
        messageId: recipient.messageId,
        provider: 'africas_talking',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new ExternalAPIError(
        error.response?.data?.message || error.message,
        'africas_talking',
        error.response?.status || 502
      );
    }
  }

  /**
   * Send OTP code
   */
  async sendOTP(phone, code, expiryMinutes = 10) {
    const message = `Votre code de verification Max IT TV est: ${code}. Valide pendant ${expiryMinutes} minutes. Ne partagez pas ce code.`;

    return await this.sendSMS(phone, message, { type: 'otp' });
  }

  /**
   * Send welcome message to new affiliate
   */
  async sendWelcomeAffiliate(phone, affiliateName, affiliateCode) {
    const message = `Bienvenue ${affiliateName} chez Max IT TV! Votre code affilié: ${affiliateCode}. Partagez-le et gagnez 15% de commission sur chaque vente!`;

    return await this.sendSMS(phone, message, { type: 'welcome' });
  }

  /**
   * Send subscription confirmation
   */
  async sendSubscriptionConfirmation(phone, customerName, offerName, expiryDate) {
    const message = `${customerName}, votre abonnement ${offerName} Max IT TV est activé! Valide jusqu'au ${expiryDate}. Profitez de vos programmes!`;

    return await this.sendSMS(phone, message, { type: 'subscription' });
  }

  /**
   * Send commission notification
   */
  async sendCommissionNotification(phone, amount, currency, reference) {
    const message = `Félicitations! Vous avez gagné ${amount} ${currency} de commission. Ref: ${reference}. Consultez votre dashboard pour plus de détails.`;

    return await this.sendSMS(phone, message, { type: 'commission' });
  }

  /**
   * Send payout confirmation
   */
  async sendPayoutConfirmation(phone, amount, currency, method) {
    const message = `Votre paiement de ${amount} ${currency} via ${method} a été traité avec succès. Vous recevrez les fonds sous 24-48h.`;

    return await this.sendSMS(phone, message, { type: 'payout' });
  }

  /**
   * Send payment reminder
   */
  async sendPaymentReminder(phone, customerName, offerName, amount, currency) {
    const message = `${customerName}, complétez votre paiement de ${amount} ${currency} pour activer votre abonnement ${offerName} Max IT TV.`;

    return await this.sendSMS(phone, message, { type: 'reminder' });
  }

  /**
   * Send network recruitment notification
   */
  async sendNetworkRecruitment(phone, recruiterName, newAffiliateName) {
    const message = `${recruiterName}, ${newAffiliateName} a rejoint votre réseau! Vous gagnez maintenant 5% sur ses ventes. Continuez à recruter!`;

    return await this.sendSMS(phone, message, { type: 'network' });
  }

  /**
   * Send bulk SMS
   */
  async sendBulkSMS(recipients, message, options = {}) {
    logger.info(`Sending bulk SMS to ${recipients.length} recipients`);

    const results = {
      total: recipients.length,
      sent: 0,
      failed: 0,
      errors: []
    };

    // Send in batches to avoid rate limiting
    const batchSize = 50;
    const batches = [];

    for (let i = 0; i < recipients.length; i += batchSize) {
      batches.push(recipients.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      const promises = batch.map(async (phone) => {
        try {
          await this.sendSMS(phone, message, options);
          results.sent++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            phone: this.maskPhone(phone),
            error: error.message
          });
        }
      });

      await Promise.allSettled(promises);

      // Wait between batches to respect rate limits
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    logger.info('Bulk SMS completed', results);

    return results;
  }

  /**
   * Validate phone number format
   */
  validatePhone(phone) {
    // Basic validation for international format
    // Should start with + and have 10-15 digits
    const phoneRegex = /^\+[1-9]\d{9,14}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Mask phone number for logging
   */
  maskPhone(phone) {
    if (!phone) return null;
    return phone.slice(0, 4) + '****' + phone.slice(-2);
  }

  /**
   * Format phone number to international format
   */
  formatPhone(phone, countryCode) {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');

    // If already has country code, return as is
    if (digits.startsWith('221') || digits.startsWith('225')) {
      return `+${digits}`;
    }

    // Map country codes
    const countryCodes = {
      SN: '221', // Senegal
      CI: '225', // Côte d'Ivoire
      ML: '223', // Mali
      BF: '226', // Burkina Faso
      CM: '237', // Cameroon
      GN: '224', // Guinea
      MG: '261', // Madagascar
      CD: '243', // DR Congo
      MA: '212', // Morocco
      TN: '216', // Tunisia
      NE: '227', // Niger
      BJ: '229', // Benin
      TG: '228', // Togo
      GA: '241', // Gabon
      CG: '242', // Congo
      RW: '250', // Rwanda
      DJ: '253'  // Djibouti
    };

    const code = countryCodes[countryCode];
    if (!code) {
      throw new Error(`Unknown country code: ${countryCode}`);
    }

    return `+${code}${digits}`;
  }

  /**
   * Check SMS delivery status (if provider supports it)
   */
  async checkDeliveryStatus(messageId) {
    logger.info(`Checking delivery status for message: ${messageId}`);

    // Implementation depends on provider
    // For now, return a mock status
    return {
      messageId,
      status: 'delivered',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get SMS statistics
   */
  async getStatistics(startDate, endDate) {
    // This would query your database for SMS logs
    // For now, return mock data
    return {
      period: { startDate, endDate },
      total: 0,
      delivered: 0,
      failed: 0,
      pending: 0,
      byType: {
        otp: 0,
        welcome: 0,
        subscription: 0,
        commission: 0,
        payout: 0,
        reminder: 0
      }
    };
  }
}

export default new SMSService();
