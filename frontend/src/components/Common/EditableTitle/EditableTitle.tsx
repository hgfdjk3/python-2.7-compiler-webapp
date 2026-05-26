import React, { useState, useRef, useEffect } from 'react';
import { TextInput, Button } from '@mantine/core';
import { IconEdit } from '@tabler/icons-react';
import { useHover } from '@mantine/hooks';

export interface EditableTitleProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  size?: string; // Kept for backwards compatibility if passed
}

export const EditableTitle: React.FC<EditableTitleProps> = ({
  value,
  onChange,
  placeholder = 'Untitled Automation',
}) => {
  const { hovered, ref } = useHover<HTMLButtonElement>();
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (currentValue.trim() !== '') {
      onChange(currentValue.trim());
    } else {
      setCurrentValue(value);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setCurrentValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <TextInput
        ref={inputRef}
        value={currentValue}
        onChange={(e) => setCurrentValue(e.currentTarget.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        placeholder={placeholder}
        size="xs"
        variant="filled"
        styles={{
          input: {
            fontWeight: 500,
            height: 26,
            minHeight: 26,
            lineHeight: '26px',
            padding: '0 10px',
            backgroundColor: 'var(--mantine-color-dark-light)',
            color: 'var(--mantine-color-dark-light-color)',
            border: 'none',
          }
        }}
      />
    );
  }

  return (
    <Button
      ref={ref}
      variant="light"
      color="dark"
      size="compact-sm"
      className="action-btn"
      onClick={() => setIsEditing(true)}
      style={{ fontWeight: 500, height: 26, cursor: 'text' }}
      rightSection={
        <IconEdit 
          size={12} 
          style={{ 
            opacity: hovered ? 1 : 0.4, 
            transition: 'opacity 0.15s ease',
          }} 
        />
      }
    >
      {value || placeholder}
    </Button>
  );
};
