import { css } from 'styled-components';

export const truncate = () => css`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const centerItems = () => css`
  display: flex;
  flex-direction: row;
  align-items: center;
`;
