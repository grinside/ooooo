import React, { useEffect, useState } from 'react';
import Header from '@components/Layout/Header';
import Sidebar from '@components/Layout/Sidebar';
import Card from '@components/UI/Card';
import Table from '@components/UI/Table';
import Badge from '@components/UI/Badge';
import affiliateService from '@services/affiliateService';
import { formatDate, formatCurrency } from '@utils/format';
import { COMMISSION_TYPES } from '@utils/constants';

const Commissions = () => {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommissions();
  }, []);

  const fetchCommissions = async () => {
    try {
      const response = await affiliateService.getCommissions();
      if (response.success) setCommissions(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'reference', label: 'Reference' },
    { key: 'type', label: 'Type', render: (val) => COMMISSION_TYPES[val]?.label || val },
    { key: 'amount', label: 'Amount', render: (val, row) => formatCurrency(val, row.currency) },
    { key: 'status', label: 'Status', render: (val) => <Badge variant={val === 'paid' ? 'success' : 'warning'}>{val}</Badge> },
    { key: 'created_at', label: 'Date', render: (val) => formatDate(val) },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar userType="affiliate" />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Commissions</h1>
            <Card>
              <Table columns={columns} data={commissions} loading={loading} />
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Commissions;
