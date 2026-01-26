import React, { useEffect, useState } from 'react';
import { Users, DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';
import Header from '@components/Layout/Header';
import Sidebar from '@components/Layout/Sidebar';
import Card from '@components/UI/Card';
import Loader from '@components/UI/Loader';
import adminService from '@services/adminService';
import { formatCurrency, formatNumber } from '@utils/format';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await adminService.getDashboard();
      if (response.success) setStats(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader text="Loading..." /></div>;

  const statCards = [
    { title: 'Total Revenue', value: formatCurrency(stats?.total_revenue || 0), icon: DollarSign, color: 'text-success-600', bgColor: 'bg-success-100' },
    { title: 'Active Affiliates', value: formatNumber(stats?.active_affiliates || 0), icon: Users, color: 'text-primary-600', bgColor: 'bg-primary-100' },
    { title: 'Total Subscriptions', value: formatNumber(stats?.total_subscriptions || 0), icon: ShoppingCart, color: 'text-secondary-600', bgColor: 'bg-secondary-100' },
    { title: 'Pending Payouts', value: formatCurrency(stats?.pending_payouts || 0), icon: TrendingUp, color: 'text-warning-600', bgColor: 'bg-warning-100' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar userType="admin" />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {statCards.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card key={index} hover>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                        <Icon className={stat.color} size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card title="Revenue Chart">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats?.revenue_chart || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#0066FF" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
              <Card title="Subscriptions Chart">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats?.subscriptions_chart || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#FF6B00" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
