import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";

const MetricsCard = ({
    title,
    value,
    change,
    changeType = "percentage",
    trend,
    icon: Icon,
    color = "nb-accent",
    subtitle,
    className = "",
}) => {
    const getTrendColor = () => {
        if (!change) return "text-nb-ink/60";
        return change > 0 ? "text-nb-ok" : "text-nb-error";
    };

    const getTrendIcon = () => {
        if (!change) return null;
        return change > 0 ? TrendingUp : TrendingDown;
    };

    const formatChange = () => {
        if (!change) return null;
        const prefix = change > 0 ? "+" : "";
        const suffix = changeType === "percentage" ? "%" : "";
        return `${prefix}${change}${suffix}`;
    };

    const TrendIcon = getTrendIcon();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            className={`bg-white rounded-nb p-6 shadow-sm border border-nb-ink/5 hover:shadow-md transition-all duration-200 ${className}`}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                        {Icon && (
                            <div className={`p-2 rounded-lg bg-${color}/10`}>
                                <Icon className={`text-${color} w-4 h-4`} />
                            </div>
                        )}
                        <h3 className="text-sm font-medium text-nb-ink/70">
                            {title}
                        </h3>
                    </div>

                    <div className="space-y-1">
                        <p className="text-2xl font-bold text-nb-ink">
                            {value}
                        </p>
                        {subtitle && (
                            <p className="text-xs text-nb-ink/50">{subtitle}</p>
                        )}
                    </div>
                </div>

                {change !== undefined && (
                    <div
                        className={`flex items-center space-x-1 ${getTrendColor()}`}
                    >
                        {TrendIcon && <TrendIcon className="w-4 h-4" />}
                        <span className="text-sm font-semibold">
                            {formatChange()}
                        </span>
                    </div>
                )}
            </div>

            {trend && (
                <div className="mt-4 pt-4 border-t border-nb-ink/5">
                    <div className="flex items-center justify-between text-xs text-nb-ink/60">
                        <span>{trend.label}</span>
                        <span
                            className={
                                trend.value > 0 ? "text-nb-ok" : "text-nb-error"
                            }
                        >
                            {trend.value > 0 ? "+" : ""}
                            {trend.value}%
                        </span>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default MetricsCard;
