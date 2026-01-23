import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  DollarSign,
  Package,
  BarChart3,
  Settings,
  Activity,
} from 'lucide-react';
import clsx from 'clsx';

const Sidebar = ({ userType = 'affiliate' }) => {
  const affiliateMenuItems = [
    { path: '/affiliate/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/affiliate/network', icon: Users, label: 'My Network' },
    { path: '/affiliate/commissions', icon: DollarSign, label: 'Commissions' },
    { path: '/affiliate/payouts', icon: ShoppingBag, label: 'Payouts' },
    { path: '/affiliate/qr-code', icon: Package, label: 'QR Code & Links' },
    { path: '/affiliate/profile', icon: Settings, label: 'Profile' },
  ];

  const adminMenuItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/affiliates', icon: Users, label: 'Affiliates' },
    { path: '/admin/subscriptions', icon: ShoppingBag, label: 'Subscriptions' },
    { path: '/admin/payouts', icon: DollarSign, label: 'Payouts' },
    { path: '/admin/offers', icon: Package, label: 'Offers' },
    { path: '/admin/reports', icon: BarChart3, label: 'Reports' },
    { path: '/admin/system', icon: Activity, label: 'System' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  const menuItems = userType === 'admin' ? adminMenuItems : affiliateMenuItems;

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <nav className="p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                  {
                    'bg-primary-50 text-primary-600 font-medium': isActive,
                    'text-gray-600 hover:bg-gray-50 hover:text-gray-900': !isActive,
                  }
                )
              }
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
