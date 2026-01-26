import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, Phone, Lock } from 'lucide-react';
import Header from '@components/Layout/Header';
import Footer from '@components/Layout/Footer';
import Button from '@components/UI/Button';
import Input from '@components/UI/Input';
import Card from '@components/UI/Card';
import Alert from '@components/UI/Alert';
import affiliateService from '@services/affiliateService';
import toast from 'react-hot-toast';

const ForgotPin = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    otp: '',
    new_pin: '',
    confirm_pin: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await affiliateService.requestOTP(formData.phone);
      if (response.success) {
        toast.success('OTP sent to your phone');
        setStep(2);
      }
    } catch (error) {
      toast.error('Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await affiliateService.verifyOTP(formData.phone, formData.otp);
      if (response.success) {
        toast.success('OTP verified');
        setStep(3);
      }
    } catch (error) {
      toast.error('Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPin = async (e) => {
    e.preventDefault();

    if (formData.new_pin !== formData.confirm_pin) {
      toast.error('PINs do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await affiliateService.resetPin(
        formData.phone,
        formData.otp,
        formData.new_pin
      );
      if (response.success) {
        toast.success('PIN reset successful!');
        window.location.href = '/affiliate/login';
      }
    } catch (error) {
      toast.error('Failed to reset PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <div className="flex-1 flex items-center justify-center py-12">
        <div className="container mx-auto px-4 max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
              <KeyRound className="text-primary-600" size={32} />
            </div>
            <h1 className="text-3xl font-bold mb-2">Reset PIN</h1>
            <p className="text-gray-600">Recover access to your account</p>
          </div>

          <Card>
            {step === 1 && (
              <form onSubmit={handleRequestOTP} className="space-y-4">
                <Alert
                  type="info"
                  message="Enter your registered phone number to receive an OTP"
                />

                <Input
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+221 XX XXX XX XX"
                  icon={<Phone size={18} />}
                  required
                />

                <Button type="submit" variant="primary" fullWidth loading={loading}>
                  Send OTP
                </Button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <Alert
                  type="info"
                  message="Enter the OTP sent to your phone"
                />

                <Input
                  label="OTP Code"
                  name="otp"
                  type="text"
                  value={formData.otp}
                  onChange={handleChange}
                  placeholder="6-digit code"
                  maxLength={6}
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

                  <Button type="submit" variant="primary" fullWidth loading={loading}>
                    Verify OTP
                  </Button>
                </div>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handleResetPin} className="space-y-4">
                <Alert
                  type="success"
                  message="OTP verified. Create a new PIN"
                />

                <Input
                  label="New PIN"
                  name="new_pin"
                  type="password"
                  value={formData.new_pin}
                  onChange={handleChange}
                  placeholder="4-digit PIN"
                  icon={<Lock size={18} />}
                  maxLength={4}
                  required
                />

                <Input
                  label="Confirm New PIN"
                  name="confirm_pin"
                  type="password"
                  value={formData.confirm_pin}
                  onChange={handleChange}
                  placeholder="Re-enter PIN"
                  icon={<Lock size={18} />}
                  maxLength={4}
                  required
                />

                <Button type="submit" variant="primary" fullWidth loading={loading}>
                  Reset PIN
                </Button>
              </form>
            )}
          </Card>

          <p className="text-center text-sm text-gray-600 mt-4">
            Remember your PIN?{' '}
            <Link
              to="/affiliate/login"
              className="text-primary-500 hover:underline font-medium"
            >
              Login here
            </Link>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ForgotPin;
