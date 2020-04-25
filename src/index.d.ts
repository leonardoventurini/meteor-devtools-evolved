declare module '*.gif';

interface Window {
  __devtools: boolean;
  __devtools_receiveMessage(message: Message<any>): void;
}

declare module Meteor {
  let __devtools: boolean;
  const connection: any;
}

type MessageSource = 'meteor-devtools-evolved';
type EventType =
  | 'ddp-event'
  | 'minimongo-get-collections'
  | 'ddp-run-method'
  | 'console'
  | 'sync-subscriptions';

interface Message<T> {
  eventType: EventType;
  data: T;
}

interface IMessagePayload<T> extends Message<T> {
  source: MessageSource;
}

interface StackTrace {
  columnNumber: number;
  lineNumber: number;
  source: string;
  functionName?: string;
  fileName?: string;
}

interface DDPError {
  isClientSafe: boolean;
  error: number;
  reason: string;
  message: string;
  errorType: string;
}

interface DDPLogContent {
  msg?: string;
  collection?: string;
  session?: string;
  id?: string;
  method?: string;
  result?: string;
  name?: string;
  error?: DDPError;
}

interface DDPLog {
  id: string;
  content: string;
  parsedContent?: DDPLogContent;
  trace?: StackTrace[];
  isInbound?: boolean;
  isOutbound?: boolean;
  timestamp?: number;
  timestampPretty?: string;
  timestampLong?: string;
  hash?: string;
  size?: number;
  sizePretty?: string;
  host?: string;
  filterType?: FilterType | null;
  preview?: string;
}

interface Bookmark {
  id?: string;
  timestamp: number;
  log: DDPLog;
}

type FilterType =
  | 'heartbeat'
  | 'subscription'
  | 'collection'
  | 'method'
  | 'connection';

type FilterTypeMap<T> = { [key in FilterType]: T };

interface Pagination {
  readonly offset: number;
  readonly length: number;
  readonly lastIndex: number;
  readonly start: number;
  readonly end: number;
  readonly pages: number;
  readonly currentPage: number;
  readonly hasOnePage: boolean;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
  readonly pageItems: number;
  setSearch(search: string): void;
  setCurrentPage(page: number): void;
  next(): void;
  prev(): void;
}

interface Document extends Record<string, any> {
  _id: string;
}

type MinimongoCollections = Record<string, Document[]>;

type ViewableObject = object | null;

type MessageHandler = (message: Message<any>) => void;

interface DocumentWrapper {
  collectionName: string;
  color: string;
  document: Document;
}

interface GitHubRepository {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  private: boolean;
  owner: {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: boolean;
  };
  html_url: string;
  description: string;
  fork: boolean;
  url: string;
  forks_url: string;
  keys_url: string;
  collaborators_url: string;
  teams_url: string;
  hooks_url: string;
  issue_events_url: string;
  events_url: string;
  assignees_url: string;
  branches_url: string;
  tags_url: string;
  blobs_url: string;
  git_tags_url: string;
  git_refs_url: string;
  trees_url: string;
  statuses_url: string;
  languages_url: string;
  stargazers_url: string;
  contributors_url: string;
  subscribers_url: string;
  subscription_url: string;
  commits_url: string;
  git_commits_url: string;
  comments_url: string;
  issue_comment_url: string;
  contents_url: string;
  compare_url: string;
  merges_url: string;
  archive_url: string;
  downloads_url: string;
  issues_url: string;
  pulls_url: string;
  milestones_url: string;
  notifications_url: string;
  labels_url: string;
  releases_url: string;
  deployments_url: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  git_url: string;
  ssh_url: string;
  clone_url: string;
  svn_url: string;
  homepage: string;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string;
  has_issues: boolean;
  has_projects: boolean;
  has_downloads: boolean;
  has_wiki: boolean;
  has_pages: boolean;
  forks_count: number;
  mirror_url: string | null;
  archived: boolean;
  disabled: boolean;
  open_issues_count: number;
  license: {
    key: string;
    name: string;
    spdx_id: string;
    url: string;
    node_id: string;
  };
  forks: number;
  open_issues: number;
  watchers: number;
  default_branch: string;
  temp_clone_token: string | null;
  network_count: number;
  subscribers_count: number;
}

interface Settings {
  repositoryData: GitHubRepository | null;
  activeFilterBlacklist: string[];
  activeFilters: FilterTypeMap<boolean>;
}

type ConsoleType = 'log' | 'info' | 'warn' | 'error';

interface MeteorSubscription {
  id: string;
  name: string;
  params: any[];
  inactive: boolean;
  ready: boolean;
}
