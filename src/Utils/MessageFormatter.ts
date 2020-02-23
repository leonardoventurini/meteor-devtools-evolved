import { truncate } from './String';
import { isNumber, isString } from 'lodash';

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

const idFormat = (message: string, id?: string | number | null) => {
  if (isNumber(id) || isString(id)) {
    return `[${id}] ${truncate(message)}`;
  }

  return message;
};

export const generatePreview = (
  content: string,
  parsedContent: DDPLogContent,
  filterType?: FilterType | null,
) => {
  if (parsedContent && filterType) {
    const message = (() => {
      if (filterType in MessageFormatter) {
        return MessageFormatter[filterType](parsedContent);
      }

      return null;
    })();

    if (message) {
      return idFormat(message, parsedContent.id);
    }
  }

  return truncate(content);
};
