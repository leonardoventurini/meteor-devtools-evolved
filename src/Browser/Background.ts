interface Connection {
  [key: string]: chrome.runtime.Port;
}

const connections: Connection = {};

const panelListener = () => {
  chrome.runtime.onConnect.addListener(port => {
    port.onMessage.addListener(request => {
      if (request.name === 'init') {
        connections[request.tabId] = port;

        port.onDisconnect.addListener(() => {
          delete connections[request.tabId];
        });
      }
    });
  });
};

const tabRemovalListener = () => {
  chrome.tabs.onRemoved.addListener(tabId => {
    if (connections[tabId]) {
      delete connections[tabId];
    }
  });
};

const contentListener = () => {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const tabId = sender?.tab?.id;

    if (tabId && tabId in connections) {
      connections[tabId].postMessage(request);
    }

    console.log(connections);

    return true;
  });
};

panelListener();
tabRemovalListener();
contentListener();
