/**
 * @fileoverview Dashboard statistics pill component
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

const StatPill = ({ 
  value, 
  label, 
  trend, 
  color = 'nb-accent',
  icon: Icon,
  animated = true,
  className = ''
}) => {
  return (
    <motion.div
      className={cn(
        `bg-${color} text-nb-ink px-4 py-2 rounded-nb nb-border shadow-nb-sm`,
        'flex items-center space-x-2',
        className
      )}
      {...(animated && {
        whileHover: { scale: 1.05, y: -2 },
        whileTap: { scale: 0.95 }
      })}
    >
      {Icon && <Icon size={16} className="flex-shrink-0" />}
      <div className="flex flex-col">
        <span className="font-bold text-lg leading-none">{value}</span>
        <span className="text-xs opacity-75 leading-none">{label}</span>
      </div>
      {trend && (
        <div className={cn(
          "text-xs px-2 py-1 rounded-full",
          trend > 0 ? "bg-nb-ok text-nb-ink" : "bg-nb-error text-white"
        )}>
          {trend > 0 ? '+' : ''}{trend}%
        </div>
      )}
    </motion.div>
  );
};

export default StatPill;
