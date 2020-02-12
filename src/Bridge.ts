export const injectScript = (scriptUrl: string) => {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', chrome.extension.getURL(scriptUrl), false);
  xhr.send();

  chrome.devtools.inspectedWindow.eval(xhr.responseText);
};

const chromeSetup = function() {
  const backgroundConnection = chrome.runtime.connect({
    name: 'panel',
  });

  backgroundConnection.postMessage({
    name: 'init',
    tabId: chrome.devtools.inspectedWindow.tabId,
  });
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
