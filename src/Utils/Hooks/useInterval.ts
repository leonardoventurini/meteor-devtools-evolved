import { useEffect, useRef } from 'react'

export const useInterval = (callback: () => void, delay: number) => {
  const savedCallback = useRef<() => void>()

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    if (delay) {
      const id = setInterval(
        () => savedCallback.current && savedCallback.current(),
        delay,
      )
      return () => clearInterval(id)
    }
  }, [delay])
}
