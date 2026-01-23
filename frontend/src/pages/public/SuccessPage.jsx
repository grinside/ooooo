import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Download, Mail, MessageSquare } from 'lucide-react';
import Header from '@components/Layout/Header';
import Footer from '@components/Layout/Footer';
import Button from '@components/UI/Button';
import Card from '@components/UI/Card';
import Loader from '@components/UI/Loader';
import subscriptionService from '@services/subscriptionService';
import { formatCurrency, formatDateTime } from '@utils/format';
import { copyToClipboard } from '@utils/helpers';
import toast from 'react-hot-toast';

const SuccessPage = () => {
  const { reference } = useParams();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscription();
  }, [reference]);

  const fetchSubscription = async () => {
    try {
      const response = await subscriptionService.getSubscription(reference);
      if (response.success) {
        setSubscription(response.data);
      }
    } catch (error) {
      toast.error('Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyDetails = () => {
    const details = `
Max IT TV Subscription
----------------------
Reference: ${subscription.reference}
Plan: ${subscription.offer_name}
Duration: ${subscription.duration_days} days
Amount: ${formatCurrency(subscription.amount, subscription.currency)}
Status: ${subscription.status}
Activated: ${formatDateTime(subscription.activated_at)}
Expires: ${formatDateTime(subscription.expires_at)}
    `.trim();

    copyToClipboard(details);
    toast.success('Details copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader text="Loading subscription details..." />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Card className="text-center max-w-md">
            <h2 className="text-2xl font-bold mb-4">Subscription Not Found</h2>
            <p className="text-gray-600 mb-6">
              We couldn't find a subscription with that reference.
            </p>
            <Button onClick={() => navigate('/')}>Go Home</Button>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <div className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Success Icon */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-success-100 rounded-full mb-4">
              <CheckCircle className="text-success-600" size={48} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Payment Successful!
            </h1>
            <p className="text-lg text-gray-600">
              Your subscription has been activated
            </p>
          </div>

          {/* Subscription Details Card */}
          <Card title="Subscription Details" className="mb-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Reference</p>
                  <p className="font-semibold">{subscription.reference}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className="inline-block px-3 py-1 bg-success-100 text-success-800 rounded-full text-sm font-medium">
                    Active
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Plan</p>
                  <p className="font-semibold">{subscription.offer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-semibold">{subscription.duration_days} days</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Activated</p>
                  <p className="font-semibold">
                    {formatDateTime(subscription.activated_at)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Expires</p>
                  <p className="font-semibold">
                    {formatDateTime(subscription.expires_at)}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Amount Paid</span>
                  <span className="text-2xl font-bold text-primary-600">
                    {formatCurrency(subscription.amount, subscription.currency)}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <Button
              variant="primary"
              icon={<Download size={18} />}
              onClick={handleCopyDetails}
              fullWidth
            >
              Copy Details
            </Button>
            <Button
              variant="outline"
              icon={<Mail size={18} />}
              fullWidth
            >
              Email Receipt
            </Button>
          </div>

          {/* Next Steps */}
          <Card title="Next Steps">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-600 font-semibold">1</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Download the App</h3>
                  <p className="text-sm text-gray-600">
                    Install Max IT TV app on your device to start streaming
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-600 font-semibold">2</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Login with Your Code</h3>
                  <p className="text-sm text-gray-600">
                    Use reference code <strong>{subscription.reference}</strong> to activate
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-600 font-semibold">3</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Start Watching</h3>
                  <p className="text-sm text-gray-600">
                    Enjoy unlimited streaming until {formatDateTime(subscription.expires_at, 'dd MMM yyyy')}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Support */}
          <div className="mt-8 text-center text-sm text-gray-600">
            <p className="mb-2">Need help? Contact our support team</p>
            <Button variant="link" icon={<MessageSquare size={16} />}>
              Get Support
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default SuccessPage;
