import React, { useState } from 'react';
import { Download, Calendar } from 'lucide-react';
import Header from '@components/Layout/Header';
import Sidebar from '@components/Layout/Sidebar';
import Card from '@components/UI/Card';
import Button from '@components/UI/Button';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Reports = () => {
  const salesData = [
    { month: 'Jan', sales: 400, revenue: 2400 },
    { month: 'Feb', sales: 300, revenue: 1398 },
    { month: 'Mar', sales: 500, revenue: 9800 },
    { month: 'Apr', sales: 278, revenue: 3908 },
    { month: 'May', sales: 189, revenue: 4800 },
  ];

  const commissionData = [
    { name: 'Direct', value: 400, color: '#FF6B00' },
    { name: 'Level 1', value: 300, color: '#0066FF' },
    { name: 'Level 2', value: 200, color: '#10B981' },
    { name: 'Level 3', value: 100, color: '#F59E0B' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar userType="admin" />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">Reports & Analytics</h1>
              <div className="flex gap-3">
                <Button variant="outline" icon={<Calendar size={18} />}>Date Range</Button>
                <Button icon={<Download size={18} />}>Export Report</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card title="Sales & Revenue">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="sales" stroke="#FF6B00" />
                    <Line type="monotone" dataKey="revenue" stroke="#0066FF" />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              <Card title="Commission Distribution">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={commissionData} cx="50%" cy="50%" labelLine={false} label outerRadius={80} fill="#8884d8" dataKey="value">
                      {commissionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              <Card title="Monthly Performance">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sales" fill="#FF6B00" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card title="Quick Stats">
                <div className="space-y-4">
                  <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Total Affiliates</span>
                    <span className="font-bold">1,234</span>
                  </div>
                  <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Active Subscriptions</span>
                    <span className="font-bold">5,678</span>
                  </div>
                  <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Total Revenue</span>
                    <span className="font-bold text-success-600">2,450,000 CFA</span>
                  </div>
                  <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Commission Paid</span>
                    <span className="font-bold text-primary-600">450,000 CFA</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Reports;
