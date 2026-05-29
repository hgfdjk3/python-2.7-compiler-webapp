import React from 'react';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX, IconInfoCircle, IconAlertCircle } from '@tabler/icons-react';

interface NotificationParams {
  title: string;
  message: React.ReactNode;
  id?: string;
}

const defaultProps = {
  radius: 'md',
  withCloseButton: true,
  autoClose: 5000,
};

export const notify = {
  success: ({ title, message, id }: NotificationParams) => {
    notifications.show({
      ...defaultProps,
      id,
      title,
      message,
      color: 'teal',
      icon: <IconCheck size={18} stroke={1.5} />,
    });
  },

  error: ({ title, message, id }: NotificationParams) => {
    notifications.show({
      ...defaultProps,
      id,
      title,
      message,
      color: 'red',
      icon: <IconX size={18} stroke={1.5} />,
      autoClose: 7000,
    });
  },

  info: ({ title, message, id }: NotificationParams) => {
    notifications.show({
      ...defaultProps,
      id,
      title,
      message,
      color: 'blue',
      icon: <IconInfoCircle size={18} stroke={1.5} />,
    });
  },

  warning: ({ title, message, id }: NotificationParams) => {
    notifications.show({
      ...defaultProps,
      id,
      title,
      message,
      color: 'orange',
      icon: <IconAlertCircle size={18} stroke={1.5} />,
    });
  },
};
