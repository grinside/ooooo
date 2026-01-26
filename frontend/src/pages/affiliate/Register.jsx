import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, ArrowRight } from 'lucide-react';
import Header from '@components/Layout/Header';
import Footer from '@components/Layout/Footer';
import Button from '@components/UI/Button';
import Input from '@components/UI/Input';
import Card from '@components/UI/Card';
import useAuth from '@hooks/useAuth';
import { COUNTRIES } from '@utils/constants';
import { validateForm } from '@utils/validation';
import toast from 'react-hot-toast';

const Register = () => {
  const { affiliateRegister } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    country: 'SN',
    sponsor_code: '',
    pin: '',
    pin_confirmation: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep1 = () => {
    const rules = {
      name: { required: true, type: 'name', label: 'Full Name' },
      phone: { required: true, type: 'phone', label: 'Phone Number' },
      country: { required: true, label: 'Country' },
    };

    const validation = validateForm(formData, rules);
    setErrors(validation.errors);
    return validation.valid;
  };

  const validateStep2 = () => {
    const rules = {
      pin: { required: true, type: 'pin', label: 'PIN' },
      pin_confirmation: {
        required: true,
        label: 'Confirm PIN',
        validate: (value) => {
          if (value !== formData.pin) {
            return { valid: false, message: 'PINs do not match' };
          }
          return { valid: true };
        },
      },
    };

    const validation = validateForm(formData, rules);
    setErrors(validation.errors);
    return validation.valid;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep2()) return;

    setLoading(true);
    try {
      await affiliateRegister(formData);
    } catch (error) {
      toast.error('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <div className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
              <UserPlus className="text-primary-600" size={32} />
            </div>
            <h1 className="text-3xl font-bold mb-2">Become an Affiliate</h1>
            <p className="text-gray-600">
              Join our network and start earning commissions
            </p>
          </div>

          <Card>
            {/* Progress Steps */}
            <div className="flex items-center justify-center mb-8">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 1 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                1
              </div>
              <div className={`w-16 h-0.5 ${step >= 2 ? 'bg-primary-500' : 'bg-gray-200'}`} />
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 2 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                2
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {step === 1 && (
                <div className="space-y-4">
                  <Input
                    label="Full Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    error={errors.name}
                    required
                  />

                  <Input
                    label="Phone Number"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    error={errors.phone}
                    placeholder="+221 XX XXX XX XX"
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Country <span className="text-error-500">*</span>
                    </label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    >
                      {COUNTRIES.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.flag} {country.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Input
                    label="Sponsor Code (Optional)"
                    name="sponsor_code"
                    value={formData.sponsor_code}
                    onChange={handleChange}
                    placeholder="Enter sponsor's code"
                  />

                  <Button
                    type="button"
                    variant="primary"
                    fullWidth
                    onClick={handleNext}
                    icon={<ArrowRight size={18} />}
                    iconPosition="right"
                  >
                    Next
                  </Button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <Input
                    label="Create PIN"
                    name="pin"
                    type="password"
                    value={formData.pin}
                    onChange={handleChange}
                    error={errors.pin}
                    maxLength={4}
                    placeholder="4-digit PIN"
                    required
                  />

                  <Input
                    label="Confirm PIN"
                    name="pin_confirmation"
                    type="password"
                    value={formData.pin_confirmation}
                    onChange={handleChange}
                    error={errors.pin_confirmation}
                    maxLength={4}
                    placeholder="Re-enter PIN"
                    required
                  />

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      fullWidth
                      onClick={() => setStep(1)}
                    >
                      Back
                    </Button>

                    <Button
                      type="submit"
                      variant="primary"
                      fullWidth
                      loading={loading}
                    >
                      Register
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </Card>

          <p className="text-center text-sm text-gray-600 mt-4">
            Already have an account?{' '}
            <Link to="/affiliate/login" className="text-primary-500 hover:underline font-medium">
              Login here
            </Link>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Register;
