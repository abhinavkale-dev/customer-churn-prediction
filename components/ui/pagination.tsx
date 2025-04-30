import { Button } from "@/components/ui/button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  // Generate an array of page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    // Always show first page
    if (currentPage > 3) {
      pages.push(1);
      // Add ellipsis if there are pages between first page and currentPage - 1
      if (currentPage > 4) {
        pages.push('...');
      }
    }

    // Show current page and adjacent pages
    for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages, currentPage + 1); i++) {
      pages.push(i);
    }

    // Always show last page
    if (currentPage < totalPages - 2) {
      // Add ellipsis if there are pages between currentPage + 1 and last page
      if (currentPage < totalPages - 3) {
        pages.push('...');
      }
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="flex items-center justify-center space-x-2 my-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Previous
      </Button>
      
      {pages.map((page, index) => (
        page === '...' ? (
          <span key={`ellipsis-${index}`} className="px-3 py-2">...</span>
        ) : (
          <Button
            key={`page-${page}`}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            onClick={() => typeof page === 'number' && onPageChange(page)}
            className="px-3 py-2"
          >
            {page}
          </Button>
        )
      ))}
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </Button>
    </div>
  );
} 