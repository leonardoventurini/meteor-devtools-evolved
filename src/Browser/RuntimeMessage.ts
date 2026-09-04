export type RuntimeMessageSender = (message: unknown) => Promise<unknown>

/**
 * Sends a message without allowing an invalidated extension context to throw
 * into the host page. Chrome may fail synchronously before returning a Promise
 * or reject asynchronously when the runtime receiver is unavailable.
 */
export const trySendRuntimeMessage = async (
  send: RuntimeMessageSender,
  message: unknown,
): Promise<boolean> => {
  try {
    await send(message)
    return true
  } catch {
    return false
  }
}
