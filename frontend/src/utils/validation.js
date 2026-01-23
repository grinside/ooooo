import { PHONE_REGEX, EMAIL_REGEX, PIN_LENGTH } from './constants';

/**
 * Validate email address
 */
export const validateEmail = (email) => {
  if (!email) {
    return { valid: false, message: 'Email is required' };
  }

  if (!EMAIL_REGEX.test(email)) {
    return { valid: false, message: 'Invalid email format' };
  }

  return { valid: true };
};

/**
 * Validate phone number
 */
export const validatePhone = (phone) => {
  if (!phone) {
    return { valid: false, message: 'Phone number is required' };
  }

  // Remove spaces and dashes
  const cleaned = phone.replace(/[\s-]/g, '');

  if (!PHONE_REGEX.test(cleaned)) {
    return { valid: false, message: 'Invalid phone number format' };
  }

  // Check minimum length (8 digits)
  const digits = cleaned.replace(/\D/g, '');
  if (digits.length < 8) {
    return { valid: false, message: 'Phone number must be at least 8 digits' };
  }

  return { valid: true };
};

/**
 * Validate PIN
 */
export const validatePin = (pin) => {
  if (!pin) {
    return { valid: false, message: 'PIN is required' };
  }

  if (pin.length !== PIN_LENGTH) {
    return { valid: false, message: `PIN must be ${PIN_LENGTH} digits` };
  }

  if (!/^\d+$/.test(pin)) {
    return { valid: false, message: 'PIN must contain only digits' };
  }

  // Check for weak PINs
  const weakPins = ['0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '1234', '4321'];
  if (weakPins.includes(pin)) {
    return { valid: false, message: 'PIN is too weak. Please choose a stronger PIN' };
  }

  return { valid: true };
};

/**
 * Validate password
 */
export const validatePassword = (password) => {
  if (!password) {
    return { valid: false, message: 'Password is required' };
  }

  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }

  return { valid: true };
};

/**
 * Validate name
 */
export const validateName = (name, fieldName = 'Name') => {
  if (!name) {
    return { valid: false, message: `${fieldName} is required` };
  }

  if (name.length < 2) {
    return { valid: false, message: `${fieldName} must be at least 2 characters` };
  }

  if (name.length > 100) {
    return { valid: false, message: `${fieldName} must not exceed 100 characters` };
  }

  if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(name)) {
    return { valid: false, message: `${fieldName} contains invalid characters` };
  }

  return { valid: true };
};

/**
 * Validate required field
 */
export const validateRequired = (value, fieldName = 'Field') => {
  if (value === null || value === undefined || value === '') {
    return { valid: false, message: `${fieldName} is required` };
  }

  if (typeof value === 'string' && value.trim() === '') {
    return { valid: false, message: `${fieldName} is required` };
  }

  return { valid: true };
};

/**
 * Validate amount
 */
export const validateAmount = (amount, min = 0, max = null) => {
  if (!amount && amount !== 0) {
    return { valid: false, message: 'Amount is required' };
  }

  const numAmount = parseFloat(amount);

  if (isNaN(numAmount)) {
    return { valid: false, message: 'Invalid amount' };
  }

  if (numAmount < min) {
    return { valid: false, message: `Amount must be at least ${min}` };
  }

  if (max !== null && numAmount > max) {
    return { valid: false, message: `Amount must not exceed ${max}` };
  }

  return { valid: true };
};

/**
 * Validate country code
 */
export const validateCountryCode = (code) => {
  if (!code) {
    return { valid: false, message: 'Country is required' };
  }

  if (!/^[A-Z]{2}$/.test(code)) {
    return { valid: false, message: 'Invalid country code format' };
  }

  return { valid: true };
};

/**
 * Validate URL
 */
export const validateUrl = (url) => {
  if (!url) {
    return { valid: false, message: 'URL is required' };
  }

  try {
    new URL(url);
    return { valid: true };
  } catch (error) {
    return { valid: false, message: 'Invalid URL format' };
  }
};

