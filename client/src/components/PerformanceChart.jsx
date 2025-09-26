import React from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import NBCard from './NBCard';

const PerformanceChart = ({ 
  data = [], 
  title,
  type = 'line',
  height = 300,
  color = '#6EE7B7',
  showGrid = true,
  timeframe = '1M'
}) => {
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-nb-card nb-border rounded-nb p-3 shadow-nb">
          <p className="text-nb-ink font-semibold mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? 
                entry.value.toLocaleString() : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  const ChartComponent = type === 'area' ? AreaChart : LineChart;
  const DataComponent = type === 'area' ? Area : Line;
  
  return (
    <NBCard hover={false} padding="lg">
      {title && (
        <div className="mb-6">
          <h3 className="font-display font-bold text-xl text-nb-ink">{title}</h3>
          <div className="flex items-center space-x-2 mt-2">
            <div className="flex space-x-1">
              {['1D', '1W', '1M', '3M', '1Y'].map((period) => (
                <button
                  key={period}
                  className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                    timeframe === period
                      ? 'bg-nb-accent text-nb-ink font-semibold'
                      : 'text-nb-ink/60 hover:bg-nb-accent/20'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <ResponsiveContainer width="100%" height={height}>
          <ChartComponent data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            {showGrid && (
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#111111" 
                opacity={0.1}
              />
            )}
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#111111' }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#111111' }}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {type === 'area' ? (
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                fill={color}
                fillOpacity={0.3}
                strokeWidth={3}
                dot={{ fill: color, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
              />
            ) : (
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={3}
                dot={{ fill: color, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
              />
            )}
          </ChartComponent>
        </ResponsiveContainer>
      </motion.div>
    </NBCard>
  );
};

export default PerformanceChart;