import React, { FunctionComponent } from 'react';
import styled from 'styled-components';
import { centerItems } from '@/Styles/Mixins';
import { Icon, IconName } from '@blueprintjs/core';
import { exists } from '@/Utils';

const Wrapper = styled.span`
  ${centerItems};
  height: 100%;
  padding: 0 8px;

  .icon + span {
    margin-left: 4px;
  }
`;

interface Props {
  icon?: IconName;
}

export const Field: FunctionComponent<Props> = ({ children, icon }) => (
  <Wrapper>
    {icon && <Icon icon={icon} className='icon' iconSize={12} />}
    {exists(children) && <span>{children}</span>}
  </Wrapper>
);
