import React from 'react';
import { Box, useMantineColorScheme } from '@mantine/core';
import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import './AgentUsageChart.css';

interface DataPoint {
  name: string;
  value: number;
  secondary?: number;
}

interface AgentUsageChartProps {
  data: DataPoint[];
  color?: string;
  height?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <Box className="agent-chart-tooltip">
        <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 10, color: payload[0].color }}>
          {payload[0].value} req
        </div>
      </Box>
    );
  }
  return null;
};

export const AgentUsageChart: React.FC<AgentUsageChartProps> = ({
  data,
  color = '#818cf8',
  height = 60,
}) => {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  // Normalize color: if it's white/near-white fallback to violet
  const effectiveColor =
    color === '#fff' || color === '#ffffff' || color === '#171717' || color === '#18181b'
      ? '#818cf8'
      : color;

  const gradientId = `chart-grad-${effectiveColor.replace('#', '')}`;

  return (
    <Box className="agent-usage-chart" style={{ height, marginBottom: 4 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={effectiveColor} stopOpacity={isDark ? 0.3 : 0.2} />
              <stop offset="95%" stopColor={effectiveColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="name" hide />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={effectiveColor}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0, fill: effectiveColor }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
};