/**
 * Validate file
 */
export const validateFile = (file, maxSize = 5 * 1024 * 1024, allowedTypes = []) => {
  if (!file) {
    return { valid: false, message: 'File is required' };
  }

  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
    return { valid: false, message: `File size must not exceed ${maxSizeMB}MB` };
  }

  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return { valid: false, message: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}` };
  }

  return { valid: true };
};

/**
 * Validate date
 */
export const validateDate = (date, minDate = null, maxDate = null) => {
  if (!date) {
    return { valid: false, message: 'Date is required' };
  }

  const dateObj = new Date(date);

  if (isNaN(dateObj.getTime())) {
    return { valid: false, message: 'Invalid date format' };
  }

  if (minDate && dateObj < new Date(minDate)) {
    return { valid: false, message: 'Date is too early' };
  }

  if (maxDate && dateObj > new Date(maxDate)) {
    return { valid: false, message: 'Date is too late' };
  }

  return { valid: true };
};

/**
 * Validate affiliate code
 */
export const validateAffiliateCode = (code) => {
  if (!code) {
    return { valid: false, message: 'Affiliate code is required' };
  }

  if (code.length < 6 || code.length > 20) {
    return { valid: false, message: 'Invalid affiliate code format' };
  }

  if (!/^[A-Z0-9]+$/.test(code)) {
    return { valid: false, message: 'Affiliate code must contain only uppercase letters and numbers' };
  }

  return { valid: true };
};

/**
 * Validate form data
 */
export const validateForm = (data, rules) => {
  const errors = {};

  Object.keys(rules).forEach((field) => {
    const rule = rules[field];
    const value = data[field];

    // Required validation
    if (rule.required) {
      const result = validateRequired(value, rule.label || field);
      if (!result.valid) {
        errors[field] = result.message;
        return;
      }
    }

    // Skip other validations if field is not required and empty
    if (!rule.required && !value) {
      return;
    }

    // Type-specific validation
    if (rule.type === 'email') {
      const result = validateEmail(value);
      if (!result.valid) errors[field] = result.message;
    } else if (rule.type === 'phone') {
      const result = validatePhone(value);
      if (!result.valid) errors[field] = result.message;
    } else if (rule.type === 'pin') {
      const result = validatePin(value);
      if (!result.valid) errors[field] = result.message;
    } else if (rule.type === 'password') {
      const result = validatePassword(value);
      if (!result.valid) errors[field] = result.message;
    } else if (rule.type === 'name') {
      const result = validateName(value, rule.label);
      if (!result.valid) errors[field] = result.message;
    } else if (rule.type === 'amount') {
      const result = validateAmount(value, rule.min, rule.max);
      if (!result.valid) errors[field] = result.message;
    } else if (rule.type === 'url') {
      const result = validateUrl(value);
      if (!result.valid) errors[field] = result.message;
    }

    // Custom validation function
    if (rule.validate && typeof rule.validate === 'function') {
      const result = rule.validate(value, data);
      if (!result.valid) errors[field] = result.message;
    }

    // Min length
    if (rule.minLength && value.length < rule.minLength) {
      errors[field] = `${rule.label || field} must be at least ${rule.minLength} characters`;
    }

    // Max length
    if (rule.maxLength && value.length > rule.maxLength) {
      errors[field] = `${rule.label || field} must not exceed ${rule.maxLength} characters`;
    }

    // Pattern matching
    if (rule.pattern && !rule.pattern.test(value)) {
      errors[field] = rule.patternMessage || `${rule.label || field} format is invalid`;
    }
  });

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

export default {
  validateEmail,
  validatePhone,
  validatePin,
  validatePassword,
  validateName,
  validateRequired,
  validateAmount,
  validateCountryCode,
  validateUrl,
  validateFile,
  validateDate,
  validateAffiliateCode,
  validateForm,
};
