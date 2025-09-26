/**
 * @fileoverview Neo-Brutalist button component
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

const NBButton = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  disabled = false,
  loading = false,
  onClick,
  ...props 
}) => {
  const baseClasses = "font-semibold rounded-nb nb-border transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-nb-accent/50 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-nb-accent hover:bg-nb-accent/80 text-nb-ink shadow-nb hover:shadow-nb-hover",
    secondary: "bg-nb-accent-2 hover:bg-nb-accent-2/80 text-white shadow-nb hover:shadow-nb-hover",
    outline: "bg-transparent hover:bg-nb-accent/10 text-nb-ink border-nb-ink",
    ghost: "bg-transparent hover:bg-nb-accent/20 text-nb-ink border-transparent",
    danger: "bg-nb-error hover:bg-nb-error/80 text-white shadow-nb hover:shadow-nb-hover",
    success: "bg-nb-ok hover:bg-nb-ok/80 text-nb-ink shadow-nb hover:shadow-nb-hover",
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
    xl: "px-8 py-4 text-xl",
  };
  
  const classes = cn(
    baseClasses,
    variants[variant],
    sizes[size],
    !disabled && "hover:-translate-y-1 active:translate-y-0",
    className
  );
  
  return (
    <motion.button
      className={classes}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      {...props}
    >
      {loading ? (
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          <span>Loading...</span>
        </div>
      ) : (
        children
      )}
    </motion.button>
  );
};

export default NBButton;
