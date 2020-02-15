import { RefObject } from 'react';
import { defer } from 'lodash';

export const scrollToBottom = (ref: RefObject<HTMLDivElement>) =>
  ref.current?.scrollTo(0, ref.current?.scrollHeight);

/**
 * Only auto-scroll if already scrolled all the way to the bottom.
 *
 * @param ref
 */
export const tryScroll = (ref: RefObject<HTMLDivElement>) => {
  const { scrollHeight, scrollTop = 0, clientHeight = 0 } = ref?.current ?? {};

  if (scrollHeight === scrollTop + clientHeight) {
    defer(() => scrollToBottom(ref));
  }
};
