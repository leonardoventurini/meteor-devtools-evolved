export const PLAYGROUND_TAB = {
  RUN: 'run',
  COMPARE: 'compare',
  MATRIX: 'matrix',
  CATALOG: 'catalog',
  SAVED: 'saved',
} as const

export type PlaygroundTab = (typeof PLAYGROUND_TAB)[keyof typeof PLAYGROUND_TAB]

export const PLAYGROUND_TAB_LABELS: Record<PlaygroundTab, string> = {
  run: 'Run',
  compare: 'Compare',
  matrix: 'Matrix',
  catalog: 'Catalog',
  saved: 'Saved',
}
