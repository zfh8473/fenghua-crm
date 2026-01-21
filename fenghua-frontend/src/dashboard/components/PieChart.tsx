/**
 * Pie Chart Component
 * 
 * Displays distribution data using Recharts PieChart
 * All custom code is proprietary and not open source.
 */

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { CHART_COLORS } from '../utils/chart-colors';

export interface PieChartData {
  name: string;
  value: number;
}

export interface PieChartProps {
  /**
   * Chart data
   */
  data: PieChartData[];
  
  /**
   * Chart title
   */
  title?: string;
  
  /**
   * Colors for chart segments
   */
  colors?: string[];
  
  /**
   * Inner radius (for donut chart, 0 for pie chart)
   */
  innerRadius?: number;
}

export const PieChartComponent: React.FC<PieChartProps> = ({
  data,
  title,
  colors = [...CHART_COLORS],
  innerRadius = 0,
}) => {
  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div className="w-full">
        {title && (
          <h3 className="text-monday-lg font-semibold text-uipro-text mb-monday-4 font-uipro-heading">
            {title}
          </h3>
        )}
        <div className="flex items-center justify-center h-[300px] text-uipro-secondary">
          <p>暂无数据</p>
        </div>
      </div>
    );
  }

  // Filter out zero values for better visualization
  const filteredData = data.filter(item => item.value > 0);

  if (filteredData.length === 0) {
    return (
      <div className="w-full">
        {title && (
          <h3 className="text-monday-lg font-semibold text-uipro-text mb-monday-4 font-uipro-heading">
            {title}
          </h3>
        )}
        <div className="flex items-center justify-center h-[300px] text-uipro-secondary">
          <p>暂无有效数据</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full transition-opacity duration-200">
      {title && (
        <h3 className="text-monday-lg font-semibold text-uipro-text mb-monday-4 font-uipro-heading">
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            innerRadius={innerRadius}
            fill="#8884d8"
            dataKey="value"
          >
            {filteredData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '8px',
              transition: 'opacity 150ms',
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

