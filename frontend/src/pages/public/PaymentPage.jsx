import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CreditCard, Smartphone, CheckCircle, XCircle } from 'lucide-react';
import Header from '@components/Layout/Header';
import Footer from '@components/Layout/Footer';
import Button from '@components/UI/Button';
import Card from '@components/UI/Card';
import Loader from '@components/UI/Loader';
import subscriptionService from '@services/subscriptionService';
import { formatCurrency, formatDateTime } from '@utils/format';
import { PAYMENT_PROVIDERS } from '@utils/constants';
import toast from 'react-hot-toast';

const PaymentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);

  useEffect(() => {
    fetchSubscription();
    const interval = setInterval(checkPaymentStatus, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [id]);

  const fetchSubscription = async () => {
    try {
      const response = await subscriptionService.getSubscription(id);
      if (response.success) {
        setSubscription(response.data);

        // If already paid, redirect to success page
        if (response.data.payment_status === 'completed') {
          navigate(`/success/${response.data.reference}`);
        }
      }
    } catch (error) {
      toast.error('Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!id) return;

    try {
      const response = await subscriptionService.checkPaymentStatus(id);
      if (response.success && response.data.status === 'completed') {
        navigate(`/success/${subscription.reference}`);
      }
    } catch (error) {
      // Silently fail, will retry
    }
  };

  const handlePayment = async (providerId) => {
    try {
      setProcessing(true);
      setSelectedProvider(providerId);

      const response = await subscriptionService.initiatePayment(id, {
        provider: providerId,
        phone: subscription.customer_phone,
      });

      if (response.success) {
        toast.success('Payment initiated! Please complete on your phone.');
      }
    } catch (error) {
      toast.error('Failed to initiate payment');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader text="Loading payment details..." />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="text-center">
          <XCircle className="text-error-500 mx-auto mb-4" size={48} />
          <h2 className="text-2xl font-bold mb-2">Subscription Not Found</h2>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </Card>
      </div>
    );
  }

  const availableProviders = Object.values(PAYMENT_PROVIDERS).filter(
    (provider) =>
      provider.countries.includes('all') ||
      provider.countries.includes(subscription.country)
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <div className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl font-bold text-center mb-8">Complete Your Payment</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Subscription Details */}
            <div className="lg:col-span-2">
              <Card title="Select Payment Method">
                <div className="space-y-4">
                  {availableProviders.map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => handlePayment(provider.id)}
                      disabled={processing}
                      className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-4xl">{provider.icon}</div>
                        <div className="flex-1 text-left">
                          <h3 className="font-semibold text-gray-900">{provider.name}</h3>
                          <p className="text-sm text-gray-600">
                            {provider.id === selectedProvider && processing
                              ? 'Processing...'
                              : 'Click to pay'}
                          </p>
                        </div>
                        {provider.id === selectedProvider && processing && (
                          <Loader size="sm" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card title="Order Summary">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {subscription.offer_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Duration: {subscription.duration_days} days
                    </p>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-semibold">
                        {formatCurrency(subscription.amount, subscription.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary-600">
                        {formatCurrency(subscription.amount, subscription.currency)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200 text-sm text-gray-600">
                    <p className="mb-2">
                      <strong>Customer:</strong> {subscription.customer_name}
                    </p>
                    <p>
                      <strong>Phone:</strong> {subscription.customer_phone}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PaymentPage;
