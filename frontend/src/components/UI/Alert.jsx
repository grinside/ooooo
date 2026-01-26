import React from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

const Alert = ({
  type = 'info',
  title,
  message,
  onClose,
  className = '',
  icon: CustomIcon,
}) => {
  const config = {
    success: {
      bgColor: 'bg-success-50',
      borderColor: 'border-success-200',
      textColor: 'text-success-800',
      iconColor: 'text-success-500',
      Icon: CheckCircle,
    },
    error: {
      bgColor: 'bg-error-50',
      borderColor: 'border-error-200',
      textColor: 'text-error-800',
      iconColor: 'text-error-500',
      Icon: AlertCircle,
    },
    warning: {
      bgColor: 'bg-warning-50',
      borderColor: 'border-warning-200',
      textColor: 'text-warning-800',
      iconColor: 'text-warning-500',
      Icon: AlertTriangle,
    },
    info: {
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-500',
      Icon: Info,
    },
  };

  const { bgColor, borderColor, textColor, iconColor, Icon } = config[type];
  const IconComponent = CustomIcon || Icon;

  return (
    <div
      className={clsx(
        'rounded-lg border p-4',
        bgColor,
        borderColor,
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <IconComponent className={clsx('flex-shrink-0', iconColor)} size={20} />

        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={clsx('font-semibold mb-1', textColor)}>
              {title}
            </h4>
          )}

          {message && (
            <p className={clsx('text-sm', textColor)}>
              {message}
            </p>
          )}
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className={clsx(
              'flex-shrink-0 p-1 rounded-lg transition-colors',
              textColor,
              'hover:bg-white hover:bg-opacity-50'
            )}
            aria-label="Close alert"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;
