import React from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Line,
    ComposedChart,
} from "recharts";
import { motion } from "framer-motion";

const PayoutTrendsChart = ({ data, height = 300 }) => {
    const formatDate = (dateStr) => {
        const date = new Date(dateStr + "-01");
        return date.toLocaleDateString("en-US", { month: "short" });
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
                                Total Payouts:{" "}
                            </span>
                            <span className="font-semibold text-nb-accent">
                                ${data.amount.toLocaleString()}
                            </span>
                        </p>
                        <p className="text-sm">
                            <span className="text-nb-ink/60">
                                Number of Payouts:{" "}
                            </span>
                            <span className="font-semibold">{data.count}</span>
                        </p>
                        <p className="text-sm">
                            <span className="text-nb-ink/60">
                                Avg per Payout:{" "}
                            </span>
                            <span className="font-semibold">
                                $
                                {Math.round(
                                    data.amount / data.count
                                ).toLocaleString()}
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
                <BarChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                    <defs>
                        <linearGradient
                            id="payoutGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                        >
                            <stop
                                offset="5%"
                                stopColor="#6366F1"
                                stopOpacity={0.8}
                            />
                            <stop
                                offset="95%"
                                stopColor="#6366F1"
                                stopOpacity={0.3}
                            />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis
                        dataKey="month"
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
                    <Bar
                        dataKey="amount"
                        fill="url(#payoutGradient)"
                        radius={[4, 4, 0, 0]}
                        animationDuration={800}
                    />
                </BarChart>
            </ResponsiveContainer>
        </motion.div>
    );
};

export default PayoutTrendsChart;
