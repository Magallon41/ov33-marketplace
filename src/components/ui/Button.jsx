import React from 'react';
import './Button.css';

export function Button({ variant = 'primary', className = '', children, ...props }) {
  const baseClass = 'btn';
  const variantClass = variant === 'primary' ? 'btn-primary' : 'btn-ghost';
  
  return (
    <button className={`${baseClass} ${variantClass} ${className}`} {...props}>
      {children}
    </button>
  );
}
