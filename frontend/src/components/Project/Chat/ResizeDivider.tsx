import React, { useState } from 'react';
import { Box } from '@mantine/core';
import './ResizeDivider.css';

export interface ResizeDividerProps {
  onResize: (deltaY: number) => void;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
  onToggle?: () => void;
}

export const ResizeDivider: React.FC<ResizeDividerProps> = ({
  onResize,
  onResizeStart,
  onResizeEnd,
  onToggle
}) => {
  const [active, setActive] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setActive(true);
    onResizeStart?.();
    let lastY = e.clientY;
    let hasMoved = false;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (Math.abs(moveEvent.clientY - lastY) > 2) hasMoved = true;
      const deltaY = moveEvent.clientY - lastY;
      lastY = moveEvent.clientY;
      onResize(deltaY);
    };

    const handleMouseUp = () => {
      setActive(false);
      onResizeEnd?.();
      if (!hasMoved) {
        onToggle?.();
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <Box
      onMouseDown={handleMouseDown}
      className={`resize-divider ${active ? 'is-resizing' : ''}`}
    >
      <Box className="divider-handle">

      </Box>
    </Box>
  );
};
