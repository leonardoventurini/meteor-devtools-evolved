import { debounce, mapValues } from 'lodash'
import { action, computed, observable } from 'mobx'
import { CollectionStore } from './CollectionStore'
import { JSONUtils } from '@/Utils/JSONUtils'
import { StringUtils } from '@/Utils/StringUtils'
import prettyBytes from 'pretty-bytes'

export class MinimongoStore {
  activeCollectionDocuments = new CollectionStore()

  @observable collections: MinimongoCollections = {}
  @observable collectionMetadata: ICollectionMetadata = {}
  @observable activeCollection: string | null = null
  @observable search: string = ''
  @observable collectionColorMap: Record<string, string> = {}
  @observable isNavigatorVisible = false

  @computed
  get totalDocuments() {
    return Object.values(this.collections).reduce(
      (acc, cur) => acc + cur.length,
      0,
    )
  }

  @computed
  get collectionNames() {
    return Object.keys(this.collections).sort()
  }

  @computed
  get filteredCollectionNames() {
    return this.collectionNames.filter(
      name =>
        !this.search || name.toLowerCase().includes(this.search.toLowerCase()),
    )
  }

  @computed
  get totalSize() {
    return Object.entries(this.collectionMetadata).reduce(
      (sum, [collectionName, metadata]) => sum + metadata.collectionSize,
      0,
    )
  }

  @action
  getMetadata(collectionName: string) {
    return this.collectionMetadata?.[collectionName]
  }

  @action
  computeCollectionSizes() {
    Object.keys(this.collections).forEach(collectionName => {
      const collectionSize = this.collections[collectionName].reduce(
        (acc: number, cur: IDocumentWrapper) => acc + cur._size,
        0,
      )

      this.collectionMetadata[collectionName] = {
        collectionSize,
        collectionSizePretty: prettyBytes(collectionSize),
      }
    })
  }

  @action
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

  @action
  setCollections(collections: RawCollections) {
    this.collections = mapValues(collections, (collection, collectionName) => {
      return collection.map(document =>
        MinimongoStore.wrapDocument(document, collectionName),
      )
    })

    this.computeCollectionSizes()

    this.syncDocuments()
  }

  @action
  setActiveCollection(collection: string | null) {
    this.activeCollection = collection

    this.syncDocuments()
  }

  setSearch = debounce(
    action((search: string) => (this.search = search)),
    250,
  )

  @action
  setNavigatorVisible(isVisible: boolean) {
    this.isNavigatorVisible = isVisible
  }

  static wrapDocument(
    document: IDocument,
    collectionName: string,
  ): IDocumentWrapper {
    const _string = JSONUtils.stringify(document)

    return {
      collectionName,
      document,
      _string,
      _size: StringUtils.getSize(_string),
    }
  }
}
