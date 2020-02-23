declare module '*.gif';

interface Window {
  __devtools: boolean;
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

interface Message<T> {
  eventType: string;
  data: T;
  source: string;
}

interface StackTrace {
  columnNumber: number;
  lineNumber: number;
  source: string;
  functionName?: string;
  fileName?: string;
}

interface DDPLog {
  id: string;
  content: string;
  trace?: StackTrace[];
  isInbound?: boolean;
  isOutbound?: boolean;
  timestamp?: number;
  timestampPretty?: string;
  hash?: string;
  size?: number;
  sizePretty?: string;
  host?: string;
}

interface StarredLog {
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

type FilterTypeMap<T> = { [day in FilterType]: T };

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

interface Store {}
