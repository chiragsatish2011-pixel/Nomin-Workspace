import React from 'react';
import './Badge.css';

export function Badge({ 
  variant = 'neutral', 
  children, 
  className = '', 
  ...props 
}) {
  const baseClass = 'badge';
  const variantClass = `badge-${variant}`;
  
  return (
    <span 
      className={`${baseClass} ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
