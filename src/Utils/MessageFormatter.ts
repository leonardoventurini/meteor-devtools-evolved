import { StringUtils } from '@/Utils/StringUtils'
import { isNumber, isString } from 'lodash'
import { PanelStore } from '@/Stores/PanelStore'

const MAX_CHARACTERS = 512

export const MessageFormatter = {
  heartbeat({ msg }: DDPLogContent) {
    return msg
  },

  collection({ msg, collection }: DDPLogContent) {
    const prepMap: { [key: string]: string } = {
      added: 'to',
      removed: 'from',
      changed: 'at',
    }

    if (msg && msg in prepMap) {
      return `${msg} ${prepMap[msg]} ${collection}`
    }
  },

  connection({ msg, session }: DDPLogContent) {
    return session ? session : msg
  },

  subscription({ name, subs }: any) {
    if (name) {
      return `${name} initialized`
    }

    if (!subs) {
      return null
    }

    const idsToNames = subs
      .map((id: string) => {
        const sub = PanelStore.getSubscriptionById(id)

        return sub?.name
      })
      .filter(Boolean)

    return `${idsToNames.join(', ')} ready`
  },

  method({ msg, method, result, error }: DDPLogContent) {
    if (msg === 'method') {
      return method
    }

    if (msg === 'result' && error) {
      return StringUtils.truncate(
        `${error.errorType}: ${error.message}`,
        MAX_CHARACTERS,
      )
    }

    if (msg === 'result') {
      return StringUtils.truncate(JSON.stringify(result), MAX_CHARACTERS)
    }

    return msg
  },
}

const idFormat = (message: string, id?: string | number | null) => {
  if (isNumber(id) || isString(id)) {
    return `[${id}] ${StringUtils.truncate(message, MAX_CHARACTERS)}`
  }

  return message
}

export const generatePreview = (
  content: string,
  parsedContent: DDPLogContent,
  filterType?: FilterType | null,
) => {
  if (parsedContent && filterType) {
    const message = (() => {
      if (filterType in MessageFormatter) {
        return MessageFormatter[filterType](parsedContent)
      }

      return null
    })()

    if (message) {
      return idFormat(message, parsedContent.id)
    }
  }

  return StringUtils.truncate(content, MAX_CHARACTERS)
}
