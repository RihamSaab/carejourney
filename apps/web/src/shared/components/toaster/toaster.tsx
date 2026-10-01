import { Toaster as SonnerToaster } from 'sonner';
import styled from 'styled-components';

export const Toaster = () => {
  return (
    <ToasterHost>
      <SonnerToaster
        position="top-right"
        closeButton
        richColors={false}
        toastOptions={{
          className: 'hospital-toast',
        }}
      />
    </ToasterHost>
  );
};

const ToasterHost = styled.div`
  --normal-bg: ${({ theme }) => theme.colors.card};
  --normal-text: ${({ theme }) => theme.colors.foreground};
  --normal-border: ${({ theme }) => theme.colors.border};

  --success-bg: ${({ theme }) => theme.colors.card};
  --success-text: ${({ theme }) => theme.colors.success};
  --success-border: ${({ theme }) => theme.colors.border};

  --error-bg: ${({ theme }) => theme.colors.card};
  --error-text: ${({ theme }) => theme.colors.destructive};
  --error-border: ${({ theme }) => theme.colors.border};

  [data-sonner-toaster] {
    font-family: ${({ theme }) => theme.typography.fontFamily.sans};
  }

  [data-sonner-toast] {
    border-radius: ${({ theme }) => theme.radii.md};
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }
`;
