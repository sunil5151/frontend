import React from 'react';

const Card = ({ children, className = '', onClick, hover = false }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl shadow-lg p-6 ${
        hover ? 'hover:shadow-xl transition cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '' }) => {
  return <div className={`mb-4 ${className}`}>{children}</div>;
};

const CardTitle = ({ children, className = '' }) => {
  return <h2 className={`text-xl font-bold text-gray-900 ${className}`}>{children}</h2>;
};

const CardDescription = ({ children, className = '' }) => {
  return <p className={`text-gray-600 text-sm ${className}`}>{children}</p>;
};

const CardContent = ({ children, className = '' }) => {
  return <div className={className}>{children}</div>;
};

const CardFooter = ({ children, className = '' }) => {
  return <div className={`mt-4 pt-4 border-t border-gray-200 ${className}`}>{children}</div>;
};

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
