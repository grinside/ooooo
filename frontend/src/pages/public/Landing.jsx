import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Tv, Users, DollarSign, TrendingUp, Check } from 'lucide-react';
import Header from '@components/Layout/Header';
import Footer from '@components/Layout/Footer';
import Button from '@components/UI/Button';
import Card from '@components/UI/Card';
import Loader from '@components/UI/Loader';
import useAppStore from '@store/appStore';
import subscriptionService from '@services/subscriptionService';
import { formatCurrency } from '@utils/format';
import toast from 'react-hot-toast';

const Landing = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAffiliateCode } = useAppStore();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState('SN');

  useEffect(() => {
    // Check for affiliate code in URL
    const refCode = searchParams.get('ref') || searchParams.get('affiliate');
    if (refCode) {
      setAffiliateCode(refCode);
      toast.success('Affiliate code applied!');
    }

    fetchOffers();
  }, [selectedCountry]);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const response = await subscriptionService.getOffersByCountry(selectedCountry);
      if (response.success) {
        setOffers(response.data);
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = (offer) => {
    navigate('/subscribe', { state: { offer } });
  };

  const features = [
    { icon: Tv, title: 'HD Streaming', description: 'Watch in crystal clear HD quality' },
    { icon: Users, title: 'Multiple Devices', description: 'Stream on all your devices' },
    { icon: DollarSign, title: 'Affordable Plans', description: 'Flexible pricing for everyone' },
    { icon: TrendingUp, title: 'Exclusive Content', description: 'Access to premium channels' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-600 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Welcome to Max IT TV
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90">
              Premium streaming service with unlimited entertainment
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="primary"
                size="lg"
                className="bg-white text-primary-600 hover:bg-gray-100"
                onClick={() => document.getElementById('offers').scrollIntoView({ behavior: 'smooth' })}
              >
                View Offers
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white/10"
                onClick={() => navigate('/affiliate/register')}
              >
                Become an Affiliate
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Max IT TV?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                      <Icon className="text-primary-600" size={32} />
                    </div>
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Offers Section */}
      <section id="offers" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">Choose Your Plan</h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader text="Loading offers..." />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {offers.map((offer) => (
                <Card
                  key={offer.id}
                  className="relative hover:shadow-xl transition-shadow"
                  padding="default"
                >
                  {offer.is_popular && (
                    <div className="absolute top-0 right-0 bg-primary-500 text-white px-4 py-1 rounded-bl-lg rounded-tr-lg text-sm font-medium">
                      Popular
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold mb-2">{offer.name}</h3>
                    <div className="text-4xl font-bold text-primary-600 mb-2">
                      {formatCurrency(offer.price, offer.currency)}
                    </div>
                    <p className="text-gray-600">/ {offer.duration_days} days</p>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {offer.features?.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="text-success-500 flex-shrink-0 mt-1" size={18} />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => handleSubscribe(offer)}
                  >
                    Subscribe Now
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Affiliate CTA Section */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Earn with Max IT TV</h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Join our affiliate program and earn commissions by referring customers to Max IT TV
          </p>
          <Button
            variant="primary"
            size="lg"
            className="bg-white text-primary-600 hover:bg-gray-100"
            onClick={() => navigate('/affiliate/register')}
          >
            Join as Affiliate
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;
