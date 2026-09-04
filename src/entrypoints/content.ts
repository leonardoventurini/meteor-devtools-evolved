import { browser } from 'wxt/browser'
import { defineContentScript } from 'wxt/utils/define-content-script'
import { injectScript } from 'wxt/utils/inject-script'
import { trySendRuntimeMessage } from '@/Browser/RuntimeMessage'

const WEB_PAGE_MATCHES = ['http://*/*', 'https://*/*']
const MESSAGE_SOURCE = 'meteor-devtools-evolved'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

export default defineContentScript({
  matches: WEB_PAGE_MATCHES,
  runAt: 'document_start',
  allFrames: true,
  async main(context) {
    const messageHandler = (event: MessageEvent<unknown>) => {
      if (event.source !== globalThis.window) return
      if (!isRecord(event.data) || event.data.source !== MESSAGE_SOURCE) return

      void trySendRuntimeMessage(
        message => browser.runtime.sendMessage(message),
        event.data,
      ).then(wasSent => {
        if (!wasSent) {
          globalThis.removeEventListener('message', messageHandler)
        }
      })
    }

    context.addEventListener(globalThis.window, 'message', messageHandler)
    await injectScript('/inject.js', { keepInDom: true })
  },
})
