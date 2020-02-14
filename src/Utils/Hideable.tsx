import React, { FunctionComponent, HTMLProps } from 'react';

interface Props {
  isHidden: boolean;
}

export const Hideable: FunctionComponent<Props & HTMLProps<HTMLDivElement>> = ({
  children,
  isHidden,
  ...props
}) => {
  const styles = {
    display: isHidden ? 'none' : undefined,
  };

  return (
    <div style={styles} {...props}>
      {children}
    </div>
  );
};
