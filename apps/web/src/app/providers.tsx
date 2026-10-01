import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';

import { Toaster } from '@/shared/components/toaster';
import { ThemeProvider } from '@/shared/theme';

import { AppRoot } from './appRoot';
import { ErrorBoundary } from './errorBoundary';
import { createQueryClient } from './queryClient';

export const Providers = () => {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AppRoot />
          <Toaster />
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};
