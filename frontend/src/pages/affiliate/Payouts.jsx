import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import Header from '@components/Layout/Header';
import Sidebar from '@components/Layout/Sidebar';
import Card from '@components/UI/Card';
import Table from '@components/UI/Table';
import Badge from '@components/UI/Badge';
import Button from '@components/UI/Button';
import Modal from '@components/UI/Modal';
import Input from '@components/UI/Input';
import affiliateService from '@services/affiliateService';
import { formatDate, formatCurrency } from '@utils/format';
import { PAYOUT_STATUS } from '@utils/constants';
import toast from 'react-hot-toast';

const Payouts = () => {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');

  useEffect(() => {
    fetchPayouts();
  }, []);

  const fetchPayouts = async () => {
    try {
      const response = await affiliateService.getPayouts();
      if (response.success) setPayouts(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPayout = async () => {
    try {
      const response = await affiliateService.requestPayout({ amount });
      if (response.success) {
        toast.success('Payout requested successfully');
        setShowModal(false);
        fetchPayouts();
      }
    } catch (error) {
      toast.error('Failed to request payout');
    }
  };

  const columns = [
    { key: 'reference', label: 'Reference' },
    { key: 'amount', label: 'Amount', render: (val, row) => formatCurrency(val, row.currency) },
    { key: 'status', label: 'Status', render: (val) => {
      const status = PAYOUT_STATUS[val?.toUpperCase()];
      return <Badge variant={status?.color}>{status?.label}</Badge>;
    }},
    { key: 'requested_at', label: 'Requested', render: (val) => formatDate(val) },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar userType="affiliate" />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">Payouts</h1>
              <Button icon={<Plus size={18} />} onClick={() => setShowModal(true)}>
                Request Payout
              </Button>
            </div>
            <Card>
              <Table columns={columns} data={payouts} loading={loading} />
            </Card>
          </div>
        </main>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Request Payout">
        <Input label="Amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <div className="mt-4">
          <Button variant="primary" fullWidth onClick={handleRequestPayout}>Submit Request</Button>
        </div>
      </Modal>
    </div>
  );
};

export default Payouts;
