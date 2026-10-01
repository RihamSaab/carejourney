import styled from 'styled-components';

export type DividerOrientation = 'horizontal' | 'vertical';

type DividerProps = {
  orientation?: DividerOrientation;
};

export const Divider = ({ orientation = 'horizontal' }: DividerProps) => {
  return <Root role="separator" aria-orientation={orientation} $orientation={orientation} />;
};

const Root = styled.div<{ $orientation: DividerOrientation }>`
  background: ${({ theme }) => theme.colors.border};
  ${({ $orientation }) =>
    $orientation === 'horizontal'
      ? `
        width: 100%;
        height: 1px;
      `
      : `
        width: 1px;
        align-self: stretch;
      `}
`;
