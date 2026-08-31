import { Button, ButtonGroup, Classes, Drawer, Tag } from '@blueprintjs/core'
import { Tooltip } from '@blueprintjs/core'
import classnames from 'classnames'
import React, { FunctionComponent, useEffect, useMemo, useState } from 'react'
import { browser } from 'wxt/browser'
import { getCleanStackFrames } from '@/Utils/StackTrace'
import { openTab } from '@/Utils/BackgroundEvents'

type StackViewMode = 'clean' | 'raw'

const DEFAULT_VIEW_MODE: StackViewMode = 'clean'

const getSourceLabel = (frame: StackTrace) => {
  if (!frame.url) return null

  try {
    const sourceUrl = new URL(frame.url)
    const filename = sourceUrl.pathname.split('/').findLast(Boolean)
    const location = [frame.line, frame.column].filter(Boolean).join(':')

    return `${filename || sourceUrl.hostname}${location ? `:${location}` : ''}`
  } catch {
    return frame.url
  }
}

const openSource = (frame: StackTrace) => {
  if (!frame.url) return

  if (typeof browser.devtools.panels.openResource === 'function') {
    browser.devtools.panels.openResource(
      frame.url,
      Math.max((frame.line ?? 1) - 1, 0),
    )
    return
  }

  openTab(frame.url)
}

interface Props {
  activeStackTrace: StackTrace[] | null

  onClose(): void
}

export const DrawerStackTrace: FunctionComponent<Props> = ({
  activeStackTrace,
  onClose,
}) => {
  const [viewMode, setViewMode] = useState<StackViewMode>(DEFAULT_VIEW_MODE)
  const cleanFrames = useMemo(
    () => getCleanStackFrames(activeStackTrace ?? []),
    [activeStackTrace],
  )
  const displayedFrames =
    viewMode === 'clean' ? cleanFrames : (activeStackTrace ?? [])

  useEffect(() => setViewMode(DEFAULT_VIEW_MODE), [activeStackTrace])

  return (
    <Drawer
      icon='document'
      title='Stack Trace'
      isOpen={!!activeStackTrace}
      onClose={onClose}
      size='72%'
    >
      <div className={Classes.DRAWER_BODY}>
        <div className={classnames(Classes.DIALOG_BODY, 'mde-stack-trace')}>
          <div className='mde-stack-trace-toolbar'>
            <ButtonGroup className='gap-2' minimal>
              <Button
                active={viewMode === 'clean'}
                onClick={() => setViewMode('clean')}
                text={`Cleaned (${cleanFrames.length})`}
              />
              <Button
                active={viewMode === 'raw'}
                onClick={() => setViewMode('raw')}
                text={`Raw (${activeStackTrace?.length ?? 0})`}
              />
            </ButtonGroup>
          </div>

          {displayedFrames.length === 0 ? (
            <p>
              No application frames found. Switch to Raw to inspect all frames.
            </p>
          ) : null}

          {displayedFrames.map((frame, index) => {
            const sourceLabel = getSourceLabel(frame)

            return (
              <div
                className={classnames('mde-stack-frame', {
                  'mde-stack-frame-application': frame.isApplication,
                  'mde-stack-frame-internal': frame.isInternal,
                })}
                key={`${frame.raw}-${index}`}
              >
                <div className='mde-stack-frame-heading'>
                  <code>{frame.callee.trim() || 'Anonymous'}</code>
                  {frame.isApplication ? <Tag intent='success'>App</Tag> : null}
                  {(frame.occurrences ?? 1) > 1 ? (
                    <Tag minimal>×{frame.occurrences}</Tag>
                  ) : null}
                </div>

                {sourceLabel && frame.url ? (
                  <Tooltip content={frame.url}>
                    <button
                      className='mde-stack-source'
                      onClick={() => openSource(frame)}
                      type='button'
                    >
                      {sourceLabel}
                    </button>
                  </Tooltip>
                ) : null}

                {viewMode === 'raw' ? (
                  <pre className='mde-stack-frame-raw'>{frame.raw}</pre>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </Drawer>
  )
}
