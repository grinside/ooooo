import React, { forwardRef } from 'react';
import clsx from 'clsx';

const Input = forwardRef(({
  label,
  type = 'text',
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  helperText,
  required = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  className = '',
  inputClassName = '',
  ...props
}, ref) => {
  const hasError = !!error;

  const inputClasses = clsx(
    'w-full px-4 py-2.5 rounded-lg border transition-all duration-200',
    'text-gray-900 placeholder-gray-400',
    'focus:outline-none focus:ring-2',
    {
      'border-gray-300 focus:border-primary-500 focus:ring-primary-500/20': !hasError,
      'border-error-500 focus:border-error-500 focus:ring-error-500/20': hasError,
      'opacity-50 cursor-not-allowed': disabled,
      'pl-10': icon && iconPosition === 'left',
      'pr-10': icon && iconPosition === 'right',
    },
    inputClassName
  );

  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}

        <input
          ref={ref}
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={inputClasses}
          {...props}
        />

        {icon && iconPosition === 'right' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
      </div>

      {(error || helperText) && (
        <p className={clsx(
          'mt-1.5 text-sm',
          hasError ? 'text-error-500' : 'text-gray-500'
        )}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
