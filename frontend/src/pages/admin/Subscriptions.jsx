import React, { useEffect, useState } from 'react';
import Header from '@components/Layout/Header';
import Sidebar from '@components/Layout/Sidebar';
import Card from '@components/UI/Card';
import Table from '@components/UI/Table';
import Badge from '@components/UI/Badge';
import adminService from '@services/adminService';
import { formatDate, formatCurrency } from '@utils/format';
import { SUBSCRIPTION_STATUS } from '@utils/constants';

const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const response = await adminService.getSubscriptions();
      if (response.success) setSubscriptions(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'reference', label: 'Reference' },
    { key: 'customer_name', label: 'Customer' },
    { key: 'offer_name', label: 'Offer' },
    { key: 'amount', label: 'Amount', render: (val, row) => formatCurrency(val, row.currency) },
    { key: 'status', label: 'Status', render: (val) => {
      const status = SUBSCRIPTION_STATUS[val?.toUpperCase()];
      return <Badge variant={status?.color}>{status?.label}</Badge>;
    }},
    { key: 'created_at', label: 'Date', render: (val) => formatDate(val) },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar userType="admin" />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Subscriptions</h1>
            <Card>
              <Table columns={columns} data={subscriptions} loading={loading} />
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Subscriptions;
