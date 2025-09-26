/**
 * @fileoverview Neo-Brutalist card component
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

const NBCard = ({ 
  children, 
  className = '', 
  hover = true,
  padding = 'default',
  ...props 
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8',
  };
  
  const classes = cn(
    'bg-nb-card nb-border rounded-nb shadow-nb',
    hover && 'transition-transform hover:-translate-y-1 active:translate-y-0',
    paddingClasses[padding],
    className
  );
  
  const Component = hover ? motion.div : 'div';
  
  return (
    <Component
      className={classes}
      {...(hover && {
        whileHover: { scale: 1.02 },
        whileTap: { scale: 0.98 }
      })}
      {...props}
    >
      {children}
    </Component>
  );
};

export default NBCard;
