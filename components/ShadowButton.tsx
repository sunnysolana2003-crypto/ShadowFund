
import React from 'react';

interface ShadowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export const ShadowButton: React.FC<ShadowButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  icon,
  className = '',
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center gap-2 font-bold uppercase tracking-widest transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";
  
  const variants = {
    primary: "bg-shadow-green text-shadow-black hover:bg-[#00e08f] hover:shadow-[0_0_20px_rgba(0,255,163,0.4)]",
    secondary: "bg-transparent border border-shadow-gray-700 text-shadow-300 hover:border-shadow-green hover:text-shadow-green",
    danger: "bg-transparent border border-shadow-error text-shadow-error hover:bg-shadow-error/10",
    ghost: "bg-transparent text-shadow-500 hover:text-white"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-[10px]",
    md: "px-6 py-2.5 text-xs",
    lg: "px-8 py-4 text-sm"
  };

  const widthStyle = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthStyle} ${className}`}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
};
