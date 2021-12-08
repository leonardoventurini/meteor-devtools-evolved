interface Connection {
  [key: string]: chrome.runtime.Port
}

const connections: Connection = {}

const panelListener = () => {
  chrome.runtime.onConnect.addListener(port => {
    port.onMessage.addListener(request => {
      if (request.name === 'init') {
        connections[request.tabId] = port

        port.onDisconnect.addListener(() => {
          delete connections[request.tabId]
        })
      }
    })
  })
}

const tabRemovalListener = () => {
  chrome.tabs.onRemoved.addListener(tabId => {
    if (connections[tabId]) {
      delete connections[tabId]
    }
  })
}

chrome.action.onClicked.addListener(() => {
  chrome.tabs
    .create({
      url: 'http://cloud.meteor.com/?utm_source=chrome_extension&utm_medium=extension&utm_campaign=meteor_devtools_evolved',
    })
    .catch(console.error)
})

const handleConsole = ({
  data: { type, message },
}: Message<{ type: ConsoleType; message: string }>) => {
  if (type in console) {
    console[type](message)
  } else {
    console.warn('Wrong console type.')
  }
}

const contentListener = () => {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request?.eventType === 'console') {
      handleConsole(request)
      return false
    }

    const tabId = sender?.tab?.id

    if (tabId && tabId in connections) {
      connections[tabId].postMessage(request)
    }

    return true
  })
}

panelListener()
tabRemovalListener()
contentListener()
