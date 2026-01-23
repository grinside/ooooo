// API Base URL
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// App Information
export const APP_NAME = 'Max IT TV';
export const APP_VERSION = '1.0.0';

// Countries
export const COUNTRIES = [
  { code: 'SN', name: 'Senegal', flag: '🇸🇳', currency: 'XOF', phone: '+221' },
  { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮', currency: 'XOF', phone: '+225' },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫', currency: 'XOF', phone: '+226' },
  { code: 'ML', name: 'Mali', flag: '🇲🇱', currency: 'XOF', phone: '+223' },
  { code: 'BJ', name: 'Benin', flag: '🇧🇯', currency: 'XOF', phone: '+229' },
  { code: 'TG', name: 'Togo', flag: '🇹🇬', currency: 'XOF', phone: '+228' },
  { code: 'NE', name: 'Niger', flag: '🇳🇪', currency: 'XOF', phone: '+227' },
  { code: 'GN', name: 'Guinea', flag: '🇬🇳', currency: 'GNF', phone: '+224' },
  { code: 'CM', name: 'Cameroon', flag: '🇨🇲', currency: 'XAF', phone: '+237' },
  { code: 'GA', name: 'Gabon', flag: '🇬🇦', currency: 'XAF', phone: '+241' },
];

// Currencies
export const CURRENCIES = {
  XOF: { symbol: 'CFA', name: 'West African CFA franc' },
  XAF: { symbol: 'FCFA', name: 'Central African CFA franc' },
  GNF: { symbol: 'FG', name: 'Guinean franc' },
  EUR: { symbol: '€', name: 'Euro' },
  USD: { symbol: '$', name: 'US Dollar' },
};

// Payment Providers
export const PAYMENT_PROVIDERS = {
  ORANGE_MONEY: {
    id: 'orange_money',
    name: 'Orange Money',
    icon: '📱',
    countries: ['SN', 'CI', 'BF', 'ML', 'NE', 'GN', 'CM'],
  },
  WAVE: {
    id: 'wave',
    name: 'Wave',
    icon: '💳',
    countries: ['SN', 'CI'],
  },
  MTN_MOBILE_MONEY: {
    id: 'mtn_mobile_money',
    name: 'MTN Mobile Money',
    icon: '📲',
    countries: ['CI', 'CM', 'BJ', 'GN'],
  },
  MOOV_MONEY: {
    id: 'moov_money',
    name: 'Moov Money',
    icon: '💰',
    countries: ['BF', 'BJ', 'TG', 'CI'],
  },
  STRIPE: {
    id: 'stripe',
    name: 'Card Payment (Stripe)',
    icon: '💳',
    countries: ['all'],
  },
};

// Subscription Status
export const SUBSCRIPTION_STATUS = {
  PENDING: { value: 'pending', label: 'Pending', color: 'warning' },
  ACTIVE: { value: 'active', label: 'Active', color: 'success' },
  EXPIRED: { value: 'expired', label: 'Expired', color: 'error' },
  CANCELLED: { value: 'cancelled', label: 'Cancelled', color: 'error' },
  SUSPENDED: { value: 'suspended', label: 'Suspended', color: 'warning' },
};

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: { value: 'pending', label: 'Pending', color: 'warning' },
  PROCESSING: { value: 'processing', label: 'Processing', color: 'info' },
  COMPLETED: { value: 'completed', label: 'Completed', color: 'success' },
  FAILED: { value: 'failed', label: 'Failed', color: 'error' },
  CANCELLED: { value: 'cancelled', label: 'Cancelled', color: 'error' },
  REFUNDED: { value: 'refunded', label: 'Refunded', color: 'warning' },
};

// Affiliate Status
export const AFFILIATE_STATUS = {
  PENDING: { value: 'pending', label: 'Pending Approval', color: 'warning' },
  ACTIVE: { value: 'active', label: 'Active', color: 'success' },
  SUSPENDED: { value: 'suspended', label: 'Suspended', color: 'error' },
  REJECTED: { value: 'rejected', label: 'Rejected', color: 'error' },
};

// Payout Status
export const PAYOUT_STATUS = {
  PENDING: { value: 'pending', label: 'Pending', color: 'warning' },
  APPROVED: { value: 'approved', label: 'Approved', color: 'info' },
  PROCESSING: { value: 'processing', label: 'Processing', color: 'info' },
  COMPLETED: { value: 'completed', label: 'Completed', color: 'success' },
  REJECTED: { value: 'rejected', label: 'Rejected', color: 'error' },
  FAILED: { value: 'failed', label: 'Failed', color: 'error' },
};

// Commission Types
export const COMMISSION_TYPES = {
  DIRECT: { value: 'direct', label: 'Direct Sale', icon: '👤' },
  LEVEL_1: { value: 'level_1', label: 'Level 1', icon: '🥇' },
  LEVEL_2: { value: 'level_2', label: 'Level 2', icon: '🥈' },
  LEVEL_3: { value: 'level_3', label: 'Level 3', icon: '🥉' },
  BONUS: { value: 'bonus', label: 'Bonus', icon: '🎁' },
};

// Date Range Presets
export const DATE_RANGES = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'This month', value: 'month' },
  { label: 'Last month', value: 'last_month' },
  { label: 'This year', value: 'year' },
  { label: 'All time', value: 'all' },
];

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// File Upload
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

// Validation
export const PHONE_REGEX = /^[+]?[0-9]{8,15}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PIN_LENGTH = 4;

// Social Share
export const SHARE_URLS = {
  whatsapp: (text, url) => `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
  facebook: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  twitter: (text, url) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  telegram: (text, url) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
};

// Chart Colors
export const CHART_COLORS = {
  primary: '#FF6B00',
  secondary: '#0066FF',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  purple: '#8B5CF6',
  pink: '#EC4899',
};

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  USER_TYPE: 'userType',
  THEME: 'theme',
  AFFILIATE_CODE: 'affiliateCode',
  LANGUAGE: 'language',
};

// Routes
export const ROUTES = {
  HOME: '/',
  AFFILIATE_REGISTER: '/affiliate/register',
  AFFILIATE_LOGIN: '/affiliate/login',
  AFFILIATE_DASHBOARD: '/affiliate/dashboard',
  ADMIN_LOGIN: '/admin/login',
  ADMIN_DASHBOARD: '/admin/dashboard',
};

export default {
  API_URL,
  APP_NAME,
  APP_VERSION,
  COUNTRIES,
  CURRENCIES,
  PAYMENT_PROVIDERS,
  SUBSCRIPTION_STATUS,
  PAYMENT_STATUS,
  AFFILIATE_STATUS,
  PAYOUT_STATUS,
  COMMISSION_TYPES,
  DATE_RANGES,
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  MAX_FILE_SIZE,
  ALLOWED_IMAGE_TYPES,
  PHONE_REGEX,
  EMAIL_REGEX,
  PIN_LENGTH,
  SHARE_URLS,
  CHART_COLORS,
  STORAGE_KEYS,
  ROUTES,
};
