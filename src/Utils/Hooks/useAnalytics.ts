import { useState } from 'react'
import { Analytics } from '@/Analytics'

const ANALYTICS_TRACKING_ID = 'UA-211731487-1'
let sharedAnalytics: Analytics | undefined

export const useAnalytics = () => {
  const [instance] = useState(() => {
    sharedAnalytics ??= new Analytics(ANALYTICS_TRACKING_ID, {
      userAgent: navigator.userAgent,
    })

    return sharedAnalytics
  })

  return instance
}
