import { truncate } from './String';

export const MessageFormatter = {
  heartbeat({ msg }: DDPLogContent) {
    return msg;
  },

  collection({ msg, collection }: DDPLogContent) {
    const prepMap: { [key: string]: string } = {
      added: 'to',
      removed: 'from',
      changed: 'at',
    };

    if (msg && msg in prepMap) {
      return `${msg} ${prepMap[msg]} ${collection}`;
    }
  },

  connection({ msg, session }: DDPLogContent) {
    return session ? session : msg;
  },

  subscription({ msg }: DDPLogContent) {
    return msg;
  },

  method({ msg, method, result }: DDPLogContent) {
    if (msg === 'method') {
      return method;
    }

    if (msg === 'result') {
      return truncate(JSON.stringify(result));
    }

    return msg;
  },
};
