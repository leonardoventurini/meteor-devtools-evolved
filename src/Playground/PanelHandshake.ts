const DISCOVERY_INTERVAL_MS = 1000
const DISCOVERY_ATTEMPTS = 20

/**
 * Background port registration and native Meteor discovery are asynchronous.
 * Repeat passive hello messages across those startup races, never run commands.
 */
export const startPlaygroundHandshake = (
  hello: () => void,
  ready: () => boolean,
): (() => void) => {
  let attempts = 1
  hello()
  const timer = setInterval(() => {
    if (ready() || attempts >= DISCOVERY_ATTEMPTS) {
      clearInterval(timer)
      return
    }
    attempts += 1
    hello()
  }, DISCOVERY_INTERVAL_MS)
  return () => clearInterval(timer)
}
