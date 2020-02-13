import { PanelStore } from './Stores/PanelStore';

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

  backgroundConnection.onMessage.addListener(
    (message: RawMessage<MeteorMessage>) => {
      PanelStore.ddp.push(message.data);
    },
  );
};

export const setupBridge = () => {
  console.log('Setting up bridge...');

  const INJECT_SCRIPT_PATH = '/build/inject.js';

  if (!chrome || !chrome.devtools) {
    return;
  }

  chromeSetup();

  injectScript(INJECT_SCRIPT_PATH);

  chrome.devtools.network.onNavigated.addListener(function() {
    injectScript(INJECT_SCRIPT_PATH);
  });
};
