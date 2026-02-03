
import React from 'react';

interface ShadowCardProps {
  children: React.ReactNode;
  variant?: 'solid' | 'glass' | 'outline';
  className?: string;
  noPadding?: boolean;
}

export const ShadowCard: React.FC<ShadowCardProps> = ({ 
  children, 
  variant = 'solid', 
  className = '',
  noPadding = false 
}) => {
  const baseStyles = "rounded-lg transition-all duration-500 border overflow-hidden";
  
  const variants = {
    solid: "bg-shadow-gray-900 border-shadow-gray-800",
    glass: "glass-panel-light border-white/5",
    outline: "bg-transparent border-shadow-gray-700"
  };

  const padding = noPadding ? "" : "p-6 md:p-8";

  return (
    <div className={`${baseStyles} ${variants[variant]} ${padding} ${className}`}>
      {children}
    </div>
  );
};
