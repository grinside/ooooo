import React, { useEffect, useState } from 'react';
import Header from '@components/Layout/Header';
import Sidebar from '@components/Layout/Sidebar';
import Card from '@components/UI/Card';
import Table from '@components/UI/Table';
import Badge from '@components/UI/Badge';
import Button from '@components/UI/Button';
import { CheckCircle, XCircle } from 'lucide-react';
import adminService from '@services/adminService';
import { formatDate, formatCurrency } from '@utils/format';
import { AFFILIATE_STATUS } from '@utils/constants';
import toast from 'react-hot-toast';

const Affiliates = () => {
  const [affiliates, setAffiliates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAffiliates();
  }, []);

  const fetchAffiliates = async () => {
    try {
      const response = await adminService.getAffiliates();
      if (response.success) setAffiliates(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await adminService.approveAffiliate(id);
      toast.success('Affiliate approved');
      fetchAffiliates();
    } catch (error) {
      toast.error('Failed to approve');
    }
  };

  const handleSuspend = async (id) => {
    try {
      await adminService.suspendAffiliate(id, 'Suspended by admin');
      toast.success('Affiliate suspended');
      fetchAffiliates();
    } catch (error) {
      toast.error('Failed to suspend');
    }
  };

  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'phone', label: 'Phone' },
    { key: 'referral_code', label: 'Code' },
    { key: 'total_sales', label: 'Sales', render: (val) => val || 0 },
    { key: 'total_commission', label: 'Commission', render: (val) => formatCurrency(val || 0) },
    { key: 'status', label: 'Status', render: (val) => {
      const status = AFFILIATE_STATUS[val?.toUpperCase()];
      return <Badge variant={status?.color}>{status?.label}</Badge>;
    }},
    { key: 'joined_at', label: 'Joined', render: (val) => formatDate(val) },
    { key: 'actions', label: 'Actions', render: (val, row) => (
      <div className="flex gap-2">
        {row.status === 'pending' && (
          <Button size="sm" icon={<CheckCircle size={14} />} onClick={() => handleApprove(row.id)}>Approve</Button>
        )}
        {row.status === 'active' && (
          <Button size="sm" variant="danger" icon={<XCircle size={14} />} onClick={() => handleSuspend(row.id)}>Suspend</Button>
        )}
      </div>
    )},
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar userType="admin" />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Affiliates Management</h1>
            <Card>
              <Table columns={columns} data={affiliates} loading={loading} />
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Affiliates;
