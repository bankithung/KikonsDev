'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Input } from './input';
import { Button } from './button';
import { cn } from '@/lib/utils';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchKey?: keyof T;
  onRowClick?: (item: T) => void;
  title?: string;
  action?: React.ReactNode;
}

export function DataTable<T extends { id: string | number }>({
  data,
  columns,
  searchKey,
  onRowClick,
  title,
  action
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  const filteredData = React.useMemo(() => {
    if (!searchKey || !searchTerm) return data;
    return data.filter((item) => {
      const value = item[searchKey];
      if (typeof value === 'string') {
        return value.toLowerCase().includes(searchTerm.toLowerCase());
      }
      return false;
    });
  }, [data, searchKey, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {title && <h2 className="text-lg font-semibold text-foreground">{title}</h2>}

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {searchKey && (
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          )}
          {action}
        </div>
      </div>

      <div className="rounded-md border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-foreground">
            <thead className="bg-muted border-b border-border text-muted-foreground font-medium">
              <tr>
                {columns.map((col, idx) => (
                  <th key={idx} className={cn("px-4 py-3 font-semibold", col.className)}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => onRowClick?.(item)}
                    className={cn(
                      "hover:bg-muted/50 transition-colors",
                      onRowClick && "cursor-pointer"
                    )}
                  >
                    {columns.map((col, idx) => (
                      <td key={idx} className={cn("px-4 py-3", col.className)}>
                        {col.cell ? col.cell(item) : (item[col.accessorKey as keyof T] as React.ReactNode)}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                    No results found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
