const messageHandler = (event: MessageEvent) => {
  // Only accept messages from same frame
  if (event.source !== window) return;

  // Only accept messages that we know are ours
  if (event.data.source !== 'meteor-devtools-evolved') return;

  console.debug(event);

  chrome.runtime.sendMessage(event.data);
};

window.addEventListener('message', messageHandler);
