import React from 'react';

interface PaginationProps {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

/**
 * Pagination component for navigating through paginated data
 * 
 * @param totalItems - Total number of items to paginate
 * @param itemsPerPage - Number of items to display per page
 * @param currentPage - Current active page
 * @param onPageChange - Callback function when page is changed
 */
const Pagination: React.FC<PaginationProps> = ({ 
  totalItems, 
  itemsPerPage, 
  currentPage, 
  onPageChange 
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Don't render pagination if there's only one page or less
  if (totalPages <= 1) return null;

  const pageNumbers = [];
  const maxPagesToShow = 5;

  // Calculate which page numbers to show
  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

  // Adjust start page if we're near the end
  if (endPage - startPage + 1 < maxPagesToShow) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  // Generate page numbers to display
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="pagination mt-3 d-flex justify-content-center">
      <button 
        onClick={() => onPageChange(currentPage - 1)} 
        disabled={currentPage === 1}
        className="btn-secondary mr-2"
        aria-label="Previous page"
      >
        Previous
      </button>

      {startPage > 1 && (
        <>
          <button 
            onClick={() => onPageChange(1)} 
            className="btn-secondary mr-1"
            aria-label="Go to first page"
          >
            1
          </button>
          {startPage > 2 && <span className="mx-1">...</span>}
        </>
      )}

      {pageNumbers.map(number => (
        <button
          key={number}
          onClick={() => onPageChange(number)}
          className={`btn-${currentPage === number ? 'primary' : 'secondary'} mx-1`}
          aria-label={`Page ${number}`}
          aria-current={currentPage === number ? 'page' : undefined}
        >
          {number}
        </button>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="mx-1">...</span>}
          <button 
            onClick={() => onPageChange(totalPages)} 
            className="btn-secondary ml-1"
            aria-label="Go to last page"
          >
            {totalPages}
          </button>
        </>
      )}

      <button 
        onClick={() => onPageChange(currentPage + 1)} 
        disabled={currentPage === totalPages}
        className="btn-secondary ml-2"
        aria-label="Next page"
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;