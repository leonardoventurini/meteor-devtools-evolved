import { css } from 'styled-components';

export const truncate = () => css`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
