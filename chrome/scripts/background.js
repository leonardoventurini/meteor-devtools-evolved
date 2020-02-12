const connections = {};

chrome.runtime.onConnect.addListener(function(port) {
  // Listen to messages sent from the DevTools page
  port.onMessage.addListener(function(request) {
    console.log(arguments);

    // Register initial connection
    if (request.name === 'init') {
      connections[request.tabId] = port;

      port.onDisconnect.addListener(function() {
        delete connections[request.tabId];
      });
    }
  });
});

chrome.tabs.onRemoved.addListener(function(tabId) {
  if (connections[tabId]) {
    delete connections[tabId];
  }
});

// Receive message from content script and relay to the devTools page for the
// current tab
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log(arguments);

  // Messages from content scripts should have sender.tab set
  if (sender.tab) {
    const tabId = sender.tab.id;

    if (tabId in connections) {
      connections[tabId].postMessage(request);
    }
  }
  return true;
});
