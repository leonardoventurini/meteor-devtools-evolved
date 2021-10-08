export const DEFAULT_OFFSET = 50

export const DEVELOPMENT = process.env.MODE === 'development'

export enum PanelPage {
  DDP = 'ddp',
  BOOKMARKS = 'bookmarks',
  MINIMONGO = 'minimongo',
  SUBSCRIPTIONS = 'subscriptions',
}
