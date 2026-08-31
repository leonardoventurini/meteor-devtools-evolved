export const DEFAULT_OFFSET = 50

export const DEVELOPMENT = import.meta.env.MODE === 'development'

export enum PanelPage {
  DDP = 'ddp',
  BOOKMARKS = 'bookmarks',
  MINIMONGO = 'minimongo',
  SUBSCRIPTIONS = 'subscriptions',
  PERFORMANCE = 'performance',
}
