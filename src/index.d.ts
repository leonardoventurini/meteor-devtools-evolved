declare module Meteor {
  const connection: any;
}

interface MeteorMessage {
  content: string;
  trace?: object;
  isInbound?: boolean;
  isOutbound?: boolean;
}