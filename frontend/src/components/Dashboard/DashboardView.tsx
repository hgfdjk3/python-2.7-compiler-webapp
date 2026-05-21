import React from 'react';
import {
  Box,
  Container,
  Group,
  ScrollArea,
  SimpleGrid,
  Stack,
  Text,
  Title,
  Badge,
} from '@mantine/core';
import {
  IconMessageCircle,
  IconFolders,
  IconBolt,
  IconPlug,
  IconFileText,
  IconBrain,
  IconClockPlay,
  IconSparkles,
  IconPlus,
  IconRocket,
  IconTrendingUp,
  IconGitBranch,
  IconChecklist,
  IconUpload,
  IconPlayerPlay,
  IconAdjustments,
} from '@tabler/icons-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { StatCard } from './StatCard/StatCard';
import { ActivityChart } from './ActivityChart/ActivityChart';
import { QuickAction } from './QuickAction/QuickAction';
import { RecentActivity, ActivityItem } from './RecentActivity/RecentActivity';
import './DashboardView.css';

// --- Mock data ---

const CHART_DATA = [
  { name: 'Mon', value: 12, secondary: 3 },
  { name: 'Tue', value: 28, secondary: 5 },
  { name: 'Wed', value: 19, secondary: 8 },
  { name: 'Thu', value: 35, secondary: 4 },
  { name: 'Fri', value: 42, secondary: 12 },
  { name: 'Sat', value: 18, secondary: 6 },
  { name: 'Sun', value: 24, secondary: 9 },
];

const RECENT_ACTIVITIES: ActivityItem[] = [
  {
    id: '1',
    title: 'Acme Corp Integration',
    description: 'New chat: API Design Notes',
    timestamp: '2m ago',
    icon: IconMessageCircle,
    color: 'indigo',
    badge: 'Chat',
    badgeColor: 'indigo',
  },
  {
    id: '2',
    title: 'Daily Report Automation',
    description: 'Automation completed successfully',
    timestamp: '15m ago',
    icon: IconBolt,
    color: 'amber',
    badge: 'Automation',
    badgeColor: 'amber',
  },
  {
    id: '3',
    title: 'Website Redesign',
    description: 'Source added: competitor-analysis.pdf',
    timestamp: '1h ago',
    icon: IconUpload,
    color: 'emerald',
  },
  {
    id: '4',
    title: 'Slack Connector',
    description: 'Connector synced — 42 new messages indexed',
    timestamp: '2h ago',
    icon: IconPlug,
    color: 'sky',
    badge: 'Sync',
    badgeColor: 'sky',
  },
  {
    id: '5',
    title: 'Q3 Marketing Campaign',
    description: 'Knowledge graph updated with 8 new entities',
    timestamp: '3h ago',
    icon: IconBrain,
    color: 'violet',
  },
  {
    id: '6',
    title: 'Weekly Summary Automation',
    description: 'Scheduled run triggered',
    timestamp: '5h ago',
    icon: IconPlayerPlay,
    color: 'emerald',
    badge: 'Running',
    badgeColor: 'green',
  },
];

export const DashboardView: React.FC = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      className="dashboard-view"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <ScrollArea h="100%" offsetScrollbars scrollbarSize={6}>
        <Container size="xl" py="xl" className="dashboard-container">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <Group justify="space-between" align="flex-end" mb="2xl">
              <Box>
                <Group gap="sm" align="center" mb={4}>
                  <Title order={1} fw={800} style={{ letterSpacing: '-1px' }}>
                    Dashboard
                  </Title>
                  <Badge
                    variant="light"
                    color="emerald"
                    size="sm"
                    className="dashboard-status-badge"
                  >
                    All systems active
                  </Badge>
                </Group>
                <Text c="dimmed" size="md">
                  Welcome back, Ran. Here's an overview of your workspace activity.
                </Text>
              </Box>
            </Group>
          </motion.div>

          {/* Stat Cards Row */}
          <Group gap="md" mb="xl" grow preventGrowOverflow={false} wrap="wrap">
            <StatCard
              label="Total Chats"
              value="128"
              subtitle="from last week"
              icon={IconMessageCircle}
              color="indigo"
              trend={{ value: 12, direction: 'up' }}
            />
            <StatCard
              label="Active Projects"
              value="7"
              subtitle="2 new this month"
              icon={IconFolders}
              color="violet"
              trend={{ value: 28, direction: 'up' }}
            />
            <StatCard
              label="Automations"
              value="14"
              subtitle="3 running now"
              icon={IconBolt}
              color="amber"
              trend={{ value: 5, direction: 'up' }}
            />
            <StatCard
              label="Sources"
              value="43"
              subtitle="across all projects"
              icon={IconFileText}
              color="emerald"
              trend={{ value: 3, direction: 'neutral' }}
            />
          </Group>

          {/* Chart + Activity Row */}
          <Group gap="md" mb="xl" align="stretch" wrap="wrap" className="dashboard-main-row">
            <Box style={{ flex: 2, minWidth: 300 }}>
              <ActivityChart
                title="Weekly Activity"
                subtitle="Messages sent and automations triggered"
                data={CHART_DATA}
                color="#818cf8"
                secondaryColor="#34d399"
              />
            </Box>
            <Box style={{ flex: 1, minWidth: 280 }}>
              <RecentActivity items={RECENT_ACTIVITIES} />
            </Box>
          </Group>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Text size="sm" fw={700} mb="md">
              Quick Actions
            </Text>
            <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md" mb="xl">
              <QuickAction
                label="New Project"
                description="Start a new research workspace"
                icon={IconPlus}
                color="indigo"
                onClick={() => navigate('/new_project')}
              />
              <QuickAction
                label="Build Automation"
                description="Create an AI workflow"
                icon={IconBolt}
                color="amber"
                onClick={() => navigate('/automations')}
              />
              <QuickAction
                label="Browse Connectors"
                description="Add external data sources"
                icon={IconPlug}
                color="sky"
                onClick={() => navigate('/agents')}
              />
              <QuickAction
                label="Knowledge Graph"
                description="Explore entity relationships"
                icon={IconBrain}
                color="violet"
                onClick={() => navigate('/knowledge-graph')}
              />
            </SimpleGrid>
          </motion.div>

          {/* Footer Spacer */}
          <Box h="xl" />
        </Container>
      </ScrollArea>
    </motion.div>
  );
};
