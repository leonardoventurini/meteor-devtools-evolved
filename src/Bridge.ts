import { PanelStore } from './Stores/PanelStore';
import { extend, memoize } from 'lodash';
import prettyBytes from 'pretty-bytes';
import moment from 'moment';
import { CRC32 } from './Utils/CRC32';

const injectScript = (scriptUrl: string) => {
  fetch(chrome.extension.getURL(scriptUrl))
    .then(response => response.text())
    .then(text => chrome.devtools.inspectedWindow.eval(text));
};

const getSize = memoize((content: string) => new Blob([content]).size);

const chromeSetup = () => {
  const backgroundConnection = chrome.runtime.connect({
    name: 'panel',
  });

  backgroundConnection.postMessage({
    name: 'init',
    tabId: chrome.devtools.inspectedWindow.tabId,
  });

  backgroundConnection.onMessage.addListener((message: Message<DDPLog>) => {
    const startTime = performance.now();

    const size = getSize(message.data.content);

    const crc32 = new CRC32();

    crc32.update(message.data.content);

    const hash = crc32.digest();

    const data = extend(message.data, {
      timestampPretty: moment(message.data.timestamp).format('HH:mm:ss.SSS'),
      size,
      sizePretty: prettyBytes(size),
      hash,
    });

    PanelStore.pushLog(data);

    console.info(
      'Message Processing Time:',
      (performance.now() - startTime).toFixed(3),
      'ms',
      hash,
    );
  });
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
