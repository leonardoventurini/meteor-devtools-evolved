import { PanelStore } from './Stores/PanelStore';
import { extend, memoize } from 'lodash';
import sha1 from 'simple-sha1';
import prettyBytes from 'pretty-bytes';
import moment from 'moment';

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
    const size = getSize(message.data.content);
    const timestamp = Date.now();

    sha1(message.data.content, hash => {
      const data = extend(message.data, {
        timestamp,
        timestampPretty: moment(timestamp).format('HH:mm:ss.SSS'),
        size,
        sizePretty: prettyBytes(size),
        hash,
      });

      PanelStore.pushLog(data);
    });
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
