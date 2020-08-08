import { Tag, Tooltip } from '@blueprintjs/core';
import classnames from 'classnames';
import React, { CSSProperties, FunctionComponent } from 'react';
import { DDPLogDirection } from './DDPLogDirection';
import { DDPLogPreview } from './DDPLogPreview';
import { DateTime } from 'luxon';
import styled from 'styled-components';
import { truncate } from '@/Styles/Mixins';
import { DDPLogMenu } from '@/Pages/Panel/DDP/DDPLogMenu';
import { StringUtils } from '@/Utils/StringUtils';

interface Props {
  log: DDPLog;
  style: CSSProperties;
  isNew: boolean;
  isStarred: boolean;
}

const DDPLogWrapper = styled.div`
  display: flex;
  align-items: center;
  flex-direction: row;
  justify-content: space-between;
  padding: 5px 15px;

  transition: background-color 0.5s ease;

  font-family: 'Iosevka Medium', monospace;

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
    font-size: 11px;
    font-family: inherit;
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
        font-family: 'Iosevka Medium', monospace;
        ${truncate}
      }
    }
  }

  &:hover {
    background-color: #394b59;
  }

  .menu {
    visibility: hidden;

    .bp3-icon + .bp3-icon {
      margin-left: 8px;
    }
  }

  &:hover .menu {
    visibility: visible;
  }
`;

export const DDPLog: FunctionComponent<Props> = ({
  log,
  style,
  isNew,
  isStarred,
}) => {
  const classes = classnames({
    'm-new': isNew,
    'm-starred': isStarred,
  });

  return (
    <DDPLogWrapper className={classes} style={style}>
      <div className='time'>
        <Tooltip
          content={
            log.timestampLong ||
            (log.timestamp
              ? DateTime.fromMillis(log.timestamp).toLocaleString()
              : '')
          }
          hoverOpenDelay={800}
          position='top'
        >
          <small>{log.timestampPretty}</small>
        </Tooltip>
      </div>
      <div className='direction'>
        <DDPLogDirection
          isOutbound={log.isOutbound}
          isInbound={log.isInbound}
        />
      </div>
      <div className='content'>
        <DDPLogPreview
          parsedContent={log.parsedContent}
          preview={log.preview}
          filterType={log.filterType}
        />
      </div>

      <DDPLogMenu log={log} />

      <div className='size'>
        <Tag minimal>{log.sizePretty}</Tag>
      </div>

      {log.hash && (
        <div className='hash'>
          <Tooltip content='Copy CRC32' hoverOpenDelay={800} position='top'>
            <Tag
              minimal
              interactive
              onClick={() => {
                StringUtils.toClipboard(log.hash as string);
              }}
            >
              {log.hash}
            </Tag>
          </Tooltip>
        </div>
      )}
    </DDPLogWrapper>
  );
};
