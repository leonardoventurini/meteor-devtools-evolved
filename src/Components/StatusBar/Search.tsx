import React, { FunctionComponent, InputHTMLAttributes } from 'react';
import styled from 'styled-components';

const Input = styled.input`
  background: transparent;
  border: none;
`;

export const Search: FunctionComponent<InputHTMLAttributes<
  HTMLInputElement
>> = props => <Input type='text' {...props} />;
