import React from 'react';
import clsx from 'clsx';

const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  icon,
  className = '',
}) => {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-primary-100 text-primary-800',
    secondary: 'bg-secondary-100 text-secondary-800',
    success: 'bg-success-100 text-success-800',
    warning: 'bg-warning-100 text-warning-800',
    error: 'bg-error-100 text-error-800',
    info: 'bg-blue-100 text-blue-800',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {dot && (
        <span
          className={clsx(
            'w-1.5 h-1.5 rounded-full',
            variant === 'success' && 'bg-success-500',
            variant === 'error' && 'bg-error-500',
            variant === 'warning' && 'bg-warning-500',
            variant === 'info' && 'bg-blue-500',
            variant === 'primary' && 'bg-primary-500',
            variant === 'secondary' && 'bg-secondary-500',
            variant === 'default' && 'bg-gray-500'
          )}
        />
      )}

      {icon && <span className="flex-shrink-0">{icon}</span>}

      {children}
    </span>
  );
};

export default Badge;
