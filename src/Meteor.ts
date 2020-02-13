type MessageCallback = (message: DDPLog) => void;

export const injectOutboundInterceptor = (callback: MessageCallback) => {
  const send = Meteor.connection._stream.send;

  Meteor.connection._stream.send = function() {
    send.apply(this, arguments);

    callback({
      content: arguments[0],
      isOutbound: true,
    });
  };
};

export const injectInboundInterceptor = (callback: MessageCallback) => {
  Meteor.connection._stream.on('message', function() {
    callback({
      content: arguments[0],
      isInbound: true,
    });
  });
};
