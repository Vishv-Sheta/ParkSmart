import React from 'react';

const AnimatedBorder = ({ children, className = '' }) => {
  return (
    <div className={`animated-border ${className}`}>
      {children}
    </div>
  );
};

export default AnimatedBorder;