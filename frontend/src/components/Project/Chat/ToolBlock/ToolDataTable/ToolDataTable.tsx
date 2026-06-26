import React from 'react';
import { Table, Text, Box, Code, Paper, Stack, Title, SimpleGrid } from '@mantine/core';

interface ToolDataTableProps {
  data: any;
  rawString?: string;
}

export const ToolDataTable: React.FC<ToolDataTableProps> = ({ data, rawString }) => {
  if (!data) {
    return <Code block>{rawString}</Code>;
  }

  const safeParse = (value: any) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (typeof parsed === 'object' && parsed !== null) {
          return parsed;
        }
      } catch (e) {
        // Not a JSON string
      }
    }
    return value;
  };

  const inputObj = safeParse(data.input);
  const outputObj = safeParse(data.output);

  const renderValue = (val: any) => {
    if (typeof val === 'object' && val !== null) {
      return (
        <Paper bg="var(--mantine-color-dark-8)" p={6} radius="sm">
          <Code color="transparent" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {JSON.stringify(val, null, 2)}
          </Code>
        </Paper>
      );
    }
    return <Text size="sm" m="0" style={{ wordBreak: 'break-word' }}>{String(val)}</Text>;
  };

  const renderTable = (obj: any, label: string) => {
    if (obj === undefined || obj === null) return null;

    let content;
    const isObject = typeof obj === 'object' && !Array.isArray(obj) && Object.keys(obj).length > 0;
    const isArrayOfObjects = Array.isArray(obj) && obj.length > 0 && obj.every(item => typeof item === 'object' && item !== null && !Array.isArray(item));

    if (isObject || isArrayOfObjects) {
      const items = isArrayOfObjects ? obj : [obj];

      content = (
        <Stack gap="xs">
          {items.map((item: any, idx: number) => (
            <Table
              key={idx}
              // verticalSpacing="xs"
              // horizontalSpacing="sm"
              // withTableBorders
              withRowBorders
            // withColumnBorders
            // borderColor="var(--mantine-color-default-border)"
            // style={{ borderRadius: 'var(--mantine-radius-md)', overflow: 'hidden', borderCollapse: 'separate' }}
            >
              <Table.Tbody>
                {Object.entries(item).map(([key, val]) => (
                  <Table.Tr key={key} >
                    <Table.Td style={{ verticalAlign: 'top', width: '1%', whiteSpace: 'nowrap' }}>
                      <Text m="0" size="xs" c="dimmed" fw={600} tt="capitalize">{key}</Text>
                    </Table.Td>
                    <Table.Td style={{ verticalAlign: 'top' }}>
                      {renderValue(val)}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          ))}
        </Stack>
      );
    } else {
      content = (
        <Paper
          withBorder
          p="xs"
          radius="md"
          style={{ borderColor: 'var(--mantine-color-default-border)', backgroundColor: 'transparent' }}
        >
          {renderValue(obj)}
        </Paper>
      );
    }

    return (
      <Stack gap={6}>
        <Text m="0" size="xs" fw={700} tt="uppercase" c="dimmed">{label}</Text>
        {content}
      </Stack>
    );
  };

  return (
    <Box>
      {/* {data.name && (
        // <Title order={6} mb="sm" fw={600}>{data.name}</Title>
      )} */}
      <SimpleGrid cols={{ base: 1, sm: (inputObj && outputObj !== undefined) ? 2 : 1 }} spacing="md">
        {inputObj !== undefined && renderTable(inputObj, 'Input')}
        {outputObj !== undefined && renderTable(outputObj, 'Output')}
      </SimpleGrid>
    </Box>
  );
};
