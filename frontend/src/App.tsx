import React from 'react';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router } from './Router';
import { theme } from './theme';
import { shadcnCssVariableResolver } from "./cssVariablesResolver";
import { WhitelistGuard } from './components/WhitelistGuard/WhitelistGuard';
import "./style.css";

const queryClient = new QueryClient();

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme} cssVariablesResolver={shadcnCssVariableResolver}>
        <WhitelistGuard>
          <Router />
        </WhitelistGuard>
      </MantineProvider>
    </QueryClientProvider>
  );
};
