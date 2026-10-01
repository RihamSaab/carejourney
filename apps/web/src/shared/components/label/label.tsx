import type { LabelHTMLAttributes } from 'react';
import styled from 'styled-components';

type LabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  required?: boolean;
};

export const Label = ({ required = false, children, ...rest }: LabelProps) => {
  return (
    <Root {...rest}>
      {children}
      {required ? <RequiredMark aria-hidden>*</RequiredMark> : null}
    </Root>
  );
};

const Root = styled.label`
  display: inline-block;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.foreground};
`;

const RequiredMark = styled.span`
  margin-left: ${({ theme }) => theme.spacing.xxs};
  color: ${({ theme }) => theme.colors.destructive};
`;
