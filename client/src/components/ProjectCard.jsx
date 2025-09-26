import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Clock, DollarSign } from 'lucide-react';
import NBCard from './NBCard';
import RiskScoreBadge from './RiskScoreBadge';
import NBButton from './NBButton';

const ProjectCard = ({ project, onViewDetails, onInvest }) => {
  const getTypeColor = (type) => {
    const colors = {
      invoice: 'nb-accent',
      saas: 'nb-accent-2', 
      creator: 'nb-purple',
      rental: 'nb-ok',
      luxury: 'nb-pink'
    };
    return colors[type] || 'nb-accent';
  };
  
  const getTypeIcon = (type) => {
    switch (type) {
      case 'invoice': return '📄';
      case 'saas': return '💻';
      case 'creator': return '🎨';
      case 'rental': return '🏠';
      case 'luxury': return '💎';
      default: return '📊';
    }
  };
  
  const formatAmount = (amount) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount}`;
  };
  
  return (
    <NBCard className="relative overflow-hidden">
      {/* Type Badge */}
      <div className={`absolute top-0 right-0 bg-${getTypeColor(project.type)} px-3 py-1 rounded-bl-nb`}>
        <span className="text-nb-ink font-bold text-sm flex items-center space-x-1">
          <span>{getTypeIcon(project.type)}</span>
          <span className="capitalize">{project.type}</span>
        </span>
      </div>
      
      <div className="space-y-4">
        {/* Header */}
        <div className="pt-8">
          <h3 className="font-display font-bold text-xl text-nb-ink mb-2 line-clamp-2">
            {project.name || project.company || project.channel || project.property || project.asset}
          </h3>
          <p className="text-nb-ink/70 text-sm line-clamp-2">
            {project.description || `${project.type} cash flow opportunity`}
          </p>
        </div>
        
        {/* Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-1 text-nb-ink/60">
              <DollarSign size={14} />
              <span className="text-xs">Amount</span>
            </div>
            <div className="font-bold text-lg">
              {formatAmount(project.amount || project.monthlyRevenue || project.leaseRevenue)}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center space-x-1 text-nb-ink/60">
              <Clock size={14} />
              <span className="text-xs">Duration</span>
            </div>
            <div className="font-bold text-lg">
              {project.duration || project.leaseTerm || '12'}M
            </div>
          </div>
        </div>
        
        {/* Risk Score */}
        <div className="flex items-center justify-between">
          <RiskScoreBadge 
            score={project.riskScore}
            trend={project.trend}
            factors={project.factors}
          />
          <div className="text-right">
            <div className="text-xs text-nb-ink/60">Est. APY</div>
            <div className="font-bold text-lg text-nb-accent">
              {((100 - project.riskScore) * 0.3 + 8).toFixed(1)}%
            </div>
          </div>
        </div>
        
        {/* Additional Info */}
        {project.type === 'saas' && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-nb-ink/60">MRR Growth:</span>
              <span className={`ml-1 font-semibold ${project.growth > 0 ? 'text-nb-ok' : 'text-nb-error'}`}>
                {project.growth > 0 ? '+' : ''}{project.growth}%
              </span>
            </div>
            <div>
              <span className="text-nb-ink/60">Churn:</span>
              <span className="ml-1 font-semibold">{project.churn}%</span>
            </div>
          </div>
        )}
        
        {project.type === 'creator' && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-nb-ink/60">Subscribers:</span>
              <span className="ml-1 font-semibold">{(project.subscribers / 1000).toFixed(0)}K</span>
            </div>
            <div>
              <span className="text-nb-ink/60">Engagement:</span>
              <span className="ml-1 font-semibold">{project.engagementRate}%</span>
            </div>
          </div>
        )}
        
        {project.type === 'rental' && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-nb-ink/60">Occupancy:</span>
              <span className="ml-1 font-semibold">{project.occupancy}%</span>
            </div>
            <div>
              <span className="text-nb-ink/60">Location:</span>
              <span className="ml-1 font-semibold">{project.location}</span>
            </div>
          </div>
        )}
        
        {/* Status */}
        <div className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
          project.status === 'approved' ? 'bg-nb-ok text-nb-ink' :
          project.status === 'funded' ? 'bg-nb-accent text-nb-ink' :
          'bg-nb-warn text-nb-ink'
        }`}>
          {project.status === 'approved' ? '✅ Ready to Fund' :
           project.status === 'funded' ? '💰 Funded' :
           '⏳ Under Review'}
        </div>
        
        {/* Actions */}
        <div className="flex space-x-2 pt-2">
          <NBButton 
            variant="outline" 
            size="sm" 
            onClick={() => onViewDetails?.(project)}
            className="flex-1"
          >
            <ExternalLink size={14} className="mr-1" />
            Details
          </NBButton>
          
          {project.status === 'approved' && (
            <NBButton 
              variant="primary" 
              size="sm" 
              onClick={() => onInvest?.(project)}
              className="flex-1"
            >
              Invest
            </NBButton>
          )}
        </div>
      </div>
    </NBCard>
  );
};

export default ProjectCard;
