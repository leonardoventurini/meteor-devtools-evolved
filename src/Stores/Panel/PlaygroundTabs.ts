export const PLAYGROUND_TAB = {
  RUN: 'run',
  HISTORY: 'history',
} as const

export type PlaygroundTab = (typeof PLAYGROUND_TAB)[keyof typeof PLAYGROUND_TAB]

export const PLAYGROUND_TAB_LABELS: Record<PlaygroundTab, string> = {
  run: 'Run',
  history: 'History',
}
