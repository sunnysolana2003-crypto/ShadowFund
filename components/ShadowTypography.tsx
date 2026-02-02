
import React from 'react';

interface ShadowTypographyProps {
  children: React.ReactNode;
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'balance' | 'mono';
  className?: string;
}

export const ShadowTypography: React.FC<ShadowTypographyProps> = ({ 
  children, 
  variant = 'body', 
  className = '' 
}) => {
  const styles = {
    h1: "font-display text-4xl md:text-5xl font-bold tracking-tight",
    h2: "font-display text-3xl md:text-4xl font-semibold",
    h3: "font-display text-xl md:text-2xl font-semibold",
    h4: "text-sm uppercase tracking-widest font-bold",
    body: "text-base leading-relaxed font-sans",
    balance: "font-display text-4xl md:text-6xl font-bold tracking-tighter",
    mono: "font-mono text-sm tracking-tighter"
  };

  // Fix: Use React.ElementType for the dynamic component variable to resolve JSX namespace and signature errors
  const Component = (['h1', 'h2', 'h3', 'h4'].includes(variant) 
    ? variant 
    : 'p') as React.ElementType;

  return (
    <Component className={`${styles[variant]} ${className}`}>
      {children}
    </Component>
  );
};
