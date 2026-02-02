
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
    outline: "bg-transparent border-shadow-gray-700",
    orange: "bg-shadow-gray-900 border-[#FF7A00]/20 shadow-[0_0_15px_rgba(255,122,0,0.05)]"
  };

  const padding = noPadding ? "" : "p-lg md:p-xl";

  return (
    <div className={`${baseStyles} ${variants[variant]} ${padding} ${className}`}>
      {children}
    </div>
  );
};
