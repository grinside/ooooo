import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import Header from '@components/Layout/Header';
import Sidebar from '@components/Layout/Sidebar';
import Card from '@components/UI/Card';
import Table from '@components/UI/Table';
import Badge from '@components/UI/Badge';
import Button from '@components/UI/Button';
import adminService from '@services/adminService';
import { formatDate, formatCurrency } from '@utils/format';
import { PAYOUT_STATUS } from '@utils/constants';
import toast from 'react-hot-toast';

const Payouts = () => {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayouts();
  }, []);

  const fetchPayouts = async () => {
    try {
      const response = await adminService.getPayouts();
      if (response.success) setPayouts(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await adminService.approvePayout(id);
      toast.success('Payout approved');
      fetchPayouts();
    } catch (error) {
      toast.error('Failed');
    }
  };

  const handleReject = async (id) => {
    try {
      await adminService.rejectPayout(id, 'Rejected by admin');
      toast.success('Payout rejected');
      fetchPayouts();
    } catch (error) {
      toast.error('Failed');
    }
  };

  const columns = [
    { key: 'reference', label: 'Reference' },
    { key: 'affiliate_name', label: 'Affiliate' },
    { key: 'amount', label: 'Amount', render: (val, row) => formatCurrency(val, row.currency) },
    { key: 'status', label: 'Status', render: (val) => {
      const status = PAYOUT_STATUS[val?.toUpperCase()];
      return <Badge variant={status?.color}>{status?.label}</Badge>;
    }},
    { key: 'requested_at', label: 'Requested', render: (val) => formatDate(val) },
    { key: 'actions', label: 'Actions', render: (val, row) => (
      row.status === 'pending' && (
        <div className="flex gap-2">
          <Button size="sm" icon={<CheckCircle size={14} />} onClick={() => handleApprove(row.id)}>Approve</Button>
          <Button size="sm" variant="danger" icon={<XCircle size={14} />} onClick={() => handleReject(row.id)}>Reject</Button>
        </div>
      )
    )},
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar userType="admin" />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Payouts Management</h1>
            <Card>
              <Table columns={columns} data={payouts} loading={loading} />
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Payouts;
