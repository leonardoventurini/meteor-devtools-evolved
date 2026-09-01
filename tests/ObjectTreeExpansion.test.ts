import { describe, expect, it } from 'vitest'
import {
  DEFAULT_TREE_DEPTH,
  normalizeTreeDepth,
  shouldCollapseTreeNode,
} from '../src/Utils/ObjectTreerinator/TreeExpansion'

describe('object tree expansion policy', () => {
  it('collapses nodes deeper than the persisted default depth', () => {
    expect(
      shouldCollapseTreeNode({
        defaultDepth: 2,
        level: 2,
        mode: 'default',
      }),
    ).toBe(false)
    expect(
      shouldCollapseTreeNode({
        defaultDepth: 2,
        level: 3,
        mode: 'default',
      }),
    ).toBe(true)
  })

  it('honors explicit expand-all and collapse-all modes', () => {
    expect(
      shouldCollapseTreeNode({
        defaultDepth: DEFAULT_TREE_DEPTH,
        level: 1,
        mode: 'expand-all',
      }),
    ).toBe(false)
    expect(
      shouldCollapseTreeNode({
        defaultDepth: DEFAULT_TREE_DEPTH,
        level: 1,
        mode: 'collapse-all',
      }),
    ).toBe(true)
  })

  it.each([
    [undefined, DEFAULT_TREE_DEPTH],
    ['not-a-number', DEFAULT_TREE_DEPTH],
    ['-1', 0],
    ['4', 4],
    ['99', 10],
  ])('normalizes stored depth %s to %i', (storedDepth, expected) => {
    expect(normalizeTreeDepth(storedDepth)).toBe(expected)
  })
})
