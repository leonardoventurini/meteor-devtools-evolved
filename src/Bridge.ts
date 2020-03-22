import { memoize, padStart } from 'lodash';
import moment from 'moment';
import prettyBytes from 'pretty-bytes';
import { detectType } from './Pages/Panel/DDP/FilterConstants';
import { PanelStore } from './Stores/PanelStore';
import { CRC32 } from './Utils/CRC32';
import { generatePreview } from './Utils/MessageFormatter';

const getSize = memoize((content: string) => new Blob([content]).size);

const getHash = memoize((content: string) =>
  padStart(new CRC32().update(content).digest(), 8, '0'),
);

const Handlers: Partial<Record<EventType, MessageHandler>> = {
  'ddp-event': (message: Message<DDPLog>) => {
    const size = getSize(message.data.content);
    const hash = getHash(message.data.content);
    const parsedContent = JSON.parse(message.data.content);
    const filterType = detectType(parsedContent);
    const preview = generatePreview(
      message.data.content,
      parsedContent,
      filterType,
    );

    const log = {
      ...message.data,
      parsedContent,
      timestampPretty: moment(message.data.timestamp).format('HH:mm:ss.SSS'),
      size,
      sizePretty: prettyBytes(size),
      hash,
      filterType,
      preview,
    };

    PanelStore.ddpStore.pushItem(log);
  },

  'minimongo-get-collections': (message: Message<MinimongoCollections>) => {
    PanelStore.minimongoStore.setCollections(message.data);
  },
};

const chromeSetup = () => {
  const backgroundConnection = chrome.runtime.connect({
    name: 'panel',
  });

  backgroundConnection.postMessage({
    name: 'init',
    tabId: chrome.devtools.inspectedWindow.tabId,
  });

  backgroundConnection.onMessage.addListener((message: Message<any>) => {
    if (message.eventType in Handlers) {
      const handler = Handlers[message.eventType];

      if (handler) handler(message);
    }
  });
};

export const sendContentMessage = (message: Message<any>) => {
  if (chrome && chrome.devtools) {
    chrome.devtools.inspectedWindow.eval(
      `__devtools_receiveMessage(${JSON.stringify(message)})`,
    );
  }
};

export const setupBridge = () => {
  console.log('Setting up bridge...');

  if (!chrome || !chrome.devtools) return;

  chromeSetup();
};
