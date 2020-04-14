import { usePanelStore } from '@/Stores/PanelStore';
import { Colors, Icon, Tag, Tooltip } from '@blueprintjs/core';
import classnames from 'classnames';
import React, { CSSProperties, FunctionComponent, memo } from 'react';
import { DDPLogDirection } from './DDPLogDirection';
import { DDPLogPreview } from './DDPLogPreview';
import { sendContentMessage } from '@/Bridge';
import moment from 'moment';
import { PanelPage } from '@/Constants';

interface Props extends DDPLog {
  log: DDPLog;
  isNew: boolean;
  isStarred: boolean;
  style: CSSProperties;
}

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
    trace,
    style,
  }) => {
    const store = usePanelStore();

    const classes = classnames('mde-ddp__log-row', {
      'mde-ddp__log-row--new': isNew,
      'mde-ddp__log-row--starred': isStarred,
    });

    return (
      <div className={classes} style={style}>
        <div className='time'>
          <Tooltip
            content={timestampLong || moment(timestamp).toLocaleString()}
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

        <div className='interactions'>
          <Tooltip
            content='View Stack Trace'
            hoverOpenDelay={800}
            position='top'
          >
            <Icon
              icon='eye-open'
              onClick={() => trace && store.setActiveStackTrace(trace)}
            />
          </Tooltip>
          <Tooltip content='Star & Keep' hoverOpenDelay={800} position='top'>
            {isStarred ? (
              <Icon
                icon='star'
                onClick={() => store.bookmarkStore.remove(log)}
              />
            ) : (
              <Icon
                icon='star-empty'
                onClick={() => store.bookmarkStore.add(log)}
              />
            )}
          </Tooltip>

          <Tooltip content='Replay Method' hoverOpenDelay={800} position='top'>
            {log.parsedContent?.msg === 'method' ? (
              <Icon
                icon='play'
                onClick={() => {
                  store.setSelectedTabId(PanelPage.DDP);

                  sendContentMessage({
                    eventType: 'ddp-run-method',
                    data: log.parsedContent,
                    source: 'meteor-devtools-evolved',
                  });
                }}
                color={Colors.WHITE}
              />
            ) : (
              <Icon
                icon='play'
                color={Colors.GRAY1}
                style={{ cursor: 'default' }}
              />
            )}
          </Tooltip>
        </div>

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
      </div>
    );
  },
);
