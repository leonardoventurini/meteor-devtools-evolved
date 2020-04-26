import React, { ButtonHTMLAttributes, FunctionComponent } from 'react';
import styled from 'styled-components';
import { Icon, IconName } from '@blueprintjs/core';
import { centerItems } from '@/Styles/Mixins';

const ButtonWrapper = styled.button`
  ${centerItems};

  cursor: pointer;
  background: transparent;
  border: none;
  color: #eee;
  font-size: 1rem;
  padding: 0 8px;

  .icon + span {
    margin-left: 4px;
  }
`;

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: IconName;
}

export const Button: FunctionComponent<Props> = ({
  icon,
  children,
  ...rest
}) => (
  <ButtonWrapper {...rest}>
    {icon && <Icon icon={icon} className='icon' iconSize={12} />}
    {children && <span>{children}</span>}
  </ButtonWrapper>
);
