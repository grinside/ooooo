import React, { useEffect, useState } from 'react';
import { Activity, Database, Server, AlertCircle } from 'lucide-react';
import Header from '@components/Layout/Header';
import Sidebar from '@components/Layout/Sidebar';
import Card from '@components/UI/Card';
import Badge from '@components/UI/Badge';
import Button from '@components/UI/Button';
import adminService from '@services/adminService';
import toast from 'react-hot-toast';

const System = () => {
  const [health, setHealth] = useState(null);
  const [queue, setQueue] = useState(null);

  useEffect(() => {
    fetchSystemInfo();
  }, []);

  const fetchSystemInfo = async () => {
    try {
      const [healthRes, queueRes] = await Promise.all([
        adminService.getSystemHealth(),
        adminService.getQueueStatus(),
      ]);
      if (healthRes.success) setHealth(healthRes.data);
      if (queueRes.success) setQueue(queueRes.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleClearCache = async () => {
    try {
      await adminService.clearCache();
      toast.success('Cache cleared');
    } catch (error) {
      toast.error('Failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar userType="admin" />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">System Health</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
                    <Database className="text-success-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Database</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="success" dot>Connected</Badge>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Server className="text-primary-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">API Server</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="success" dot>Online</Badge>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
                    <Activity className="text-warning-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Queue</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="warning">{queue?.pending || 0} Pending</Badge>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card title="Queue Status">
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Pending Jobs</span>
                    <span className="font-bold">{queue?.pending || 0}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Failed Jobs</span>
                    <span className="font-bold text-error-600">{queue?.failed || 0}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Completed</span>
                    <span className="font-bold text-success-600">{queue?.completed || 0}</span>
                  </div>
                </div>
              </Card>

              <Card title="System Actions">
                <div className="space-y-3">
                  <Button variant="outline" fullWidth icon={<AlertCircle size={18} />} onClick={handleClearCache}>
                    Clear Cache
                  </Button>
                  <Button variant="outline" fullWidth>View Logs</Button>
                  <Button variant="outline" fullWidth>Database Backup</Button>
                  <Button variant="danger" fullWidth>Restart Services</Button>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default System;
