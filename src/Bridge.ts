import { PanelStore } from './Stores/PanelStore';
import { memoize, padStart } from 'lodash';
import prettyBytes from 'pretty-bytes';
import moment from 'moment';
import { CRC32 } from './Utils/CRC32';
import { detectType } from './Pages/Panel/DDP/FilterConstants';
import { generatePreview } from './Utils/MessageFormatter';

const injectScript = (scriptUrl: string) => {
  fetch(chrome.extension.getURL(scriptUrl))
    .then(response => response.text())
    .then(text => chrome.devtools.inspectedWindow.eval(text));
};

const getSize = memoize((content: string) => new Blob([content]).size);

const getHash = memoize((content: string) =>
  padStart(new CRC32().update(content).digest(), 8, '0'),
);

const Handlers: { [key in EventType]: (message: Message<any>) => void } = {
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

  'minimongo-get-collections': (message: Message<any>) => {
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
      Handlers[message.eventType](message);
    }
  });
};

export const sendPageMessage = (message: object) => {
  if (chrome && chrome.devtools) {
    chrome.devtools.inspectedWindow.eval(
      `__meteor_devtools_receiveMessage(${JSON.stringify(message)})`,
    );
  }
};

export const setupBridge = () => {
  console.log('Setting up bridge...');

  const INJECT_SCRIPT_PATH = '/build/inject.js';

  if (!chrome || !chrome.devtools) return;

  chromeSetup();

  chrome.devtools.network.onNavigated.addListener(() => {
    injectScript(INJECT_SCRIPT_PATH);
  });
};
