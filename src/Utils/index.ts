import { RefObject } from 'react';

export const scrollToBottom = (ref: RefObject<HTMLDivElement>) =>
  ref.current?.scrollTo(0, ref.current?.scrollHeight);
