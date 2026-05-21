import React from 'react';
import { Box, Text, Group, useMantineColorScheme } from '@mantine/core';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'motion/react';
import './ActivityChart.css';

interface DataPoint {
  name: string;
  value: number;
  secondary?: number;
}

interface ActivityChartProps {
  title: string;
  subtitle?: string;
  data: DataPoint[];
  color?: string;
  secondaryColor?: string;
  height?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <Box className="chart-tooltip">
        <Text size="xs" fw={600} mb={4}>
          {label}
        </Text>
        {payload.map((entry: any, index: number) => (
          <Text key={index} size="xs" c="dimmed">
            {entry.name}: <strong style={{ color: entry.color }}>{entry.value}</strong>
          </Text>
        ))}
      </Box>
    );
  }
  return null;
};

export const ActivityChart: React.FC<ActivityChartProps> = ({
  title,
  subtitle,
  data,
  color = '#818cf8',
  secondaryColor = '#34d399',
  height = 240,
}) => {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  const gridColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
  const axisColor = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)';

  return (
    <motion.div
      className="activity-chart"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24, delay: 0.1 }}
    >
      <Box className="activity-chart-inner">
        <Group justify="space-between" align="flex-start" mb="lg">
          <Box>
            <Text size="sm" fw={700}>
              {title}
            </Text>
            {subtitle && (
              <Text size="xs" c="dimmed" mt={2}>
                {subtitle}
              </Text>
            )}
          </Box>
        </Group>

        <Box style={{ height, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSecondary" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={secondaryColor} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={secondaryColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: axisColor }}
                axisLine={false}
                tickLine={false}
                dy={8}
              />
              <YAxis
                tick={{ fontSize: 11, fill: axisColor }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                name="Messages"
                stroke={color}
                strokeWidth={2}
                fill="url(#colorPrimary)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, fill: isDark ? '#18181b' : '#fff' }}
              />
              {data.some((d) => d.secondary !== undefined) && (
                <Area
                  type="monotone"
                  dataKey="secondary"
                  name="Automations"
                  stroke={secondaryColor}
                  strokeWidth={2}
                  fill="url(#colorSecondary)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, fill: isDark ? '#18181b' : '#fff' }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </Box>
    </motion.div>
  );
};
