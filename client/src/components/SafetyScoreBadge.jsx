import React from 'react';
import { Shield, ShieldCheck, ShieldAlert } from 'lucide-react';

const SafetyScoreBadge = ({ score, level, size = 'md' }) => {
  const getSafetyConfig = (level) => {
    switch (level) {
      case 'High':
        return {
          color: 'text-emerald-800',
          bg: 'bg-emerald-100',
          border: 'border-emerald-300',
          icon: ShieldCheck,
          label: 'HIGH'
        };
      case 'Medium':
        return {
          color: 'text-yellow-800',
          bg: 'bg-yellow-100',
          border: 'border-yellow-300',
          icon: Shield,
          label: 'MEDIUM'
        };
      case 'Low':
        return {
          color: 'text-red-800',
          bg: 'bg-red-100',
          border: 'border-red-300',
          icon: ShieldAlert,
          label: 'LOW'
        };
      default:
        return {
          color: 'text-gray-800',
          bg: 'bg-gray-100',
          border: 'border-gray-300',
          icon: Shield,
          label: 'UNKNOWN'
        };
    }
  };

  const config = getSafetyConfig(level);
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16
  };

  return (
    <div className={`inline-flex items-center gap-2 border-2 font-black uppercase tracking-wide ${config.bg} ${config.color} ${config.border} ${sizeClasses[size]}`}>
      <Icon size={iconSizes[size]} className="font-bold" />
      <span>{score}</span>
      <span className="hidden sm:inline">{config.label}</span>
    </div>
  );
};

export default SafetyScoreBadge;
