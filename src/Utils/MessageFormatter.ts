import { StringUtils } from '@/Utils/StringUtils';
import { isNumber, isString } from 'lodash';

const MAX_CHARACTERS = 512;

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
      return StringUtils.truncate(JSON.stringify(result), MAX_CHARACTERS);
    }

    return msg;
  },
};

const idFormat = (message: string, id?: string | number | null) => {
  if (isNumber(id) || isString(id)) {
    return `[${id}] ${StringUtils.truncate(message, MAX_CHARACTERS)}`;
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

  return StringUtils.truncate(content, MAX_CHARACTERS);
};
