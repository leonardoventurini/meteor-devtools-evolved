import { extend } from 'lodash';
import { injectInboundInterceptor, injectOutboundInterceptor } from './Meteor';
import ErrorStackParser from 'error-stack-parser';
import { EventTypes } from './EventTypes';

export const MESSAGE_SOURCE = 'meteor-devtools-evolved';

export const sendMessage = (eventType: string, data: object) => {
  window.postMessage(
    {
      eventType,
      data,
      source: MESSAGE_SOURCE,
    },
    '*',
  );
};

export const getStackTrace = (stackTraceLimit: number) => {
  const originalStackTraceLimit = Error.stackTraceLimit;

  try {
    Error.stackTraceLimit = stackTraceLimit ?? 15;
    return ErrorStackParser.parse(new Error());
  } finally {
    Error.stackTraceLimit = originalStackTraceLimit;
  }
};

export const sendLogMessage = (message: DDPLog) => {
  const stackTrace = getStackTrace(15);

  if (stackTrace && stackTrace.length) {
    stackTrace.splice(0, 2);
  }

  sendMessage(
    EventTypes.DDP,
    extend(message, {
      trace: stackTrace,
    }),
  );
};

console.log('Meteor DevTools Evolved: Injecting script...');

injectInboundInterceptor(sendLogMessage);

injectOutboundInterceptor(sendLogMessage);
