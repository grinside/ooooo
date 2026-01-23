import React from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  className = '',
  type = 'button',
  onClick,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500 shadow-sm hover:shadow-md',
    secondary: 'bg-secondary-500 text-white hover:bg-secondary-600 focus:ring-secondary-500 shadow-sm hover:shadow-md',
    outline: 'border-2 border-primary-500 text-primary-500 hover:bg-primary-50 focus:ring-primary-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-300',
    danger: 'bg-error-500 text-white hover:bg-error-600 focus:ring-error-500 shadow-sm hover:shadow-md',
    success: 'bg-success-500 text-white hover:bg-success-600 focus:ring-success-500 shadow-sm hover:shadow-md',
    link: 'text-primary-500 hover:text-primary-600 hover:underline focus:ring-primary-500',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-2.5',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        widthClass,
        className
      )}
      disabled={isDisabled}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <Loader2 className="animate-spin" size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
      )}

      {!loading && icon && iconPosition === 'left' && (
        <span className="flex-shrink-0">{icon}</span>
      )}

      <span>{children}</span>

      {!loading && icon && iconPosition === 'right' && (
        <span className="flex-shrink-0">{icon}</span>
      )}
    </button>
  );
};

export default Button;
