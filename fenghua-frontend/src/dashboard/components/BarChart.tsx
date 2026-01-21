/**
 * Bar Chart Component
 * 
 * Displays data using Recharts BarChart
 * All custom code is proprietary and not open source.
 */

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getChartLabel } from '../utils/chart-labels';
import { CHART_COLORS } from '../utils/chart-colors';

export interface BarChartData {
  name: string;
  [key: string]: string | number;
}

export interface BarChartProps {
  /**
   * Chart data
   */
  data: BarChartData[];
  
  /**
   * Chart title
   */
  title?: string;
  
  /**
   * Data keys to display (e.g., ['customers', 'interactions'])
   */
  dataKeys: string[];
  
  /**
   * Colors for each data key
   */
  colors?: string[];
  
  /**
   * Custom label mappings (optional, defaults to Chinese labels)
   */
  labels?: Record<string, string>;
}

export const BarChartComponent: React.FC<BarChartProps> = ({
  data,
  title,
  dataKeys,
  colors = [...CHART_COLORS],
  labels,
}) => {
  // Use custom labels or default to Chinese labels
  const labelMap = labels || {};
  const getLabel = (key: string) => labelMap[key] || getChartLabel(key);
  return (
    <div className="w-full transition-opacity duration-200">
      {title && (
        <h3 className="text-monday-lg font-semibold text-uipro-text mb-monday-4 font-uipro-heading">
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="name" 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '8px',
              transition: 'opacity 150ms',
            }}
          />
          <Legend 
            formatter={(value) => {
              // Find the data key that matches this legend value
              const key = dataKeys.find(k => k === value || getLabel(k) === value);
              return key ? getLabel(key) : value;
            }}
          />
          {dataKeys.map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              name={getLabel(key)}
              fill={colors[index % colors.length]}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

