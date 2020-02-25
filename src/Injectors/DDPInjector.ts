import { sendLogMessage } from '../Injector';

type MessageCallback = (message: DDPLog) => void;

const generateId = () => (Date.now() + Math.random()).toString(36);

const injectOutboundInterceptor = (callback: MessageCallback) => {
  const send = Meteor.connection._stream.send;

  Meteor.connection._stream.send = function() {
    send.apply(this, arguments);

    callback({
      id: generateId(),
      content: arguments[0],
      isOutbound: true,
      timestamp: Date.now(),
    });
  };
};

const injectInboundInterceptor = (callback: MessageCallback) => {
  Meteor.connection._stream.on('message', function() {
    callback({
      id: generateId(),
      content: arguments[0],
      isInbound: true,
      timestamp: Date.now(),
    });
  });
};

export const DDPInjector = () => {
  injectOutboundInterceptor(sendLogMessage);
  injectInboundInterceptor(sendLogMessage);
};
