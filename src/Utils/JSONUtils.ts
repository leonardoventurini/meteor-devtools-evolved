export namespace JSONUtils {
 export const getCircularReplacer = () => {
  const seen = new WeakSet()
  return (key: string, value: any) => {
   if (typeof value === 'object' && value !== null) {
    if (seen.has(value)) return
    seen.add(value)
   }
   return value
  }
 }

 export const stringify = (value: any) =>
  JSON.stringify(value, getCircularReplacer())
}
