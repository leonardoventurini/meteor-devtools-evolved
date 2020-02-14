window.addEventListener('message', function(event) {
  // Only accept messages from same frame
  if (event.source !== window) return;

  const message = event.data;

  // Only accept messages that we know are ours
  if (message.source !== 'meteor-devtools-evolved') return;

  chrome.runtime.sendMessage(message);
});
