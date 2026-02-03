import React, { FunctionComponent, HTMLProps } from 'react'

interface Props {
  isVisible: boolean
}

export const Hideable: FunctionComponent<Props & HTMLProps<HTMLDivElement>> = ({
  children,
  isVisible,
  ...props
}) => {
  const styles = {
    display: isVisible ? undefined : 'none',
  }

  return (
    <div className='hideable' style={styles} {...props}>
      {children}
    </div>
  )
}
