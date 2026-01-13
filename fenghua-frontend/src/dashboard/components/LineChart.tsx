/**
 * Line Chart Component
 * 
 * Displays trend data using Recharts LineChart
 * All custom code is proprietary and not open source.
 */

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getChartLabel } from '../utils/chart-labels';

export interface LineChartData {
  name: string;
  customers?: number;
  interactions?: number;
  [key: string]: string | number | undefined;
}

export interface LineChartProps {
  /**
   * Chart data
   */
  data: LineChartData[];
  
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

export const LineChartComponent: React.FC<LineChartProps> = ({
  data,
  title,
  dataKeys,
  colors = ['#3b82f6', '#10b981', '#f59e0b'],
  labels,
}) => {
  // Use custom labels or default to Chinese labels
  const labelMap = labels || {};
  const getLabel = (key: string) => labelMap[key] || getChartLabel(key);
  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div className="w-full">
        {title && (
          <h3 className="text-monday-lg font-semibold text-monday-text mb-monday-4">
            {title}
          </h3>
        )}
        <div className="flex items-center justify-center h-[300px] text-monday-text-secondary">
          <p>暂无数据</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-monday-lg font-semibold text-monday-text mb-monday-4">
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
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
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '8px',
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
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              name={getLabel(key)}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

