export const calculatePagination = (
  offset: number,
  length: number,
  currentPage: number,
  setCurrentPage: (page: number) => void,
): Pagination => {
  const lastIndex = length - 1;
  const start = (currentPage - 1) * offset;
  const end1 = start + offset;
  const end2 = end1 <= length ? end1 : length;
  const pages = Math.ceil(length / offset);
  const hasOnePage = pages === 1;
  const hasNextPage = currentPage < pages;
  const hasPreviousPage = currentPage > 1;

  return {
    offset,
    length,
    lastIndex,
    start: start >= 0 ? start : 0,
    end: end2,
    pages,
    hasOnePage,
    hasNextPage,
    hasPreviousPage,
    currentPage,
    setCurrentPage,
    pageItems: length > end2 ? end2 : length,
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
