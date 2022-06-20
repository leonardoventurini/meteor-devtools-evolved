import { warning } from '@/Log'
import { Registry, sendMessage } from '@/Browser/Inject'
import cloneDeep from 'lodash/cloneDeep'
import throttle from 'lodash/throttle'

const cleanup = (object: any) => {
 const clonedObject = cloneDeep(object)

 Object.keys(clonedObject).forEach((key: string) => {
  if (clonedObject[key] instanceof Date) {
   clonedObject[key] = clonedObject[key].toString()
  }
 })

 return clonedObject
}

const getCollections = () => {
 const collections = Meteor.connection._mongo_livedata_collections

 if (!collections) {
  warning(
   'Collections not initialized in the client yet. Possibly forgotten to be imported.',
  )
  return
 }

 const data = Object.values(collections).reduce(
  (acc: object, collection: any) =>
   Object.assign(acc, {
    [collection.name]: Array.from(collection._docs._map?.values?.() ?? []).map(
     cleanup,
    ),
   }),
  {},
 )

 sendMessage('minimongo-get-collections', data as any)
}

export const updateCollections = throttle(getCollections, 100, {
 leading: true,
 trailing: true,
})

export const MinimongoInjector = () => {
 Registry.register('minimongo-get-collections', () => {
  getCollections()
 })
}
