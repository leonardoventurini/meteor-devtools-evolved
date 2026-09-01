export const DEFAULT_OFFSET = 50
export const DDP_LOG_RETENTION_LIMIT = 5000

export const DEVELOPMENT = import.meta.env.MODE === 'development'

export enum PanelPage {
  DDP = 'ddp',
  BOOKMARKS = 'bookmarks',
  MINIMONGO = 'minimongo',
  SUBSCRIPTIONS = 'subscriptions',
  PERFORMANCE = 'performance',
}
