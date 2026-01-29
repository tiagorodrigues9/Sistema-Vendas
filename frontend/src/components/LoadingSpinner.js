import React from 'react';

const LoadingSpinner = ({ size = 'medium' }) => {
  const sizeClass = size === 'small' ? 'spinner-sm' : size === 'large' ? 'spinner-lg' : 'spinner';
  
  return (
    <div className="loading">
      <div className={sizeClass}></div>
    </div>
  );
};

export default LoadingSpinner;
