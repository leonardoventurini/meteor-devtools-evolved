import {
  Button,
  Callout,
  Card,
  Radio,
  RadioGroup,
  Spinner,
} from '@blueprintjs/core'
import React, { FunctionComponent, useEffect, useState } from 'react'
import styled from 'styled-components'
import {
  DDPHistoryPolicy,
  getDDPHistoryPolicy,
  setDDPHistoryPolicy,
} from '@/Browser/DDPHistoryPolicy'
import { Hideable } from '@/Utils/Hideable'

interface Props {
  isVisible: boolean
}

const SettingsContent = styled(Hideable)`
  box-sizing: border-box;
  overflow-y: auto !important;
  padding: 24px;

  .mde-settings-content {
    max-width: 640px;
  }

  h1 {
    margin: 0 0 8px;
    font-size: 20px;
  }

  .mde-settings-intro {
    margin: 0 0 20px;
    color: #abb3bf;
  }

  .mde-settings-card {
    background: rgba(16, 22, 26, 0.35);
  }

  .mde-settings-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;

    h2 {
      margin: 0;
      font-size: 15px;
    }
  }

  .mde-settings-description {
    margin: -4px 0 14px 26px;
    color: #abb3bf;
    line-height: 1.5;
  }

  .mde-settings-reload {
    margin-top: 18px;
  }
`

export const Settings: FunctionComponent<Props> = ({ isVisible }) => {
  const [initialPolicy, setInitialPolicy] = useState<DDPHistoryPolicy | null>(
    null,
  )
  const [policy, setPolicy] = useState<DDPHistoryPolicy | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setSaving] = useState(false)

  useEffect(() => {
    let isMounted = true

    void getDDPHistoryPolicy().then(storedPolicy => {
      if (!isMounted) return

      setInitialPolicy(storedPolicy)
      setPolicy(storedPolicy)
    })

    return () => {
      isMounted = false
    }
  }, [])

  const updatePolicy = async (nextPolicy: DDPHistoryPolicy) => {
    const previousPolicy = policy

    setPolicy(nextPolicy)
    setError(null)
    setSaving(true)

    try {
      await setDDPHistoryPolicy(nextPolicy)
    } catch {
      setPolicy(previousPolicy)
      setError('Unable to save the DDP startup history setting.')
    } finally {
      setSaving(false)
    }
  }

  const requiresReload =
    initialPolicy !== null && policy !== null && initialPolicy !== policy

  return (
    <SettingsContent className='mde-content' isVisible={isVisible}>
      <div className='mde-settings-content'>
        <h1>Settings</h1>
        <p className='mde-settings-intro'>
          Configure how this extension begins each DDP inspection session.
        </p>

        <Card className='mde-settings-card'>
          <div className='mde-settings-heading'>
            <h2>DDP startup history</h2>
            {isSaving && <Spinner aria-label='Saving' size={16} />}
          </div>

          {policy === null ? (
            <Spinner aria-label='Loading settings' />
          ) : (
            <RadioGroup
              aria-label='DDP startup history'
              onChange={event =>
                void updatePolicy(event.currentTarget.value as DDPHistoryPolicy)
              }
              selectedValue={policy}
            >
              <Radio
                label='Show captured history'
                value={DDPHistoryPolicy.SHOW_HISTORY}
              />
              <p className='mde-settings-description'>
                Replay messages captured before the DevTools panel opened. This
                is the default and is useful when investigating earlier
                activity.
              </p>

              <Radio
                label='Start from now'
                value={DDPHistoryPolicy.START_FROM_NOW}
              />
              <p className='mde-settings-description'>
                Discard cached messages and byte totals for the inspected tab,
                then show only newly captured traffic.
              </p>
            </RadioGroup>
          )}

          {error && (
            <Callout intent='danger' title='Setting not saved'>
              {error}
            </Callout>
          )}

          {requiresReload && (
            <Callout
              className='mde-settings-reload'
              intent='warning'
              title='Reload required'
            >
              Reload the DevTools panel to apply this setting to the current
              inspection session.
              <div>
                <Button icon='refresh' onClick={() => location.reload()}>
                  Reload panel
                </Button>
              </div>
            </Callout>
          )}
        </Card>
      </div>
    </SettingsContent>
  )
}
