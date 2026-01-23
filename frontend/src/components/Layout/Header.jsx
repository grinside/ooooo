import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, User, LayoutDashboard } from 'lucide-react';
import useAuthStore from '@store/authStore';
import useAppStore from '@store/appStore';
import useAuth from '@hooks/useAuth';
import Button from '@components/UI/Button';

const Header = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, userType } = useAuthStore();
  const { logout } = useAuth();
  const { sidebarOpen, toggleSidebar } = useAppStore();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">M</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Max IT TV</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/"
                  className="text-gray-600 hover:text-primary-500 transition-colors"
                >
                  Home
                </Link>
                <Link
                  to="/affiliate/register"
                  className="text-gray-600 hover:text-primary-500 transition-colors"
                >
                  Become an Affiliate
                </Link>
                <Link
                  to="/affiliate/login"
                  className="text-gray-600 hover:text-primary-500 transition-colors"
                >
                  Affiliate Login
                </Link>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/affiliate/register')}
                >
                  Get Started
                </Button>
              </>
            ) : (
              <>
                <Link
                  to={userType === 'admin' ? '/admin/dashboard' : '/affiliate/dashboard'}
                  className="flex items-center gap-2 text-gray-600 hover:text-primary-500 transition-colors"
                >
                  <LayoutDashboard size={18} />
                  Dashboard
                </Link>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                    <User size={16} className="text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">
                      {user?.name || user?.email}
                    </span>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<LogOut size={16} />}
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                </div>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={toggleSidebar}
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {sidebarOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/"
                  className="text-gray-600 hover:text-primary-500 transition-colors py-2"
                  onClick={toggleSidebar}
                >
                  Home
                </Link>
                <Link
                  to="/affiliate/register"
                  className="text-gray-600 hover:text-primary-500 transition-colors py-2"
                  onClick={toggleSidebar}
                >
                  Become an Affiliate
                </Link>
                <Link
                  to="/affiliate/login"
                  className="text-gray-600 hover:text-primary-500 transition-colors py-2"
                  onClick={toggleSidebar}
                >
                  Affiliate Login
                </Link>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => {
                    navigate('/affiliate/register');
                    toggleSidebar();
                  }}
                >
                  Get Started
                </Button>
              </>
            ) : (
              <>
                <Link
                  to={userType === 'admin' ? '/admin/dashboard' : '/affiliate/dashboard'}
                  className="flex items-center gap-2 text-gray-600 hover:text-primary-500 transition-colors py-2"
                  onClick={toggleSidebar}
                >
                  <LayoutDashboard size={18} />
                  Dashboard
                </Link>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <User size={16} className="text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">
                      {user?.name || user?.email}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    fullWidth
                    icon={<LogOut size={16} />}
                    onClick={() => {
                      handleLogout();
                      toggleSidebar();
                    }}
                  >
                    Logout
                  </Button>
                </div>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
