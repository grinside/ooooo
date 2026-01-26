import React from 'react';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

const Loader = ({
  size = 'md',
  text,
  fullScreen = false,
  className = '',
}) => {
  const sizeMap = {
    sm: 20,
    md: 32,
    lg: 48,
    xl: 64,
  };

  const loader = (
    <div className={clsx('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2
        size={sizeMap[size]}
        className="animate-spin text-primary-500"
      />
      {text && (
        <p className="text-sm text-gray-600 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90 backdrop-blur-sm">
        {loader}
      </div>
    );
  }

  return loader;
};

// Inline loader for small spaces
export const InlineLoader = ({ size = 16, className = '' }) => (
  <Loader2
    size={size}
    className={clsx('animate-spin text-primary-500', className)}
  />
);

// Skeleton loader for content placeholders
export const Skeleton = ({ className = '', width, height }) => (
  <div
    className={clsx(
      'animate-pulse bg-gray-200 rounded',
      className
    )}
    style={{ width, height }}
  />
);

export default Loader;
