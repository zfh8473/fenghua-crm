/**
 * Bar Chart Component
 * 
 * Displays data using Recharts BarChart
 * All custom code is proprietary and not open source.
 */

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
}

export const BarChartComponent: React.FC<BarChartProps> = ({
  data,
  title,
  dataKeys,
  colors = ['#3b82f6', '#10b981', '#f59e0b'],
}) => {
  return (
    <div className="w-full">
      {title && (
        <h3 className="text-monday-lg font-semibold text-monday-text mb-monday-4">
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
          <Legend />
          {dataKeys.map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              fill={colors[index % colors.length]}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

