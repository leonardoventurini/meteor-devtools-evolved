import React, { FunctionComponent, InputHTMLAttributes } from 'react';
import styled from 'styled-components';
import { Icon, IconName } from '@blueprintjs/core';
import { centerItems } from '@/Styles/Mixins';

const Wrapper = styled.div`
  ${centerItems};
  height: 100%;
  padding: 0 8px;
  background-color: rgba(0, 0, 0, 0.2);

  .icon {
    margin-right: 6px;
  }

  input[type='text'] {
    border: none;
    background: transparent;
    height: 100%;

    color: #eee;

    ::placeholder {
      color: #aaa;
    }
  }
`;

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  icon?: IconName;
}

export const TextInput: FunctionComponent<Props> = ({ icon, ...rest }) => (
  <Wrapper>
    <Icon icon={icon} iconSize={12} className='icon' />
    <input type='text' {...rest} />
  </Wrapper>
);
