import React, { useState, useEffect } from 'react';
import { Modal, Textarea, Button, Group } from '@mantine/core';
import './EditSummaryModal.css';

interface EditSummaryModalProps {
  opened: boolean;
  onClose: () => void;
  initialSummary: string;
  onSave: (newSummary: string) => Promise<void> | void;
  isLoading?: boolean;
}

export const EditSummaryModal: React.FC<EditSummaryModalProps> = ({
  opened,
  onClose,
  initialSummary,
  onSave,
  isLoading = false,
}) => {
  const [summary, setSummary] = useState(initialSummary);

  useEffect(() => {
    if (opened) {
      setSummary(initialSummary);
    }
  }, [opened, initialSummary]);

  const MIN_LENGTH = 50;
  const canSave = summary.length >= MIN_LENGTH;

  const handleSave = async () => {
    if (!canSave) return;
    await onSave(summary);
    onClose();
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Edit Project Summary" size="xl">
      <Textarea
        value={summary}
        onChange={(e) => setSummary(e.currentTarget.value)}
        rows={20}
        placeholder="Enter project summary..."
        styles={{ input: { resize: 'vertical' } }}
        classNames={{ input: 'editSummaryTextarea' }}
        data-autofocus
      />
      <Group justify="flex-end" mt="md">
        <Button variant="default" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={handleSave} loading={isLoading} disabled={!canSave}>
          {canSave ? 'Save' : `Save (${summary.length}/${MIN_LENGTH})`}
        </Button>
      </Group>
    </Modal>
  );
};
