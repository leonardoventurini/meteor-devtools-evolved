/**
 * A fresh injected document gets a fresh identity; saved connection IDs alone
 * can never authorize execution after navigation.
 */
export const playgroundPageEpoch = crypto.randomUUID()
