import React, { ButtonHTMLAttributes, FunctionComponent } from 'react'
import styled from 'styled-components'
import { Icon, IconName, Intent, Popover } from '@blueprintjs/core'
import { centerItems, truncate } from '@/Styles/Mixins'
import classnames from 'classnames'
import { isNumber, isString } from 'lodash'

const ButtonWrapper = styled.button`
  ${centerItems};

  cursor: pointer;
  position: relative;
  overflow: hidden;
  background: transparent;
  border: none;
  color: #eee;
  font-size: 1rem;
  padding: 0 8px;

  .icon + span {
    margin-left: 4px;
  }

  &.warning {
    background-color: rgba(217, 130, 43, 0.25);
    color: #ffb366;

    &:hover {
      background-color: rgba(217, 130, 43, 0.25);
    }

    &:active {
      background-color: rgba(217, 130, 43, 0.1);
    }
  }

  &:hover:not([disabled], .warning) {
    background-color: rgba(0, 0, 0, 0.2);
  }

  &[disabled] {
    cursor: not-allowed;
  }

  &.shine {
    &:before {
      content: '';
      display: block;
      position: absolute;
      background: rgba(255, 255, 255, 0.5);
      width: 60px;
      height: 100%;
      left: 0;
      top: 0;
      opacity: 0.5;
      filter: blur(30px);
      transform: translateX(-100px) skewX(-15deg);
    }

    &:after {
      content: '';
      display: block;
      position: absolute;
      background: rgba(255, 255, 255, 0.2);
      width: 30px;
      height: 100%;
      left: 30px;
      top: 0;
      opacity: 0;
      filter: blur(5px);
      transform: translateX(-100px) skewX(-15deg);
    }

    &:hover:before {
      transform: translateX(300px) skewX(-15deg);
      opacity: 0.6;
      transition: 1.5s;
    }

    &:hover:after {
      transform: translateX(300px) skewX(-15deg);
      opacity: 1;
      transition: 1.5s;
    }
  }

  .button-wrapper {
    display: flex;
    align-items: center;
    width: 100%;

    span.content {
      flex-grow: 1;
      ${truncate};
      text-align: left;
    }

    span.subtitle {
      flex-shrink: 0;
      flex-grow: 1;
      font-size: 10px;
      color: #ccc;
      margin-left: auto;
      text-align: right;
    }
  }
`

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: IconName | JSX.Element
  intent?: Intent
  shine?: boolean
  active?: boolean
  subtitle?: string
}

export const Button: FunctionComponent<Props> = ({
  icon,
  children,
  intent,
  className,
  shine,
  active,
  subtitle,
  title,
  ...rest
}) => {
  const classes = classnames(
    {
      shine,
      active,
      warning: intent === 'warning',
    },
    className,
  )

  if (title) {
    return (
      <ButtonWrapper className={classes} {...rest}>
        <Popover
          content={<div className='p-4'>{title}</div>}
          interactionKind='hover'
        >
          <div className='button-wrapper'>
            {icon &&
              (isString(icon) ? (
                <Icon icon={icon} className='icon' iconSize={12} />
              ) : (
                icon
              ))}
            {(children || isNumber(children)) && (
              <span className='content'>{children}</span>
            )}
            {(subtitle || isNumber(subtitle)) && (
              <span className='subtitle'>{subtitle}</span>
            )}
          </div>
        </Popover>
      </ButtonWrapper>
    )
  }

  return (
    <ButtonWrapper className={classes} {...rest}>
      <div className='button-wrapper'>
        {icon &&
          (isString(icon) ? (
            <Icon icon={icon} className='icon' iconSize={12} />
          ) : (
            icon
          ))}
        {(children || isNumber(children)) && (
          <span className='content'>{children}</span>
        )}
        {(subtitle || isNumber(subtitle)) && (
          <span className='subtitle'>{subtitle}</span>
        )}
      </div>
    </ButtonWrapper>
  )
}
