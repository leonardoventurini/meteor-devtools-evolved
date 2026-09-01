import debounce from 'lodash.debounce'
import { action, computed, makeObservable, observable } from 'mobx'
import { CollectionStore } from './CollectionStore'
import { JSONUtils } from '@/Utils/JSONUtils'
import { StringUtils } from '@/Utils/StringUtils'
import prettyBytes from 'pretty-bytes'
import { mapValues } from '@/Utils/Objects'
import {
  executeMinimongoQueryEntries,
  parseMinimongoQuery,
  type MinimongoQuery,
  type MinimongoQueryInput,
} from '@/Utils/MinimongoQuery'

export const DEFAULT_MINIMONGO_QUERY_INPUT: MinimongoQueryInput = {
  limit: '100',
  projection: '{}',
  selector: '{}',
  sort: '{}',
}

export class MinimongoStore {
  activeCollectionDocuments = new CollectionStore()

  collections: MinimongoCollections = {}
  collectionMetadata: ICollectionMetadata = {}
  activeCollection: string | null = null
  search: string = ''
  collectionColorMap: Record<string, string> = {}
  isNavigatorVisible = false
  isQueryVisible = false
  query: MinimongoQuery | null = null
  queryError: string | null = null
  queryInput: MinimongoQueryInput = DEFAULT_MINIMONGO_QUERY_INPUT

  constructor() {
    makeObservable(this, {
      collections: observable,
      collectionMetadata: observable,
      activeCollection: observable,
      search: observable,
      collectionColorMap: observable,
      isNavigatorVisible: observable,
      isQueryVisible: observable,
      query: observable,
      queryError: observable,
      queryInput: observable,
      totalDocuments: computed,
      collectionNames: computed,
      filteredCollectionNames: computed,
      totalSize: computed,
      queriedDocuments: computed,
      getMetadata: action,
      computeCollectionSizes: action,
      syncDocuments: action,
      setCollections: action,
      setActiveCollection: action,
      setNavigatorVisible: action,
      setQueryVisible: action,
      applyQuery: action,
      clearQuery: action,
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

  get queriedDocuments(): IDocumentWrapper[] {
    const documents = this.activeCollectionDocuments.filtered

    if (!this.query) return documents

    return executeMinimongoQueryEntries(documents, this.query).map(entry =>
      MinimongoStore.wrapDocument(entry.document, entry.collectionName),
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
        actualName:
          this.collectionMetadata[collectionName]?.actualName ?? collectionName,
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

  setCollections(
    collections: RawCollections,
    metadata: Record<string, RawCollectionMetadata> = {},
  ) {
    this.collectionMetadata = mapValues(metadata, collection => ({
      ...collection,
      collectionSize: 0,
      collectionSizePretty: prettyBytes(0),
    }))
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

  setQueryVisible(isVisible: boolean) {
    this.isQueryVisible = isVisible
  }

  applyQuery(input: MinimongoQueryInput) {
    try {
      this.query = parseMinimongoQuery(input)
      this.queryInput = input
      this.queryError = null
    } catch (error) {
      this.queryError =
        error instanceof Error ? error.message : 'Unable to parse query.'
    }
  }

  clearQuery() {
    this.query = null
    this.queryError = null
    this.queryInput = DEFAULT_MINIMONGO_QUERY_INPUT
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
