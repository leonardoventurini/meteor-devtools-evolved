export const calculatePagination = (
  offset: number,
  length: number,
  currentPage: number,
  setSearch: (search: string) => void,
  setCurrentPage: (page: number) => void,
): Pagination => {
  const lastIndex = length - 1
  const start = (currentPage - 1) * offset
  const end1 = start + offset
  const end2 = Math.min(end1, length)
  const pages = Math.ceil(length / offset)
  const hasOnePage = pages === 1
  const hasNextPage = currentPage < pages
  const hasPreviousPage = currentPage > 1

  return {
    offset,
    length,
    lastIndex,
    start: Math.max(start, 0),
    end: end2,
    pages,
    hasOnePage,
    hasNextPage,
    hasPreviousPage,
    currentPage,
    setCurrentPage,
    pageItems: Math.min(length, end2),
    setSearch(search: string) {
      setSearch(search)
    },
    next() {
      if (hasNextPage) {
        setCurrentPage(currentPage + 1)
      }
    },
    prev() {
      if (hasPreviousPage) {
        setCurrentPage(currentPage - 1)
      }
    },
  }
}
