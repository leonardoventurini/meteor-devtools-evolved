/**
 * A fresh injected document gets a fresh identity; saved connection IDs alone
 * can never authorize execution after navigation. getRandomValues also works
 * on ordinary HTTP pages, where crypto.randomUUID is unavailable.
 */
export const createPageEpoch = (
  random: (bytes: Uint8Array) => Uint8Array = bytes =>
    crypto.getRandomValues(bytes),
): string =>
  Array.from(random(new Uint8Array(16)), byte =>
    byte.toString(16).padStart(2, '0'),
  ).join('')

export const playgroundPageEpoch = createPageEpoch()
