import React, { ButtonHTMLAttributes, FunctionComponent } from 'react';
import styled from 'styled-components';
import { Icon, IconName } from '@blueprintjs/core';
import { centerItems } from '@/Styles/Mixins';
import classnames from 'classnames';
import { exists } from '@/Utils';

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

  &.warning {
    background-color: rgba(217, 130, 43, 0.25);
    color: #ffb366;
  }
`;

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: IconName;
  intent?: 'warning';
}

export const Button: FunctionComponent<Props> = ({
  icon,
  children,
  intent,
  ...rest
}) => {
  const classes = classnames({
    warning: intent === 'warning',
  });

  return (
    <ButtonWrapper className={classes} {...rest}>
      {icon && <Icon icon={icon} className='icon' iconSize={12} />}
      {exists(children) && <span>{children}</span>}
    </ButtonWrapper>
  );
};
