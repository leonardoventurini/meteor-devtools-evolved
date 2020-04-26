import React, { FunctionComponent, InputHTMLAttributes } from 'react';
import styled from 'styled-components';
import { Icon, IconName } from '@blueprintjs/core';

const Wrapper = styled.div`
  background: transparent;
  border: none;
`;

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  icon?: IconName;
}

export const Search: FunctionComponent<Props> = ({ icon, ...rest }) => (
  <Wrapper>
    <Icon icon={icon} iconSize={12} />
    <input type='text' {...rest} />
  </Wrapper>
);
