import { describe, expect, it, vi } from 'vitest'

import { calculatePagination } from '../../src/Utils/Pagination'

describe('calculatePagination', () => {
  it('calculates a bounded middle page', () => {
    const setSearch = vi.fn()
    const setCurrentPage = vi.fn()
    const pagination = calculatePagination(10, 25, 2, setSearch, setCurrentPage)

    expect(pagination).toMatchObject({
      start: 10,
      end: 20,
      pages: 3,
      hasNextPage: true,
      hasPreviousPage: true,
      pageItems: 20,
    })

    pagination.next()
    pagination.prev()
    pagination.setSearch('methods')

    expect(setCurrentPage).toHaveBeenNthCalledWith(1, 3)
    expect(setCurrentPage).toHaveBeenNthCalledWith(2, 1)
    expect(setSearch).toHaveBeenCalledWith('methods')
  })

  it('does not navigate beyond the first or last page', () => {
    const firstPageSetter = vi.fn()
    const lastPageSetter = vi.fn()

    calculatePagination(10, 25, 1, vi.fn(), firstPageSetter).prev()
    calculatePagination(10, 25, 3, vi.fn(), lastPageSetter).next()

    expect(firstPageSetter).not.toHaveBeenCalled()
    expect(lastPageSetter).not.toHaveBeenCalled()
  })
})
