import { Callout, Card, Radio, RadioGroup, Spinner } from '@blueprintjs/core'
import React, { FunctionComponent, useEffect, useState } from 'react'
import {
  DDPHistoryPolicy,
  getDDPHistoryPolicy,
  setDDPHistoryPolicy,
} from '@/Browser/DDPHistoryPolicy'

export const Options: FunctionComponent = () => {
  const [policy, setPolicy] = useState<DDPHistoryPolicy | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setSaving] = useState(false)

  useEffect(() => {
    void getDDPHistoryPolicy().then(setPolicy)
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

  return (
    <main className='options-layout'>
      <h1>Meteor DevTools Evolved</h1>
      <p>Configure how the extension begins each DDP inspection session.</p>

      <Card>
        <div className='options-heading'>
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
            <p className='option-description'>
              Replay messages captured before the DevTools panel opened. This is
              the default and is useful when investigating earlier activity.
            </p>

            <Radio
              label='Start from now'
              value={DDPHistoryPolicy.START_FROM_NOW}
            />
            <p className='option-description'>
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
      </Card>
    </main>
  )
}
