export const calculatePagination = (
  viewableCount: number,
  collectionLength: number,
  currentPage: number,
  setCurrentPage: (page: number) => void,
): Pagination => {
  const lastIndex = collectionLength - 1;
  const start = lastIndex - currentPage * viewableCount;
  const end = start + viewableCount + 1;
  const pages = Math.ceil(collectionLength / viewableCount);
  const hasOnePage = pages === 1;
  const hasNextPage = currentPage < pages;
  const hasPreviousPage = currentPage > 1;

  return {
    lastIndex,
    start: start >= 0 ? start : 0,
    end: end <= collectionLength ? end : collectionLength,
    pages,
    hasOnePage,
    hasNextPage,
    hasPreviousPage,
    currentPage,
    setCurrentPage,
    next() {
      if (hasNextPage) {
        setCurrentPage(currentPage + 1);
      }
    },
    prev() {
      if (hasPreviousPage) {
        setCurrentPage(currentPage - 1);
      }
    },
  };
};
