import { exists } from './Utils'
import { v4 as uuid } from 'uuid'
import { isString } from 'lodash'

const GA_HOST = 'https://www.google-analytics.com'

type UUID = string

type RequestObject = {
  method?: string
  body?: string
  headers?: Record<string, string>
}

type EventOptions = {
  clientId?: UUID
  label?: string
  value?: number
}

type EventParams = {
  ec?: string
  ea?: string
  el?: string
  ev?: number
}

type PageViewParams = {
  dp?: string
  dh?: string
  dt?: string
  sc?: number
}

type ScreenParams = {
  an?: string
  av?: string
  cd?: string
  aiid?: string
  aid?: string
}

type TransactionOptions = {
  affiliation?: string
  revenue?: number
  shipping?: number
  tax?: number
  currencyCode?: string
}

type TransactionParams = {
  ti?: string
  ta?: string
  tr?: number
  ts?: number
  tt?: number
  cu?: string
}

type TimingOptions = {
  label?: string
  dns?: number
  pageDownTime?: number
  redirectTime?: number
  tcpConnectionTime?: number
  serverResponseTime?: number
}

type TimingParams = {
  utc?: string
  utv?: string
  utt?: number
  dns?: number
  utl?: string
  pdt?: number
  rrt?: number
  tcp?: number
  srt?: number
}

type AnalyticsOptions = {
  userAgent?: string
  debug?: boolean
  version?: number
  clientId?: string
}

export class Analytics {
  clientId = uuid()
  customParams = {}
  globalDebug = false
  globalUserAgent = ''
  globalBaseURL = GA_HOST
  globalDebugURL = '/debug'
  globalCollectURL = '/collect'
  globalBatchURL = '/batch'
  globalTrackingID: string
  globalVersion = 1

  constructor(trackingId, options: AnalyticsOptions = {}) {
    const { clientId, userAgent, debug = false, version = 1 } = options

    if (clientId) this.clientId = clientId
    if (userAgent) this.globalUserAgent = userAgent

    this.globalDebug = debug
    this.globalTrackingID = trackingId
    this.globalVersion = version
    this.customParams = {}
  }

  set(key: string, value = null) {
    if (value !== null) {
      this.customParams[key] = value
    } else {
      delete this.customParams[key]
    }
  }

  pageView(
    hostname: string = location?.hostname,
    path: string = location?.pathname,
    title: string = document?.title,
    sessionDuration?: number,
  ) {
    const params: PageViewParams = {
      dh: hostname,
      dp: path,
      dt: title,
    }

    if (exists(sessionDuration)) {
      params.sc = sessionDuration
    }

    return this.send('pageview', params)
  }

  event(category?: string, action?: string, options: EventOptions = {}) {
    const { label, value } = options

    const params: EventParams = { ec: category, ea: action }

    if (label) params.el = label
    if (value) params.ev = value

    return this.send('event', params)
  }

  screen(
    appName: string,
    appVersion: string,
    appId: string,
    appInstallerId: string,
    screenName: string,
  ) {
    const params: ScreenParams = {
      an: appName,
      av: appVersion,
      aid: appId,
      aiid: appInstallerId,
      cd: screenName,
    }

    return this.send('screenview', params)
  }

  transaction(transactionId: UUID, options: TransactionOptions = {}) {
    const { affiliation, revenue, shipping, tax, currencyCode } = options
    const params: TransactionParams = { ti: transactionId }

    if (affiliation) params.ta = affiliation
    if (revenue) params.tr = revenue
    if (shipping) params.ts = shipping
    if (tax) params.tt = tax
    if (currencyCode) params.cu = currencyCode

    return this.send('transaction', params)
  }

  social(socialAction: string, socialNetwork: string, socialTarget: string) {
    const params = { sa: socialAction, sn: socialNetwork, st: socialTarget }

    return this.send('social', params)
  }

  exception(description: string, fatal: number, clientId: UUID) {
    const params = { exd: description, exf: fatal }

    return this.send('exception', params)
  }

  timingTrk(
    timingCategory: string,
    timingVariable: string,
    timingTime: number,
    options: TimingOptions,
  ) {
    const {
      label,
      dns,
      pageDownTime,
      redirectTime,
      tcpConnectionTime,
      serverResponseTime,
    } = options

    const params: TimingParams = {
      utc: timingCategory,
      utv: timingVariable,
      utt: timingTime,
    }

    if (label) params.utl = label
    if (dns) params.dns = dns
    if (pageDownTime) params.pdt = pageDownTime
    if (redirectTime) params.rrt = redirectTime
    if (tcpConnectionTime) params.tcp = tcpConnectionTime
    if (serverResponseTime) params.srt = serverResponseTime

    return this.send('timing', params)
  }

  send(hitType: string, params: Record<string, any>) {
    const payload = {
      v: this.globalVersion,
      tid: this.globalTrackingID,
      cid: this.clientId,
      t: hitType,
    }

    if (params) Object.assign(payload, params)

    if (Object.keys(this.customParams).length > 0) {
      Object.assign(payload, this.customParams)
    }

    let url = `${this.globalBaseURL}${this.globalCollectURL}`

    if (this.globalDebug) {
      url = `${this.globalBaseURL}${this.globalDebugURL}${this.globalCollectURL}`
    }

    const requestObject: RequestObject = {
      method: 'post',
      body: Object.keys(payload)
        .map(key => `${encodeURI(key)}=${encodeURI(payload[key])}`)
        .join('&'),
    }

    if (this.globalUserAgent && isString(this.globalUserAgent)) {
      requestObject.headers = { 'User-Agent': this.globalUserAgent }
    }

    return fetch(url, requestObject)
      .then(res => {
        let response = {}

        if (res.headers.get('content-type') !== 'image/gif') {
          response = res.json()
        } else {
          response = res.text()
        }

        if (res.status === 200) {
          return response
        }

        return Promise.reject(new Error(response as string))
      })
      .then((json: any) => {
        console.log(json)

        if (this.globalDebug) {
          if (json.hitParsingResult[0].valid) {
            return { clientId: payload.cid }
          }
        }

        return { clientId: payload.cid }
      })
      .catch(err => new Error(err))
  }
}
