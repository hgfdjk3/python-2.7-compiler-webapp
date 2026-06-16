import React, { useState } from 'react';
import { Modal, Stack, Button, Text, Select, Loader, Center, Group } from '@mantine/core';
import { IconWand } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { getProjectConversations } from '../../../../api/conversations';
import { useExtractConversation } from '../../../../api/library';

interface ExtractConversationModalProps {
    opened: boolean;
    onClose: () => void;
    projectId: string;
}

export const ExtractConversationModal: React.FC<ExtractConversationModalProps> = ({
    opened,
    onClose,
    projectId,
}) => {
    const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

    const { data: conversations, isLoading } = useQuery({
        queryKey: ['conversations', projectId],
        queryFn: () => getProjectConversations(projectId),
        enabled: opened,
    });

    const extractMutation = useExtractConversation(projectId);

    const handleExtract = async () => {
        if (!selectedThreadId) return;
        try {
            await extractMutation.mutateAsync(selectedThreadId);
            onClose();
            setSelectedThreadId(null);
        } catch (error) {
            console.error('Failed to extract conversation', error);
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={
                <Group gap="xs">
                    <IconWand size={18} stroke={1.5} />
                    <Text fw={500}>Extract Conversation</Text>
                </Group>
            }
            size="md"
            centered
        >
            <Stack gap="md">
                <Text size="sm" c="dimmed">
                    Select a past conversation to analyze. The AI will extract key facts, architectural decisions, and entities to populate your project's knowledge library.
                </Text>

                {isLoading ? (
                    <Center py="xl">
                        <Loader size="sm" />
                    </Center>
                ) : (
                    <Select
                        label="Conversation"
                        placeholder="Select conversation..."
                        data={(conversations || []).map((conv) => ({
                            value: conv.id,
                            label: conv.title || `Conversation ${new Date(conv.updated_at).toLocaleDateString()}`,
                        }))}
                        value={selectedThreadId}
                        onChange={setSelectedThreadId}
                        searchable
                        nothingFoundMessage="No conversations found"
                    />
                )}

                <Group justify="flex-end" mt="md">
                    <Button variant="default" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        variant="filled"
                        onClick={handleExtract}
                        loading={extractMutation.isPending}
                        disabled={!selectedThreadId}
                        leftSection={<IconWand size={16} />}
                    >
                        Extract Knowledge
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
};
