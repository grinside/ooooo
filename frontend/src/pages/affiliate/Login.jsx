import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LogIn, Phone, Lock } from 'lucide-react';
import Header from '@components/Layout/Header';
import Footer from '@components/Layout/Footer';
import Button from '@components/UI/Button';
import Input from '@components/UI/Input';
import Card from '@components/UI/Card';
import useAuth from '@hooks/useAuth';

const Login = () => {
  const { affiliateLogin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    pin: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await affiliateLogin(formData.phone, formData.pin);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <div className="flex-1 flex items-center justify-center py-12">
        <div className="container mx-auto px-4 max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
              <LogIn className="text-primary-600" size={32} />
            </div>
            <h1 className="text-3xl font-bold mb-2">Affiliate Login</h1>
            <p className="text-gray-600">Sign in to access your dashboard</p>
          </div>

          <Card>
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <Input
                label="PIN"
                name="pin"
                type="password"
                value={formData.pin}
                onChange={handleChange}
                placeholder="4-digit PIN"
                icon={<Lock size={18} />}
                maxLength={4}
                required
              />

              <div className="flex justify-end">
                <Link
                  to="/affiliate/forgot-pin"
                  className="text-sm text-primary-500 hover:underline"
                >
                  Forgot PIN?
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={loading}
              >
                Login
              </Button>
            </form>
          </Card>

          <p className="text-center text-sm text-gray-600 mt-4">
            Don't have an account?{' '}
            <Link
              to="/affiliate/register"
              className="text-primary-500 hover:underline font-medium"
            >
              Register now
            </Link>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Login;
