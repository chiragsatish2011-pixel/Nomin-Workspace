import React from 'react';
import './Button.css';

export function Button({ 
  variant = 'primary', 
  children, 
  className = '', 
  ...props 
}) {
  const baseClass = 'btn';
  const variantClass = `btn-${variant}`;
  
  return (
    <button 
      className={`${baseClass} ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
