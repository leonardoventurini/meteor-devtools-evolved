export {}

declare global {
  interface Window {
    GeoJSON: any
  }

  namespace NodeJS {
    interface Global {
      GeoJSON: any
    }
  }
}
