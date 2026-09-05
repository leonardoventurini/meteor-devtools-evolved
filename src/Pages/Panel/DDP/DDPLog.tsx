import styles from './DDPLog.module.css'
import { Tag, Tooltip } from '@blueprintjs/core'
import classnames from 'classnames'
import React, { CSSProperties, FunctionComponent } from 'react'
import { DDPLogDirection } from './DDPLogDirection'
import { DDPLogPreview } from './DDPLogPreview'
import { DateTime } from 'luxon'
import { DDPLogMenu } from '@/Pages/Panel/DDP/DDPLogMenu'

interface Props {
  log: DDPLog
  style: CSSProperties
  isNew: boolean
  isStarred: boolean
}

export const DDPLog: FunctionComponent<Props> = ({
  log,
  style,
  isNew,
  isStarred,
}) => {
  const classes = classnames(
    {
      [styles.new]: isNew,
      [styles.starred]: isStarred,
    },
    'group',
    styles.root,
  )

  return (
    <div className={classes} style={style}>
      <div className={styles.time}>
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
      <div className={styles.content}>
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
    </div>
  )
}
