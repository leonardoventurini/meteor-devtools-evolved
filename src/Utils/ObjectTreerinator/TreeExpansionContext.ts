import { createContext, useContext } from 'react'
import { DEFAULT_TREE_DEPTH, type TreeExpansionMode } from './TreeExpansion'

interface TreeExpansionContextValue {
  defaultDepth: number
  mode: TreeExpansionMode
}

export const TreeExpansionContext = createContext<TreeExpansionContextValue>({
  defaultDepth: DEFAULT_TREE_DEPTH,
  mode: 'default',
})

export const useTreeExpansion = (): TreeExpansionContextValue =>
  useContext(TreeExpansionContext)
