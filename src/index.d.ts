declare module Meteor {
  const connection: any;
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
}