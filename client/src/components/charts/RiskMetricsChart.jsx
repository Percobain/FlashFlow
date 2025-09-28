import React from "react";
import {
    RadialBarChart,
    RadialBar,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
} from "recharts";
import { motion } from "framer-motion";

const RiskMetricsChart = ({ riskScore, riskExposure, height = 300 }) => {
    // Data for radial chart (risk score)
    const riskData = [
        {
            name: "Risk Score",
            value: riskScore,
            fill:
                riskScore > 70
                    ? "#10B981"
                    : riskScore > 40
                    ? "#F59E0B"
                    : "#EF4444",
        },
    ];

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-3 rounded-lg shadow-lg border border-nb-ink/10">
                    <p className="font-semibold text-nb-ink">{data.name}</p>
                    <p className="text-sm text-nb-ink/60">{data.value}%</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            style={{ height }}
        >
            {/* Risk Score Gauge */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative"
            >
                <h4 className="text-sm font-semibold text-nb-ink/70 mb-2 text-center">
                    Portfolio Risk Score
                </h4>
                <ResponsiveContainer width="100%" height="80%">
                    <RadialBarChart
                        cx="50%"
                        cy="50%"
                        innerRadius="60%"
                        outerRadius="90%"
                        data={riskData}
                        startAngle={90}
                        endAngle={-270}
                    >
                        <RadialBar
                            dataKey="value"
                            cornerRadius={10}
                            fill={riskData[0].fill}
                            animationDuration={1000}
                        />
                    </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-nb-ink">
                            {riskScore}
                        </div>
                        <div className="text-xs text-nb-ink/60">
                            {riskScore > 70
                                ? "Low Risk"
                                : riskScore > 40
                                ? "Medium Risk"
                                : "High Risk"}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Risk Exposure Breakdown */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <h4 className="text-sm font-semibold text-nb-ink/70 mb-2 text-center">
                    Risk Exposure
                </h4>
                <ResponsiveContainer width="100%" height="80%">
                    <PieChart>
                        <Pie
                            data={riskExposure}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                            animationDuration={800}
                        >
                            {riskExposure.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color}
                                />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center space-x-4 mt-2">
                    {riskExposure.map((item, index) => (
                        <div
                            key={index}
                            className="flex items-center space-x-1"
                        >
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: item.color }}
                            />
                            <span className="text-xs text-nb-ink/60">
                                {item.name}
                            </span>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default RiskMetricsChart;
