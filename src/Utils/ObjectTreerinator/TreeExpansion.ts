export const DEFAULT_TREE_DEPTH = 2
export const MINIMUM_TREE_DEPTH = 0
export const MAXIMUM_TREE_DEPTH = 10
export const TREE_DEPTH_STORAGE_KEY = 'meteor-devtools:json-tree-depth'

export type TreeExpansionMode = 'default' | 'expand-all' | 'collapse-all'

interface TreeExpansionPolicy {
  defaultDepth: number
  level: number
  mode: TreeExpansionMode
}

export const normalizeTreeDepth = (storedDepth?: string | null): number => {
  const depth = Number(storedDepth)

  if (!Number.isInteger(depth)) return DEFAULT_TREE_DEPTH

  return Math.min(MAXIMUM_TREE_DEPTH, Math.max(MINIMUM_TREE_DEPTH, depth))
}

export const shouldCollapseTreeNode = ({
  defaultDepth,
  level,
  mode,
}: TreeExpansionPolicy): boolean => {
  if (mode === 'expand-all') return false
  if (mode === 'collapse-all') return true

  return level > defaultDepth
}
