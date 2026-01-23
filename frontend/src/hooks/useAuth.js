import { useNavigate } from 'react-router-dom';
import useAuthStore from '@store/authStore';
import affiliateService from '@services/affiliateService';
import adminService from '@services/adminService';
import toast from 'react-hot-toast';

const useAuth = () => {
  const navigate = useNavigate();
  const {
    user,
    token,
    userType,
    isAuthenticated,
    setAuth,
    updateUser,
    logout: logoutStore,
    hasPermission,
    isAdmin,
    isAffiliate,
  } = useAuthStore();

  // Affiliate login
  const affiliateLogin = async (phone, pin) => {
    try {
      const response = await affiliateService.login(phone, pin);

      if (response.success) {
        setAuth(response.data.affiliate, response.data.token, 'affiliate');
        toast.success('Login successful!');
        navigate('/affiliate/dashboard');
        return true;
      }

      toast.error(response.message || 'Login failed');
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  // Admin login
  const adminLogin = async (email, password) => {
    try {
      const response = await adminService.login(email, password);

      if (response.success) {
        setAuth(response.data.admin, response.data.token, 'admin');
        toast.success('Login successful!');
        navigate('/admin/dashboard');
        return true;
      }

      toast.error(response.message || 'Login failed');
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  // Affiliate registration
  const affiliateRegister = async (data) => {
    try {
      const response = await affiliateService.register(data);

      if (response.success) {
        setAuth(response.data.affiliate, response.data.token, 'affiliate');
        toast.success('Registration successful!');
        navigate('/affiliate/dashboard');
        return true;
      }

      toast.error(response.message || 'Registration failed');
      return false;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  // Logout
  const logout = async () => {
    try {
      if (userType === 'affiliate') {
        await affiliateService.logout();
      } else if (userType === 'admin') {
        await adminService.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      logoutStore();
      toast.success('Logged out successfully');

      // Navigate to appropriate login page
      if (userType === 'admin') {
        navigate('/admin/login');
      } else {
        navigate('/affiliate/login');
      }
    }
  };

  // Check if authenticated
  const checkAuth = () => {
    return isAuthenticated && token;
  };

  // Refresh user profile
  const refreshProfile = async () => {
    try {
      if (!isAuthenticated) return;

      if (userType === 'affiliate') {
        const response = await affiliateService.getProfile();
        if (response.success) {
          updateUser(response.data);
        }
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  return {
    user,
    token,
    userType,
    isAuthenticated,
    affiliateLogin,
    adminLogin,
    affiliateRegister,
    logout,
    checkAuth,
    updateUser,
    refreshProfile,
    hasPermission,
    isAdmin,
    isAffiliate,
  };
};

export default useAuth;
