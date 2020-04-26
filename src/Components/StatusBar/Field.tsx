import React, { FunctionComponent } from 'react';
import styled from 'styled-components';
import { centerItems } from '@/Styles/Mixins';
import { Icon, IconName } from '@blueprintjs/core';
import { exists } from '@/Utils';
import classnames from 'classnames';

const Wrapper = styled.span`
  ${centerItems};
  height: 100%;
  padding: 0 8px;

  .icon + span {
    margin-left: 4px;
  }

  &.warning {
    background-color: rgba(217, 130, 43, 0.25);
    color: #ffb366;
  }
`;

interface Props {
  icon?: IconName;
  intent?: 'warning';
  className?: string;
}

export const Field: FunctionComponent<Props> = ({
  children,
  icon,
  className,
  intent,
}) => {
  const classes = classnames(
    {
      warning: intent === 'warning',
    },
    className,
  );

  return (
    <Wrapper className={classes}>
      {icon && <Icon icon={icon} className='icon' iconSize={12} />}
      {exists(children) && <span>{children}</span>}
    </Wrapper>
  );
};
