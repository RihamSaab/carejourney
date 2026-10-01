import { RouterProvider } from 'react-router-dom';

import { useAuthBootstrap } from '@/features/auth';

import { router } from './router';

export const AppRoot = () => {
  useAuthBootstrap();
  return <RouterProvider router={router} />;
};
