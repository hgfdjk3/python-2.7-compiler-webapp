import React, { useState } from 'react';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router } from './Router';
import { theme } from './theme';
import { shadcnCssVariableResolver } from "./cssVariablesResolver";
import { AnimatePresence } from 'framer-motion';
import { EnterLoading } from './components/EnterLoading/EnterLoading';
import "./style.css";

const queryClient = new QueryClient();

export const App: React.FC = () => {
  const [loading, setLoading] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme} cssVariablesResolver={shadcnCssVariableResolver}>
        <AnimatePresence mode="wait">
          {loading ? (
            <EnterLoading key="loader" onComplete={() => setLoading(false)} />
          ) : (
            <Router key="router" />
          )}
        </AnimatePresence>
      </MantineProvider>
    </QueryClientProvider>
  );
};
