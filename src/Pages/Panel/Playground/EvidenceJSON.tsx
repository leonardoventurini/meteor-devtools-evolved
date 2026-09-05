import React, { useState } from 'react'
import styles from './Playground.module.css'

const JSON_PAGE_CHARS = 16_384
export function EvidenceJSON({
  value,
  label = 'Evidence',
}: {
  value: unknown
  label?: string
}) {
  const [page, setPage] = useState(0)
  const text = JSON.stringify(value, null, 2) ?? ''
  const lastPage = Math.max(0, Math.ceil(text.length / JSON_PAGE_CHARS) - 1)
  const current = Math.min(page, lastPage)
  return (
    <div>
      <pre aria-label={label}>
        {text.slice(current * JSON_PAGE_CHARS, (current + 1) * JSON_PAGE_CHARS)}
      </pre>
      {lastPage > 0 && (
        <div className={styles.actions}>
          <button
            onClick={() => setPage(Math.max(0, current - 1))}
            disabled={current === 0}
          >
            Previous evidence page
          </button>
          <span>
            {current + 1} / {lastPage + 1} · {text.length.toLocaleString()}{' '}
            characters
          </span>
          <button
            onClick={() => setPage(Math.min(lastPage, current + 1))}
            disabled={current === lastPage}
          >
            Next evidence page
          </button>
        </div>
      )}
    </div>
  )
}
