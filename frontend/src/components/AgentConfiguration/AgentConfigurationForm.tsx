import React from 'react';
import { Stack, Text, PasswordInput, Group, Box, Divider } from '@mantine/core';
import { IconKey } from '@tabler/icons-react';
import { motion } from 'motion/react';

interface AgentConfigurationFormProps {
  schema: Record<string, string>;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  brandColor?: string;
  isEditing?: boolean;
}

export const AgentConfigurationForm: React.FC<AgentConfigurationFormProps> = ({
  schema,
  values,
  onChange,
  brandColor = 'var(--mantine-color-blue-filled)',
  isEditing = false,
}) => {
  return (
    <Stack gap="md" mt="md" p="md" bg="zinc.9" style={{ borderRadius: 'var(--mantine-radius-md)' }}>
      <Box mb={4}>
        <Text fw={700} size="sm">Configuration {isEditing ? 'Settings' : 'Required'}</Text>
        <Text size="xs" c="dimmed">
          {isEditing 
            ? "Update the credentials for this connector." 
            : "This connector requires some credentials to be enabled."}
        </Text>
      </Box>

      <Divider color="zinc.8" />

      <Stack gap="sm">
        {Object.entries(schema).map(([key, placeholder], index) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <Group justify="space-between" wrap="nowrap" gap="md">
              <Text size="xs" fw={600} style={{ textTransform: 'capitalize', width: 140 }}>
                {key.replace(/_/g, ' ')}
              </Text>
              <PasswordInput
                placeholder={placeholder}
                value={values[key] || ''}
                onChange={(e) => onChange(key, e.currentTarget.value)}
                size="sm"
                radius="md"
                leftSection={<IconKey size={14} style={{ opacity: 0.5 }} />}
                style={{ flex: 1 }}
              />
            </Group>
          </motion.div>
        ))}
      </Stack>
    </Stack>
  );
};
