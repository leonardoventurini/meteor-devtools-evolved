import { usePanelStore } from '@/Stores/PanelStore';
import { Tag, Tooltip } from '@blueprintjs/core';
import classnames from 'classnames';
import React, { CSSProperties, FunctionComponent, memo } from 'react';
import { DDPLogDirection } from './DDPLogDirection';
import { DDPLogPreview } from './DDPLogPreview';
import { DateTime } from 'luxon';
import styled from 'styled-components';
import { truncate } from '@/Styles/Mixins';
import { DDPLogMenu } from '@/Pages/Panel/DDP/DDPLogMenu';

interface Props extends DDPLog {
  log: DDPLog;
  isNew: boolean;
  isStarred: boolean;
  style: CSSProperties;
}

const DDPLogWrapper = styled.div`
  display: flex;
  align-items: center;
  flex-direction: row;
  justify-content: space-between;
  padding: 5px 15px;

  transition: background-color 0.5s ease;

  &.m-new {
    background-color: #30594d;
  }

  &.m-starred {
    background-color: #304066;
  }

  div + div {
    margin-left: 10px;
  }

  .time {
    font-family: monospace;
  }

  .content {
    display: flex;
    flex: 1;
    align-items: center;
    min-width: 0;

    .content-icon {
      margin-right: 10px;
    }

    .content-preview {
      flex: 0 1 auto;
      min-width: 0;

      code {
        ${truncate}
      }
    }
  }

  .hash {
    font-family: monospace;
  }

  .interactions {
    flex: 0 0 auto;

    visibility: hidden;

    span {
      cursor: pointer;
    }

    span + span {
      margin-left: 8px;
    }
  }

  &:hover {
    background-color: #394b59;
  }

  &:hover .interactions {
    visibility: visible;
  }
`;

export const DDPLog: FunctionComponent<Props> = memo(
  ({
    hash,
    isInbound,
    isNew,
    isOutbound,
    isStarred,
    log,
    sizePretty,
    timestamp,
    timestampPretty,
    timestampLong,
    style,
  }) => {
    const store = usePanelStore();

    const classes = classnames({
      'm-new': isNew,
      'm-starred': isStarred,
    });

    return (
      <DDPLogWrapper className={classes} style={style}>
        <div className='time'>
          <Tooltip
            content={
              timestampLong ||
              (timestamp ? DateTime.fromMillis(timestamp).toLocaleString() : '')
            }
            hoverOpenDelay={800}
            position='top'
          >
            <small>{timestampPretty}</small>
          </Tooltip>
        </div>
        <div className='direction'>
          <DDPLogDirection isOutbound={isOutbound} isInbound={isInbound} />
        </div>
        <div className='content'>
          <DDPLogPreview log={log} store={store} />
        </div>

        <div className='size'>
          <Tag minimal>{sizePretty}</Tag>
        </div>

        <DDPLogMenu log={log} store={store} />

        {hash && (
          <div className='hash'>
            <Tooltip content='Copy CRC32' hoverOpenDelay={800} position='top'>
              <Tag
                minimal
                interactive
                onClick={() => {
                  navigator.clipboard.writeText(hash).catch(console.error);
                }}
              >
                {hash}
              </Tag>
            </Tooltip>
          </div>
        )}
      </DDPLogWrapper>
    );
  },
);
