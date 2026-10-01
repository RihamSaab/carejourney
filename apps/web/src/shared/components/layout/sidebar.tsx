import {
  Activity,
  Bell,
  Building2,
  Calendar,
  ClipboardList,
  FileText,
  LayoutDashboard,
  ListTodo,
  type LucideIcon,
  Pill,
  ShieldCheck,
  User,
  UserCog,
  Users,
} from 'lucide-react';
import styled from 'styled-components';

import { type Role, useAuthStore } from '@/features/auth';

import { NavItem } from './navItem';

type NavLink = {
  to: string;
  label: string;
  icon: LucideIcon;
};

type SidebarRole = Exclude<Role, 'caregiver'>;

const NAV_BY_ROLE: Record<SidebarRole, NavLink[]> = {
  patient: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/care-plan', label: 'Care Plan', icon: ClipboardList },
    { to: '/medications', label: 'Medications', icon: Pill },
    { to: '/tasks', label: 'Tasks', icon: ListTodo },
    { to: '/appointments', label: 'Appointments', icon: Calendar },
    { to: '/timeline', label: 'Timeline', icon: Activity },
    { to: '/care-team', label: 'Care Team', icon: Users },
    { to: '/documents', label: 'Documents', icon: FileText },
    { to: '/notifications', label: 'Notifications', icon: Bell },
    { to: '/profile', label: 'Profile', icon: User },
  ],
  professional: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/patients', label: 'My Patients', icon: Users },
    { to: '/care-plans', label: 'Care Plans', icon: ClipboardList },
    { to: '/appointments', label: 'Appointments', icon: Calendar },
    { to: '/documents', label: 'Documents', icon: FileText },
    { to: '/notifications', label: 'Notifications', icon: Bell },
    { to: '/profile', label: 'Profile', icon: User },
  ],
  admin: [
    { to: '/admin/users', label: 'Users', icon: UserCog },
    { to: '/admin/organizations', label: 'Organizations', icon: Building2 },
    { to: '/admin/audit', label: 'Audit', icon: ShieldCheck },
    { to: '/profile', label: 'Profile', icon: User },
  ],
};

export const Sidebar = () => {
  const currentUser = useAuthStore((state) => state.currentUser);
  const role: SidebarRole =
    currentUser && currentUser.role !== 'caregiver' ? currentUser.role : 'patient';
  const links = NAV_BY_ROLE[role];

  return (
    <Root aria-label="Primary navigation">
      <Brand>Hospital</Brand>
      <Nav>
        {links.map((link) => (
          <NavItem key={link.to} to={link.to} label={link.label} icon={link.icon} />
        ))}
      </Nav>
    </Root>
  );
};

const Root = styled.aside`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
  width: 240px;
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.card};
  border-right: 1px solid ${({ theme }) => theme.colors.border};
`;

const Brand = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary};
`;

const Nav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xxs};
`;
