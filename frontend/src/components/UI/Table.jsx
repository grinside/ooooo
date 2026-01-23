import React from 'react';
import clsx from 'clsx';
import { ChevronUp, ChevronDown } from 'lucide-react';
import Loader from './Loader';

const Table = ({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
  sortColumn,
  sortDirection,
  onSort,
  className = '',
}) => {
  const handleSort = (columnKey) => {
    if (!onSort || !columns.find(col => col.key === columnKey)?.sortable) return;

    const newDirection =
      sortColumn === columnKey && sortDirection === 'asc' ? 'desc' : 'asc';

    onSort(columnKey, newDirection);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader text="Loading data..." />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={clsx('overflow-x-auto', className)}>
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={clsx(
                  'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                  {
                    'cursor-pointer hover:bg-gray-100': column.sortable,
                    'text-center': column.align === 'center',
                    'text-right': column.align === 'right',
                  }
                )}
                onClick={() => column.sortable && handleSort(column.key)}
                style={{ width: column.width }}
              >
                <div className="flex items-center gap-2">
                  <span>{column.label}</span>
                  {column.sortable && (
                    <div className="flex flex-col">
                      <ChevronUp
                        size={12}
                        className={clsx(
                          'transition-colors',
                          sortColumn === column.key && sortDirection === 'asc'
                            ? 'text-primary-500'
                            : 'text-gray-400'
                        )}
                      />
                      <ChevronDown
                        size={12}
                        className={clsx(
                          'transition-colors -mt-1',
                          sortColumn === column.key && sortDirection === 'desc'
                            ? 'text-primary-500'
                            : 'text-gray-400'
                        )}
                      />
                    </div>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, rowIndex) => (
            <tr
              key={row.id || rowIndex}
              className={clsx(
                'transition-colors',
                {
                  'hover:bg-gray-50 cursor-pointer': onRowClick,
                }
              )}
              onClick={() => onRowClick && onRowClick(row)}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={clsx(
                    'px-6 py-4 whitespace-nowrap text-sm',
                    {
                      'text-center': column.align === 'center',
                      'text-right': column.align === 'right',
                    }
                  )}
                >
                  {column.render
                    ? column.render(row[column.key], row)
                    : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
