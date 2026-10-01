import { createBrowserRouter } from 'react-router-dom';

import { AdminAuditPage, AdminOrganizationsPage, AdminUsersPage } from '@/features/admin';
import { AppointmentsPage } from '@/features/appointments';
import {
  ForgotPasswordPage,
  LoginPage,
  ProtectedRoute,
  RegisterPage,
  ResetPasswordPage,
  VerifyEmailPage,
} from '@/features/auth';
import {
  CarePlanDetailPage,
  PatientCarePlanListPage,
  ProfessionalCarePlanListPage,
} from '@/features/care-plan';
import { CareTeamPage } from '@/features/care-team';
import { DashboardRoute } from '@/features/dashboard';
import { DocumentsPage } from '@/features/documents';
import { LandingPage } from '@/features/landing';
import { MedicationsPage } from '@/features/medications';
import { NotificationsPage } from '@/features/notifications';
import { PatientsPage } from '@/features/professional';
import { ProfilePage } from '@/features/profile';
import { TasksPage } from '@/features/tasks';
import { TimelinePage } from '@/features/timeline';
import { AppLayout, PublicLayout } from '@/shared/components/layout';
import { NotFoundPage } from '@/shared/components/notFoundPage';

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  {
    element: <PublicLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/verify', element: <VerifyEmailPage /> },
      { path: '/forgot', element: <ForgotPasswordPage /> },
      { path: '/reset', element: <ResetPasswordPage /> },
    ],
  },
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: '/dashboard', element: <DashboardRoute /> },
      { path: '/care-plan', element: <PatientCarePlanListPage /> },
      { path: '/care-plan/:id', element: <CarePlanDetailPage /> },
      { path: '/care-plans', element: <ProfessionalCarePlanListPage /> },
      { path: '/care-plans/:id', element: <CarePlanDetailPage /> },
      { path: '/medications', element: <MedicationsPage /> },
      { path: '/tasks', element: <TasksPage /> },
      { path: '/appointments', element: <AppointmentsPage /> },
      { path: '/timeline', element: <TimelinePage /> },
      { path: '/care-team', element: <CareTeamPage /> },
      { path: '/documents', element: <DocumentsPage /> },
      { path: '/notifications', element: <NotificationsPage /> },
      { path: '/profile', element: <ProfilePage /> },
      { path: '/patients', element: <PatientsPage /> },
      { path: '/admin/users', element: <AdminUsersPage /> },
      { path: '/admin/organizations', element: <AdminOrganizationsPage /> },
      { path: '/admin/audit', element: <AdminAuditPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
