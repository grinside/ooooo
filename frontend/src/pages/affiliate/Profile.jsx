import React, { useState } from 'react';
import { User, Lock, CreditCard } from 'lucide-react';
import Header from '@components/Layout/Header';
import Sidebar from '@components/Layout/Sidebar';
import Card from '@components/UI/Card';
import Input from '@components/UI/Input';
import Button from '@components/UI/Button';
import useAuthStore from '@store/authStore';
import affiliateService from '@services/affiliateService';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bank_name: user?.bank_name || '',
    account_number: user?.account_number || '',
    old_pin: '',
    new_pin: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const response = await affiliateService.updateProfile({
        name: formData.name,
        email: formData.email,
      });
      if (response.success) {
        updateUser(response.data);
        toast.success('Profile updated');
      }
    } catch (error) {
      toast.error('Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePin = async () => {
    setLoading(true);
    try {
      const response = await affiliateService.changePin(formData.old_pin, formData.new_pin);
      if (response.success) {
        toast.success('PIN changed');
        setFormData({ ...formData, old_pin: '', new_pin: '' });
      }
    } catch (error) {
      toast.error('Failed to change PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar userType="affiliate" />
        <main className="flex-1 p-6">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Profile Settings</h1>

            <div className="space-y-6">
              <Card title="Personal Information" headerAction={<User size={20} />}>
                <div className="space-y-4">
                  <Input label="Full Name" name="name" value={formData.name} onChange={handleChange} />
                  <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} />
                  <Input label="Phone" value={user?.phone} disabled />
                  <Button onClick={handleUpdateProfile} loading={loading}>Update Profile</Button>
                </div>
              </Card>

              <Card title="Change PIN" headerAction={<Lock size={20} />}>
                <div className="space-y-4">
                  <Input label="Current PIN" name="old_pin" type="password" value={formData.old_pin} onChange={handleChange} maxLength={4} />
                  <Input label="New PIN" name="new_pin" type="password" value={formData.new_pin} onChange={handleChange} maxLength={4} />
                  <Button onClick={handleChangePin} loading={loading}>Change PIN</Button>
                </div>
              </Card>

              <Card title="Bank Account" headerAction={<CreditCard size={20} />}>
                <div className="space-y-4">
                  <Input label="Bank Name" name="bank_name" value={formData.bank_name} onChange={handleChange} />
                  <Input label="Account Number" name="account_number" value={formData.account_number} onChange={handleChange} />
                  <Button>Update Bank Details</Button>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;
