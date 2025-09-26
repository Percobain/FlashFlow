import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { cn } from '../lib/utils';

const RiskScoreBadge = ({ 
  score, 
  trend = 'stable', 
  factors = [],
  size = 'md',
  showTooltip = true,
  className = ''
}) => {
  const [showDetails, setShowDetails] = useState(false);
  
  const getRiskLevel = (score) => {
    if (score >= 80) return { level: 'Low', color: 'nb-ok' };
    if (score >= 65) return { level: 'Medium', color: 'nb-warn' };
    return { level: 'High', color: 'nb-error' };
  };
  
  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving': return <TrendingUp size={14} className="text-nb-ok" />;
      case 'declining': return <TrendingDown size={14} className="text-nb-error" />;
      default: return <Minus size={14} className="text-nb-ink/60" />;
    }
  };
  
  const { level, color } = getRiskLevel(score);
  
  const sizes = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };
  
  return (
    <div className="relative inline-block">
      <motion.div
        className={cn(
          `bg-${color} text-nb-ink font-bold rounded-lg nb-border flex items-center space-x-2 cursor-pointer`,
          sizes[size],
          className
        )}
        onClick={() => showTooltip && setShowDetails(!showDetails)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span>{score}</span>
        <span className="text-xs opacity-75">{level}</span>
        {getTrendIcon(trend)}
        {showTooltip && <Info size={12} className="opacity-60" />}
      </motion.div>
      
      <AnimatePresence>
        {showDetails && showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute z-50 mt-2 p-4 bg-nb-card nb-border rounded-nb shadow-nb-hover min-w-64"
            style={{ left: '50%', transform: 'translateX(-50%)' }}
          >
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-nb-ink">Risk Analysis</h4>
                <div className="flex items-center space-x-1">
                  {getTrendIcon(trend)}
                  <span className="text-xs capitalize">{trend}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-nb-ink/70">Score:</span>
                  <span className="font-semibold">{score}/100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-nb-ink/70">Level:</span>
                  <span className={`font-semibold text-${color.replace('nb-', '')}`}>{level} Risk</span>
                </div>
              </div>
              
              {factors.length > 0 && (
                <div>
                  <h5 className="text-sm font-semibold mb-2">Key Factors:</h5>
                  <ul className="space-y-1">
                    {factors.slice(0, 3).map((factor, index) => (
                      <li key={index} className="text-xs text-nb-ink/70 flex items-center">
                        <div className="w-1 h-1 bg-nb-ink/40 rounded-full mr-2"></div>
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RiskScoreBadge;


