import React, { useRef } from 'react';
import { Card, Group, Text, ThemeIcon, Box, UnstyledButton } from '@mantine/core';
import { IconPdf, IconFileText, IconExternalLink, IconGripVertical, IconCheck } from '@tabler/icons-react';
import { useHover, useMergedRef } from '@mantine/hooks';
import { useDraggable } from '@dnd-kit/react';
import { Source, SourceType } from '../types';
import { SourceCardMenu } from './SourceCardMenu';

import './SourceCard.css';

interface SourceCardProps {
    source: Source;
    isOverlay?: boolean;
    isDraggingAny?: boolean;
    onRemove?: (id: string) => void;
    onGoToSource?: (id: string) => void;
    onRename?: (id: string) => void;
    onOpen?: (id: string) => void;
    selected?: boolean;
    onClick?: () => void;
}

import { getSourceStyle } from '../sourceTypes';

export const SourceCard: React.FC<SourceCardProps> = ({
    source,
    isOverlay,
    isDraggingAny,
    onRemove,
    onGoToSource,
    onRename,
    onOpen,
    selected,
    onClick,
}) => {
    const { hovered, ref: hoverRef } = useHover();
    const { ref: dragRef, isDragging } = useDraggable({
        id: source.id,
        data: source,
        disabled: isOverlay,
    });

    const mergedRef = useMergedRef(dragRef, hoverRef);

    // Track pointer start position to distinguish click from drag-release
    const pointerStart = useRef<{ x: number; y: number } | null>(null);
    const handlePointerDown = (e: React.PointerEvent) => {
        pointerStart.current = { x: e.clientX, y: e.clientY };
    };
    const handleClick = (e: React.MouseEvent) => {
        if (onClick) {
            onClick();
            return;
        }
        if (onOpen && pointerStart.current) {
            const dx = e.clientX - pointerStart.current.x;
            const dy = e.clientY - pointerStart.current.y;
            if (Math.sqrt(dx * dx + dy * dy) < 5) {
                onOpen(source.id);
            }
        }
    };

    const styleInfo = getSourceStyle(source.type);
    const cardColor = source.color || styleInfo.color;

    return (
        <Card
            ref={mergedRef}
            withBorder
            p="xs"
            pl="5"
            radius="sm"
            className={`sourceCardRoot ${selected ? 'selected' : ''}`}
            data-dragging={isDragging || undefined}
            data-dragging-any={isDraggingAny || undefined}
            shadow={isDragging ? 'md' : 'none'}
            onPointerDown={handlePointerDown}
            onClick={handleClick}
            style={{
                borderLeft: `4px solid var(--mantine-color-${cardColor}-6)`,
                cursor: onClick ? 'pointer' : undefined,
            }}
        >
            <Group wrap="nowrap" gap="xs">
                <Group wrap="nowrap" gap="5">
                    <Box className="dragHandle">
                        <IconGripVertical size={16} color="var(--mantine-color-gray-5)" />
                    </Box>

                    <ThemeIcon variant="light" color={cardColor} size="md">
                        {styleInfo.icon}
                    </ThemeIcon>
                </Group>

                <Box className="sourceCardInfo">
                    <Text size="xs" fw={500} truncate>
                        {source.title}
                    </Text>
                    <Text size="10px" c="dimmed" truncate>
                        {source.description}
                    </Text>
                </Box>

                {!isOverlay && !selected && (
                    <SourceCardMenu
                        visible={hovered || isDragging}
                        onGoToSource={() => onGoToSource?.(source.id)}
                        onRemove={() => onRemove?.(source.id)}
                        onRename={() => onRename?.(source.id)}
                    />
                )}

                {selected && (
                    <Box className="selectedCheck">
                        <IconCheck size={14} stroke={3} />
                    </Box>
                )}
            </Group>
        </Card>
    );
};
