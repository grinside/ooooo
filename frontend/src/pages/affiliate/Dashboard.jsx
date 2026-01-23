import React, { useEffect, useState } from 'react';
import { DollarSign, Users, TrendingUp, ShoppingCart } from 'lucide-react';
import Header from '@components/Layout/Header';
import Sidebar from '@components/Layout/Sidebar';
import Card from '@components/UI/Card';
import Loader from '@components/UI/Loader';
import Badge from '@components/UI/Badge';
import affiliateService from '@services/affiliateService';
import { formatCurrency, formatNumber } from '@utils/format';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [dashboardRes, chartRes] = await Promise.all([
        affiliateService.getDashboard(),
        affiliateService.getSalesChart('30d'),
      ]);

      if (dashboardRes.success) {
        setStats(dashboardRes.data);
      }

      if (chartRes.success) {
        setChartData(chartRes.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader text="Loading dashboard..." />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Earnings',
      value: formatCurrency(stats?.total_commission || 0),
      icon: DollarSign,
      color: 'text-success-600',
      bgColor: 'bg-success-100',
    },
    {
      title: 'Available Balance',
      value: formatCurrency(stats?.available_balance || 0),
      icon: TrendingUp,
      color: 'text-primary-600',
      bgColor: 'bg-primary-100',
    },
    {
      title: 'Total Sales',
      value: formatNumber(stats?.total_sales || 0),
      icon: ShoppingCart,
      color: 'text-secondary-600',
      bgColor: 'bg-secondary-100',
    },
    {
      title: 'Network Size',
      value: formatNumber(stats?.network_size || 0),
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="flex">
        <Sidebar userType="affiliate" />

        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
              <p className="text-gray-600">Welcome back! Here's your performance overview.</p>
            </div>

            {/* Stats Grid */}
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

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card title="Sales Over Time">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="sales" stroke="#FF6B00" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              <Card title="Commission Earnings">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="commission" fill="#0066FF" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card title="Recent Sales">
              {stats?.recent_sales?.length > 0 ? (
                <div className="space-y-4">
                  {stats.recent_sales.map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-900">{sale.customer_name}</p>
                        <p className="text-sm text-gray-600">{sale.offer_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-success-600">
                          +{formatCurrency(sale.commission)}
                        </p>
                        <Badge variant="success" size="sm">Paid</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No recent sales</p>
              )}
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
