import React, { PropsWithChildren } from 'react';

interface Props<C, R> {
  collection: C[];
  renderer: R;
  rowHeight: number;
}

export const VirtualList = <C, R>({
  children,
}: PropsWithChildren<Props<C, R>>) => {
  return <div>{children}</div>;
};
