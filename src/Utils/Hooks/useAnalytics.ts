import { singletonHook } from 'react-singleton-hook'
import { useEffect, useState } from 'react'
import { Analytics } from '@/Analytics'

export const useAnalytics = singletonHook(null, () => {
 const [instance, setInstance] = useState<Analytics>()

 useEffect(() => {
  const GA_TID = 'UA-211731487-1'

  setInstance(new Analytics(GA_TID, { userAgent: navigator.userAgent }))
 }, [])

 return instance
})
