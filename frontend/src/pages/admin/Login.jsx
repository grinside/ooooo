import React, { useState } from 'react';
import { Shield, Mail, Lock } from 'lucide-react';
import Header from '@components/Layout/Header';
import Footer from '@components/Layout/Footer';
import Button from '@components/UI/Button';
import Input from '@components/UI/Input';
import Card from '@components/UI/Card';
import useAuth from '@hooks/useAuth';

const AdminLogin = () => {
  const { adminLogin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await adminLogin(formData.email, formData.password);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="container mx-auto px-4 max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary-100 rounded-full mb-4">
              <Shield className="text-secondary-600" size={32} />
            </div>
            <h1 className="text-3xl font-bold mb-2">Admin Login</h1>
            <p className="text-gray-600">Access the administration panel</p>
          </div>

          <Card>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} icon={<Mail size={18} />} required />
              <Input label="Password" name="password" type="password" value={formData.password} onChange={handleChange} icon={<Lock size={18} />} required />
              <Button type="submit" variant="secondary" fullWidth loading={loading}>Login</Button>
            </form>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminLogin;
