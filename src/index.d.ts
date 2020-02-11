declare module Meteor {
  const connection: any;
}

interface MeteorMessage {
  content: string;
  isInbound?: boolean;
  isOutbound?: boolean;
}