declare module Meteor {
  const connection: any;
}

declare module 'simple-sha1' {
  export default function(
    value: string,
    callback: (hash: string) => void,
  ): void;
}

interface RawMessage<T> {
  eventType: string;
  data: T;
  source: string;
}

interface MeteorMessage {
  content: string;
  trace?: object;
  isInbound?: boolean;
  isOutbound?: boolean;
  timestamp?: number;
  hash?: string;
}
