interface Connection {
  [key: string]: chrome.runtime.Port;
}

const connections: Connection = {};

const panelListener = () => {
  chrome.runtime.onConnect.addListener(function(port) {
    port.onMessage.addListener(function(request) {
      if (request.name === 'init') {
        if (request.tabId in connections) {
          delete connections[request.tabId];
        }

        connections[request.tabId] = port;

        port.onDisconnect.addListener(function() {
          delete connections[request.tabId];
        });
      }
    });
  });
};

const tabRemovalListener = () => {
  chrome.tabs.onRemoved.addListener(function(tabId) {
    if (connections[tabId]) {
      delete connections[tabId];
    }
  });
};

const contentListener = () => {
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (sender.tab && sender.tab.id) {
      const tabId = sender.tab.id;

      if (tabId in connections) {
        connections[tabId].postMessage(request);
      }
    }

    return true;
  });
};

panelListener();
tabRemovalListener();
contentListener();
