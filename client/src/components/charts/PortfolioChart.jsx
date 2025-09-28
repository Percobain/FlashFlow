import React from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";

const PortfolioChart = ({ data, height = 300, showGrid = true }) => {
    const formatValue = (value) => `$${value.toLocaleString()}`;
    const formatDate = (dateStr) => {
        const date = new Date(dateStr + "-01");
        return date.toLocaleDateString("en-US", {
            month: "short",
            year: "2-digit",
        });
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-4 rounded-lg shadow-lg border border-nb-ink/10">
                    <p className="font-semibold text-nb-ink mb-2">
                        {formatDate(label)}
                    </p>
                    <div className="space-y-1">
                        <p className="text-sm">
                            <span className="text-nb-ink/60">
                                Portfolio Value:{" "}
                            </span>
                            <span className="font-semibold text-nb-accent">
                                {formatValue(data.value)}
                            </span>
                        </p>
                        <p className="text-sm">
                            <span className="text-nb-ink/60">
                                Total Returns:{" "}
                            </span>
                            <span
                                className={`font-semibold ${
                                    data.returns >= 0
                                        ? "text-nb-ok"
                                        : "text-nb-error"
                                }`}
                            >
                                {data.returns >= 0 ? "+" : ""}
                                {formatValue(data.returns)}
                            </span>
                        </p>
                        <p className="text-sm">
                            <span className="text-nb-ink/60">Return %: </span>
                            <span
                                className={`font-semibold ${
                                    data.returnsPct >= 0
                                        ? "text-nb-ok"
                                        : "text-nb-error"
                                }`}
                            >
                                {data.returnsPct >= 0 ? "+" : ""}
                                {data.returnsPct}%
                            </span>
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ height }}
        >
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient
                            id="portfolioGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                        >
                            <stop
                                offset="5%"
                                stopColor="#6EE7B7"
                                stopOpacity={0.3}
                            />
                            <stop
                                offset="95%"
                                stopColor="#6EE7B7"
                                stopOpacity={0}
                            />
                        </linearGradient>
                    </defs>
                    {showGrid && (
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    )}
                    <XAxis
                        dataKey="date"
                        tickFormatter={formatDate}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "#6B7280" }}
                    />
                    <YAxis
                        tickFormatter={(value) =>
                            `$${(value / 1000).toFixed(0)}k`
                        }
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "#6B7280" }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#10B981"
                        strokeWidth={3}
                        fill="url(#portfolioGradient)"
                        dot={{ fill: "#10B981", strokeWidth: 2, r: 4 }}
                        activeDot={{
                            r: 6,
                            stroke: "#10B981",
                            strokeWidth: 2,
                            fill: "#fff",
                        }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </motion.div>
    );
};

export default PortfolioChart;
