import { useAuthStore } from '@/features/auth';
import { ProfessionalDashboardPage } from '@/features/professional';

import { DashboardPage } from './dashboardPage';

export const DashboardRoute = () => {
  const role = useAuthStore((state) => state.currentUser?.role);

  if (role === 'professional') return <ProfessionalDashboardPage />;
  return <DashboardPage />;
};
