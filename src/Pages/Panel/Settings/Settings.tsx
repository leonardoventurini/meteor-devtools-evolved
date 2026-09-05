import {
  Button,
  Callout,
  Card,
  Dialog,
  DialogBody,
  DialogFooter,
  Radio,
  RadioGroup,
  Spinner,
} from '@blueprintjs/core'
import React, { FunctionComponent, useEffect, useState } from 'react'
import styles from './Settings.module.css'
import {
  DDPHistoryPolicy,
  getDDPHistoryPolicy,
  setDDPHistoryPolicy,
} from '@/Browser/DDPHistoryPolicy'
import { Hideable } from '@/Utils/Hideable'

interface Props {
  isVisible: boolean
}

export const Settings: FunctionComponent<Props> = ({ isVisible }) => {
  const [initialPolicy, setInitialPolicy] = useState<DDPHistoryPolicy | null>(
    null,
  )
  const [policy, setPolicy] = useState<DDPHistoryPolicy | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setSaving] = useState(false)
  const [isReloadDialogOpen, setReloadDialogOpen] = useState(false)

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
      setReloadDialogOpen(
        initialPolicy !== null && initialPolicy !== nextPolicy,
      )
    } catch {
      setPolicy(previousPolicy)
      setError('Unable to save the DDP startup history setting.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Hideable className={`mde-content ${styles.root}`} isVisible={isVisible}>
      <Dialog
        className={styles.reloadDialog}
        icon='refresh'
        isOpen={isReloadDialogOpen}
        onClose={() => setReloadDialogOpen(false)}
        role='alertdialog'
        title='Reload DevTools panel?'
      >
        <DialogBody useOverflowScrollContainer={false}>
          <p className={styles.reloadCopy}>
            Your preference is saved. Reload the DevTools panel to apply it to
            the current inspection session.
          </p>
        </DialogBody>
        <DialogFooter
          actions={
            <>
              <Button onClick={() => setReloadDialogOpen(false)}>Later</Button>
              <Button
                icon='refresh'
                intent='primary'
                onClick={() => location.reload()}
              >
                Reload now
              </Button>
            </>
          }
        />
      </Dialog>

      <div className={styles.content}>
        <h1>Settings</h1>
        <p className={styles.intro}>
          Configure how this extension begins each DDP inspection session.
        </p>

        <Card className={styles.card}>
          <div className={styles.heading}>
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
              <p className={styles.description}>
                Replay messages captured before the DevTools panel opened. This
                is the default and is useful when investigating earlier
                activity.
              </p>

              <Radio
                label='Start from now'
                value={DDPHistoryPolicy.START_FROM_NOW}
              />
              <p className={styles.description}>
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
      </div>
    </Hideable>
  )
}
