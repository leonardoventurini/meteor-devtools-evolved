import { PanelStore } from './Stores/PanelStore';
import { extend } from 'lodash';
import sha1 from 'simple-sha1';

export const injectScript = (scriptUrl: string) => {
  fetch(chrome.extension.getURL(scriptUrl))
    .then(response => response.text())
    .then(text => chrome.devtools.inspectedWindow.eval(text));
};

const chromeSetup = () => {
  const backgroundConnection = chrome.runtime.connect({
    name: 'panel',
  });

  backgroundConnection.postMessage({
    name: 'init',
    tabId: chrome.devtools.inspectedWindow.tabId,
  });

  backgroundConnection.onMessage.addListener((message: Message<DDPLog>) => {
    console.log(message.data);

    sha1(message.data.content, hash => {
      const data = extend(message.data, {
        timestamp: Date.now(),
        hash,
      });

      PanelStore.pushLog(data);
    });
  });
};

export const setupBridge = () => {
  console.log('Setting up bridge...');

  const INJECT_SCRIPT_PATH = '/build/inject.js';

  if (!chrome || !chrome.devtools) {
    return;
  }

  chromeSetup();

  chrome.devtools.network.onNavigated.addListener(function() {
    injectScript(INJECT_SCRIPT_PATH);
  });
};
