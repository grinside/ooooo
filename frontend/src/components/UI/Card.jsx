import React from 'react';
import clsx from 'clsx';

const Card = ({
  children,
  title,
  subtitle,
  headerAction,
  footer,
  className = '',
  padding = 'default',
  hover = false,
  onClick,
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8',
  };

  const cardClasses = clsx(
    'bg-white rounded-lg shadow-card transition-all duration-200',
    {
      'hover:shadow-card-hover cursor-pointer': hover,
      'border border-gray-100': true,
    },
    className
  );

  return (
    <div className={cardClasses} onClick={onClick}>
      {(title || subtitle || headerAction) && (
        <div className={clsx('border-b border-gray-100', paddingClasses[padding], 'pb-4')}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {title && (
                <h3 className="text-lg font-semibold text-gray-900">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-gray-500">
                  {subtitle}
                </p>
              )}
            </div>
            {headerAction && (
              <div className="ml-4 flex-shrink-0">
                {headerAction}
              </div>
            )}
          </div>
        </div>
      )}

      <div className={clsx({
        [paddingClasses[padding]]: !title && !subtitle && !headerAction,
        [`${paddingClasses[padding]} pt-4`]: title || subtitle || headerAction,
      })}>
        {children}
      </div>

      {footer && (
        <div className={clsx('border-t border-gray-100', paddingClasses[padding], 'pt-4')}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
