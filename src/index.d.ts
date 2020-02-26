declare module '*.gif';

interface Window {
  __devtools: boolean;
  __meteor_devtools_receiveMessage(message: Message<any>): void;
}

declare module Meteor {
  let __devtools: boolean;
  const connection: any;
}

declare module 'simple-sha1' {
  export default function(
    value: string,
    callback: (hash: string) => void,
  ): void;
}

type MessageSource = 'meteor-devtools-evolved' | 'minimongo-explorer';
type EventType = 'ddp-event' | 'minimongo-get-collections';

interface Message<T> {
  eventType: EventType;
  data: T;
  source: MessageSource;
}

interface StackTrace {
  columnNumber: number;
  lineNumber: number;
  source: string;
  functionName?: string;
  fileName?: string;
}

interface DDPLogContent {
  msg?: string;
  collection?: string;
  session?: string;
  id?: string;
  method?: string;
  result?: string;
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
  setCurrentPage(page: number): void;
  next(): void;
  prev(): void;
}
