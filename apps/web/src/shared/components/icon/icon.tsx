import type { LucideIcon } from 'lucide-react';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

type IconProps = {
  icon: LucideIcon;
  size?: IconSize;
  label?: string;
  className?: string;
};

const SIZE_PX: Record<IconSize, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

export const Icon = ({ icon: LucideIconComponent, size = 'md', label, className }: IconProps) => {
  const isDecorative = label === undefined;

  return (
    <LucideIconComponent
      size={SIZE_PX[size]}
      className={className}
      aria-hidden={isDecorative}
      aria-label={label}
      role={isDecorative ? undefined : 'img'}
      focusable={false}
    />
  );
};
