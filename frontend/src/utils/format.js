import { format as dateFnsFormat, formatDistance, formatDistanceToNow, parseISO } from 'date-fns';
import { CURRENCIES } from './constants';

/**
 * Format currency with symbol
 */
export const formatCurrency = (amount, currency = 'XOF') => {
  if (amount === null || amount === undefined) return '-';

  const currencyInfo = CURRENCIES[currency];
  const symbol = currencyInfo?.symbol || currency;

  // Format number with thousand separators
  const formattedAmount = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  return `${formattedAmount} ${symbol}`;
};

/**
 * Format number with thousand separators
 */
export const formatNumber = (number, decimals = 0) => {
  if (number === null || number === undefined) return '-';

  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
};

/**
 * Format percentage
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined) return '-';

  return `${formatNumber(value, decimals)}%`;
};

/**
 * Format date
 */
export const formatDate = (date, formatStr = 'dd/MM/yyyy') => {
  if (!date) return '-';

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return dateFnsFormat(dateObj, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
};

/**
 * Format date and time
 */
export const formatDateTime = (date, formatStr = 'dd/MM/yyyy HH:mm') => {
  return formatDate(date, formatStr);
};

/**
 * Format time only
 */
export const formatTime = (date, formatStr = 'HH:mm:ss') => {
  return formatDate(date, formatStr);
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date) => {
  if (!date) return '-';

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return '-';
  }
};

/**
 * Format distance between two dates
 */
export const formatDateDistance = (startDate, endDate) => {
  if (!startDate || !endDate) return '-';

  try {
    const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
    const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
    return formatDistance(start, end);
  } catch (error) {
    console.error('Error formatting date distance:', error);
    return '-';
  }
};

/**
 * Format phone number
 */
export const formatPhone = (phone) => {
  if (!phone) return '-';

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Format based on length
  if (cleaned.length === 9) {
    return cleaned.replace(/(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4');
  }

  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
  }

  if (cleaned.length > 10) {
    // International format
    return `+${cleaned}`;
  }

  return phone;
};

/**
 * Format file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  if (!bytes) return '-';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;

  return `${text.substring(0, maxLength)}...`;
};

/**
 * Format status badge
 */
export const formatStatus = (status) => {
  if (!status) return '';

  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Format commission type
 */
export const formatCommissionType = (type) => {
  const types = {
    direct: 'Direct Sale',
    level_1: 'Level 1',
    level_2: 'Level 2',
    level_3: 'Level 3',
    bonus: 'Bonus',
  };

  return types[type] || type;
};

/**
 * Format duration in seconds to readable format
 */
export const formatDuration = (seconds) => {
  if (!seconds || seconds < 0) return '0s';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];

  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
};

/**
 * Capitalize first letter
 */
export const capitalize = (text) => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Format reference code
 */
export const formatReference = (reference) => {
  if (!reference) return '-';

  // Insert dash every 4 characters for readability
  return reference.match(/.{1,4}/g)?.join('-') || reference;
};

/**
 * Shorten hash/ID for display
 */
export const shortenHash = (hash, startChars = 6, endChars = 4) => {
  if (!hash) return '-';
  if (hash.length <= startChars + endChars) return hash;

  return `${hash.substring(0, startChars)}...${hash.substring(hash.length - endChars)}`;
};

/**
 * Format array as comma-separated list
 */
export const formatList = (items, conjunction = 'and') => {
  if (!items || items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;

  const last = items[items.length - 1];
  const rest = items.slice(0, -1);

  return `${rest.join(', ')}, ${conjunction} ${last}`;
};

export default {
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatDate,
  formatDateTime,
  formatTime,
  formatRelativeTime,
  formatDateDistance,
  formatPhone,
  formatFileSize,
  truncateText,
  formatStatus,
  formatCommissionType,
  formatDuration,
  capitalize,
  formatReference,
  shortenHash,
  formatList,
};
