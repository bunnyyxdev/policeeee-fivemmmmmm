'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'secondary';
  isLoading?: boolean;
  description?: string;
  children: React.ReactNode;
}

export default function Button({
  variant = 'primary',
  isLoading = false,
  description,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700 focus:ring-blue-500',
    success: 'bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700 focus:ring-green-500',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500 hover:border-yellow-600 focus:ring-yellow-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700 focus:ring-red-500',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 border-gray-300 hover:border-gray-400 focus:ring-gray-400',
  };

  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-smooth border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm hover:shadow-md hover-lift button-press disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none flex items-center justify-center';

  return (
    <div className="flex flex-col">
      <button
        className={`${baseClasses} ${variantClasses[variant]} ${className} ${isLoading || disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={isLoading || disabled}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>กำลังประมวลผล...</span>
          </span>
        ) : (
          children
        )}
      </button>
      {description && (
        <p className={`text-xs mt-1 ${variant === 'warning' || variant === 'danger' ? 'text-red-600' : 'text-gray-500'}`}>
          {description}
        </p>
      )}
    </div>
  );
}
