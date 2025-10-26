import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  isLoading?: boolean;
  showPageSizeSelector?: boolean;
  showJumpToPage?: boolean;
  showResultsInfo?: boolean;
  pageSizeOptions?: number[];
  position?: 'top' | 'bottom' | 'standalone';
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  isLoading = false,
  showPageSizeSelector = false,
  showJumpToPage = false,
  showResultsInfo = false,
  pageSizeOptions = [10, 20, 50, 100],
  position = 'standalone',
}) => {
  const [jumpToPageInput, setJumpToPageInput] = useState<string>('');

  const safePageSize = pageSize ?? 20;
  const safeTotalItems = totalItems ?? 0;
  const safeCurrentPage = Number(currentPage) || 1;

  if (
    totalPages <= 1 &&
    !showResultsInfo &&
    !showPageSizeSelector &&
    position === 'standalone'
  ) {
    return null;
  }

  const getVisiblePages = () => {
    const delta = 1;
    const range: Array<number | string> = [];
    const rangeWithDots: Array<number | string> = [];

    rangeWithDots.push(1);

    if (currentPage - delta > 2) {
      rangeWithDots.push('...');
    }

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      if (i !== 1 && i !== totalPages) {
        range.push(i);
      }
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...');
    }

    if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots.filter(
      (page, index, arr) => arr.indexOf(page) === index,
    );
  };

  const handleJumpToPage = () => {
    const pageNum = parseInt(jumpToPageInput, 10);
    if (pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum);
      setJumpToPageInput('');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleJumpToPage();
    }
  };

  const visiblePages = getVisiblePages();
  const startItem = (safeCurrentPage - 1) * safePageSize + 1;
  const endItem = Math.min(
    safeCurrentPage * safePageSize,
    safeTotalItems || safeCurrentPage * safePageSize,
  );

  if (position === 'top') {
    return (
      <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between py-4 border-b">
        {showResultsInfo && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>
              Showing {startItem}-{endItem}
              {totalItems ? ` of ${totalItems}` : ''} results
            </span>
          </div>
        )}
        <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-4">
          {showPageSizeSelector && onPageSizeChange && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Show</span>
              <Select
                value={safePageSize.toString()}
                onValueChange={(value) => onPageSizeChange(parseInt(value, 10))}
                disabled={isLoading}
              >
                <SelectTrigger className="w-16 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground whitespace-nowrap">per page</span>
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1 || isLoading}
                className="h-8 px-3"
                title="Previous page"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Prev
              </Button>

              <span className="text-sm text-muted-foreground px-3">
                Page {currentPage} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages || isLoading}
                className="h-8 px-3"
                title="Next page"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-col space-y-4 pb-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
      {showResultsInfo && position === 'standalone' && (
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>
            Showing {startItem}-{endItem}
            {totalItems ? ` of ${totalItems}` : ''} results
          </span>
        </div>
      )}
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-4">
        {showPageSizeSelector && onPageSizeChange && position === 'standalone' && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Show</span>
            <Select
              value={safePageSize.toString()}
              onValueChange={(value) => onPageSizeChange(parseInt(value, 10))}
              disabled={isLoading}
            >
              <SelectTrigger className="w-16 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground whitespace-nowrap">per page</span>
          </div>
        )}
        {showJumpToPage && totalPages > 5 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Go to</span>
            <Input
              type="number"
              min={1}
              max={totalPages}
              value={jumpToPageInput}
              onChange={(event) => setJumpToPageInput(event.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isLoading}
              className="w-16 h-8"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleJumpToPage}
              disabled={isLoading}
            >
              Go
            </Button>
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(1)}
              disabled={currentPage <= 1 || isLoading}
              className="h-8 w-8 p-0"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1 || isLoading}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {visiblePages.map((page, index) => (
              <React.Fragment key={`${page}-${index}`}>
                {page === '...' ? (
                  <div className="flex h-8 w-8 items-center justify-center">
                    <MoreHorizontal className="h-4 w-4" />
                  </div>
                ) : (
                  <Button
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onPageChange(page as number)}
                    disabled={isLoading}
                    className="h-8 w-8 p-0"
                  >
                    {page}
                  </Button>
                )}
              </React.Fragment>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || isLoading}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage >= totalPages || isLoading}
              className="h-8 w-8 p-0"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
