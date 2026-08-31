import debounce from 'lodash.debounce'
import { action, computed, makeObservable, observable } from 'mobx'
import { CollectionStore } from './CollectionStore'
import { JSONUtils } from '@/Utils/JSONUtils'
import { StringUtils } from '@/Utils/StringUtils'
import prettyBytes from 'pretty-bytes'
import { mapValues } from '@/Utils/Objects'

export class MinimongoStore {
  activeCollectionDocuments = new CollectionStore()

  collections: MinimongoCollections = {}
  collectionMetadata: ICollectionMetadata = {}
  activeCollection: string | null = null
  search: string = ''
  collectionColorMap: Record<string, string> = {}
  isNavigatorVisible = false

  constructor() {
    makeObservable(this, {
      collections: observable,
      collectionMetadata: observable,
      activeCollection: observable,
      search: observable,
      collectionColorMap: observable,
      isNavigatorVisible: observable,
      totalDocuments: computed,
      collectionNames: computed,
      filteredCollectionNames: computed,
      totalSize: computed,
      getMetadata: action,
      computeCollectionSizes: action,
      syncDocuments: action,
      setCollections: action,
      setActiveCollection: action,
      setNavigatorVisible: action,
    })
  }

  get totalDocuments() {
    return Object.values(this.collections).reduce(
      (acc, cur) => acc + cur.length,
      0,
    )
  }

  get collectionNames() {
    return Object.keys(this.collections).toSorted()
  }

  get filteredCollectionNames() {
    return this.collectionNames.filter(
      name =>
        !this.search || name.toLowerCase().includes(this.search.toLowerCase()),
    )
  }

  get totalSize() {
    return Object.entries(this.collectionMetadata).reduce(
      (sum, [collectionName, metadata]) => sum + metadata.collectionSize,
      0,
    )
  }

  getMetadata(collectionName: string) {
    return this.collectionMetadata?.[collectionName]
  }

  computeCollectionSizes() {
    for (const collectionName of Object.keys(this.collections)) {
      const collectionSize = this.collections[collectionName].reduce(
        (acc: number, cur: IDocumentWrapper) => acc + cur._size,
        0,
      )

      this.collectionMetadata[collectionName] = {
        collectionSize,
        collectionSizePretty: prettyBytes(collectionSize),
      }
    }
  }

  syncDocuments() {
    if (this.activeCollection) {
      return this.activeCollectionDocuments.setCollection(
        this.collections[this.activeCollection],
      )
    }

    this.activeCollectionDocuments.setCollection(
      Object.entries(this.collections).flatMap(
        ([collectionName, documents]) => {
          return documents
        },
      ),
    )
  }

  setCollections(collections: RawCollections) {
    this.collections = mapValues(collections, (collection, collectionName) => {
      return collection.map(document =>
        MinimongoStore.wrapDocument(document, collectionName),
      )
    })

    this.computeCollectionSizes()

    this.syncDocuments()
  }

  setActiveCollection(collection: string | null) {
    this.activeCollection = collection

    this.syncDocuments()
  }

  setSearch = debounce(
    action((search: string) => (this.search = search)),
    250,
  )

  setNavigatorVisible(isVisible: boolean) {
    this.isNavigatorVisible = isVisible
  }

  static wrapDocument(
    document: IDocument,
    collectionName: string,
  ): IDocumentWrapper {
    const _string = JSONUtils.stringify(document)

    console.log({ collectionName })

    return {
      collectionName,
      document,
      _string,
      _size: StringUtils.getSize(_string),
    }
  }
}
