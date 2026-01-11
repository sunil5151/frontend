import React from 'react';

const Alert = ({ type = 'info', message, onClose, className = '' }) => {
  const types = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-600',
      icon: '✓',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-600',
      icon: '✕',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-600',
      icon: '⚠',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-600',
      icon: 'ℹ',
    },
  };

  const config = types[type];

  return (
    <div
      className={`p-4 rounded-lg border ${config.bg} ${config.border} ${className}`}
      role="alert"
    >
      <div className="flex items-start">
        <span className={`text-lg mr-3 ${config.text}`}>{config.icon}</span>
        <div className="flex-1">
          <p className={`text-sm ${config.text}`}>{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`ml-3 text-lg ${config.text} hover:opacity-70 transition`}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;
