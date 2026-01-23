import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Header from '@components/Layout/Header';
import Sidebar from '@components/Layout/Sidebar';
import Card from '@components/UI/Card';
import Table from '@components/UI/Table';
import Badge from '@components/UI/Badge';
import Button from '@components/UI/Button';
import adminService from '@services/adminService';
import { formatCurrency } from '@utils/format';
import toast from 'react-hot-toast';

const Offers = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const response = await adminService.getOffers();
      if (response.success) setOffers(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return;
    try {
      await adminService.deleteOffer(id);
      toast.success('Offer deleted');
      fetchOffers();
    } catch (error) {
      toast.error('Failed');
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'price', label: 'Price', render: (val, row) => formatCurrency(val, row.currency) },
    { key: 'duration_days', label: 'Duration', render: (val) => `${val} days` },
    { key: 'country', label: 'Country' },
    { key: 'is_active', label: 'Status', render: (val) => <Badge variant={val ? 'success' : 'error'}>{val ? 'Active' : 'Inactive'}</Badge> },
    { key: 'actions', label: 'Actions', render: (val, row) => (
      <div className="flex gap-2">
        <Button size="sm" variant="outline" icon={<Edit size={14} />}>Edit</Button>
        <Button size="sm" variant="danger" icon={<Trash2 size={14} />} onClick={() => handleDelete(row.id)}>Delete</Button>
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
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">Offers Management</h1>
              <Button icon={<Plus size={18} />}>Create Offer</Button>
            </div>
            <Card>
              <Table columns={columns} data={offers} loading={loading} />
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Offers;
