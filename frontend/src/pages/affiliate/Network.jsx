import React, { useEffect, useState } from 'react';
import Header from '@components/Layout/Header';
import Sidebar from '@components/Layout/Sidebar';
import Card from '@components/UI/Card';
import Table from '@components/UI/Table';
import Badge from '@components/UI/Badge';
import affiliateService from '@services/affiliateService';
import { formatDate, formatCurrency } from '@utils/format';
import { AFFILIATE_STATUS } from '@utils/constants';

const Network = () => {
  const [network, setNetwork] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNetwork();
  }, []);

  const fetchNetwork = async () => {
    try {
      const response = await affiliateService.getNetwork();
      if (response.success) setNetwork(response.data);
    } catch (error) {
      console.error('Error fetching network:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'phone', label: 'Phone' },
    { key: 'level', label: 'Level', render: (val) => `Level ${val}` },
    { key: 'total_sales', label: 'Sales', render: (val) => val || 0 },
    { key: 'total_commission', label: 'Commission', render: (val) => formatCurrency(val || 0) },
    { key: 'status', label: 'Status', render: (val) => {
      const status = AFFILIATE_STATUS[val?.toUpperCase()];
      return <Badge variant={status?.color || 'default'}>{status?.label || val}</Badge>;
    }},
    { key: 'joined_at', label: 'Joined', render: (val) => formatDate(val) },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar userType="affiliate" />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">My Network</h1>
            <Card>
              <Table columns={columns} data={network} loading={loading} />
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Network;
