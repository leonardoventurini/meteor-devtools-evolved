import { extend } from 'lodash';
import { DDPInjector } from './DDPInjector';
import ErrorStackParser from 'error-stack-parser';
import { MinimongoInjector, updateCollections } from './MinimongoInjector';
import { warning } from '../Log';

export const sendMessage = (eventType: EventType, data: object) => {
  window.postMessage(
    {
      eventType,
      data,
      source: 'meteor-devtools-evolved',
    } as Message<object>,
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
    'ddp-event',
    extend(message, {
      trace: stackTrace,
      host: location.host,
    }),
  );

  updateCollections();
};

type MessageHandler = (message: Message<void>) => void;
type Registration = {
  acceptedSource: MessageSource;
  handler: MessageHandler;
};

interface IRegistry {
  subscriptions: Registration[];
  register(source: MessageSource, handler: MessageHandler): void;
}

export const Registry: IRegistry = {
  subscriptions: [],

  register(source: MessageSource, handler: MessageHandler) {
    this.subscriptions.push({
      acceptedSource: source,
      handler,
    });
  },
};

if (!window.__devtools) {
  document.addEventListener('DOMContentLoaded', () => {
    if (typeof Meteor === 'object') {
      window.__devtools = true;

      DDPInjector();
      MinimongoInjector();

      window.__meteor_devtools_receiveMessage = (message: Message<any>) => {
        Registry.subscriptions.forEach(
          ({ acceptedSource, handler }) =>
            acceptedSource === message.source && handler(message),
        );
      };

      warning('Injecting script...');
    }
  });
}
