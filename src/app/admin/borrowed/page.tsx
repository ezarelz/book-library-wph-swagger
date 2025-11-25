'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi, booksApi } from '@/lib/api';
import { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import Image from 'next/image';
import { isValidImageUrl } from '@/utils/imageUtils';
import { Book } from '@/types/book';

export default function AdminBorrowedPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, BORROWED, RETURNED, OVERDUE

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-loans', page, statusFilter],
    queryFn: () => {
      if (statusFilter === 'OVERDUE') {
        return adminApi.getOverdueLoans({ page, limit: 10 });
      }
      return adminApi.getAllLoans({
        page,
        limit: 10,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      });
    },
  });

  // Handle different response structures
  const rawLoans = data?.data?.loans || data?.data || [];
  
  // Get book IDs that need enrichment
  const bookIdsToEnrich = useMemo(() => {
    const ids = new Set<number>();
    rawLoans.forEach((loan: any) => {
      const bookId = loan.bookId || loan.Book?.id || loan.book?.id;
      if (bookId && (!loan.Book?.title && !loan.book?.title)) {
        ids.add(Number(bookId));
      }
    });
    return Array.from(ids);
  }, [rawLoans]);

  // Fetch enriched book details
  const { data: enrichedBooksData } = useQuery({
    queryKey: ['admin-books', 'enriched', bookIdsToEnrich],
    queryFn: async () => {
      const bookPromises = bookIdsToEnrich.map((bookId) =>
        booksApi.getById(bookId).catch(() => {
          return null;
        })
      );
      const results = await Promise.all(bookPromises);
      const bookMap = new Map<number, Book>();
      results.forEach((result) => {
        if (result?.data) {
          bookMap.set(result.data.id, result.data);
        }
      });
      return bookMap;
    },
    enabled: bookIdsToEnrich.length > 0,
  });

  // Enrich loans with book data and filter by status
  const loans = useMemo(() => {
    let enrichedLoans = rawLoans.map((loan: any) => {
      const bookId = loan.bookId || loan.Book?.id || loan.book?.id;
      
      // If book data exists, use it
      if (loan.Book?.title || loan.book?.title) {
        return {
          ...loan,
          Book: loan.Book || loan.book,
          book: loan.book || loan.Book,
        };
      }

      // Otherwise, try to get from fetched books
      if (bookId && enrichedBooksData) {
        const book = enrichedBooksData.get(Number(bookId));
        if (book) {
          return {
            ...loan,
            Book: book,
            book: book,
          };
        }
      }

      return loan;
    });

    // Filter by status if needed
    if (statusFilter === 'ALL') return enrichedLoans;
    if (statusFilter === 'OVERDUE') {
      // Overdue loans are already filtered by the API
      return enrichedLoans;
    }
    // Filter by status for BORROWED and RETURNED
    return enrichedLoans.filter((loan: any) => {
      if (statusFilter === 'BORROWED') {
        return loan.status === 'BORROWED' && !loan.returnedAt;
      }
      if (statusFilter === 'RETURNED') {
        return loan.status === 'RETURNED' || loan.returnedAt !== null;
      }
      return true;
    });
  }, [rawLoans, enrichedBooksData, statusFilter]);

  const pagination = data?.data?.pagination || {
    page: 1,
    limit: 10,
    total: loans.length,
    totalPages: 1,
  };

  const filters = [
    { label: 'All', value: 'ALL' },
    { label: 'Active', value: 'BORROWED' },
    { label: 'Returned', value: 'RETURNED' },
    { label: 'Overdue', value: 'OVERDUE' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold text-gray-900">Borrowed List</h2>
        
        {/* Search - Optional if API supports it */}
        {/* <div className="relative w-full sm:w-64">
          <input ... />
        </div> */}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => {
              setStatusFilter(filter.value);
              setPage(1); // Reset to first page when filter changes
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              statusFilter === filter.value
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
          Error loading loans: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      )}

      {/* List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading loans...</div>
        ) : loans.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-gray-200">
            No borrowed books found.
          </div>
        ) : (
          loans.map((loan: any) => (
            <div key={loan.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                
                {/* Book Info */}
                <div className="flex gap-4">
                  <div className="relative w-24 h-36 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden">
                    {isValidImageUrl(loan.Book?.coverImage || loan.book?.coverImage) ? (
                      <Image
                        src={(loan.Book?.coverImage || loan.book?.coverImage)!}
                        alt={loan.Book?.title || loan.book?.title || 'Book Cover'}
                        fill
                        className="object-cover rounded-lg shadow-sm"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl text-gray-400">
                        📚
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        loan.status === 'RETURNED' ? 'bg-green-100 text-green-700' :
                        loan.status === 'OVERDUE' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {loan.status}
                      </span>
                      <span className="text-xs text-gray-500 border border-gray-200 px-2 py-0.5 rounded">
                        {loan.Book?.Category?.name ||
                          loan.book?.Category?.name ||
                          loan.Book?.category ||
                          loan.book?.category ||
                          'General'}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {loan.Book?.title || loan.book?.title || 'Unknown Book'}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {loan.Book?.Author?.name ||
                        loan.book?.Author?.name ||
                        loan.Book?.author ||
                        loan.book?.author ||
                        'Unknown Author'}
                    </p>
                    
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>
                        Borrowed:{' '}
                        {loan.borrowedAt
                          ? dayjs(loan.borrowedAt).format('DD MMM YYYY')
                          : loan.borrowDate
                            ? dayjs(loan.borrowDate).format('DD MMM YYYY')
                            : 'N/A'}
                      </p>
                      {loan.returnedAt && (
                        <p>Returned: {dayjs(loan.returnedAt).format('DD MMM YYYY')}</p>
                      )}
                      {loan.returnDate && !loan.returnedAt && (
                        <p>Returned: {dayjs(loan.returnDate).format('DD MMM YYYY')}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Loan Details & Borrower */}
                <div className="flex flex-col justify-between items-end text-right">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Due Date</p>
                    <p
                      className={`text-sm font-semibold ${
                        loan.dueAt
                          ? dayjs(loan.dueAt).isBefore(dayjs()) &&
                              loan.status !== 'RETURNED'
                            ? 'text-red-600'
                            : 'text-gray-900'
                          : loan.dueDate
                            ? dayjs(loan.dueDate).isBefore(dayjs()) &&
                                loan.status !== 'RETURNED'
                              ? 'text-red-600'
                              : 'text-gray-900'
                            : 'text-gray-900'
                      }`}
                    >
                      {loan.dueAt
                        ? dayjs(loan.dueAt).format('DD MMM YYYY')
                        : loan.dueDate
                          ? dayjs(loan.dueDate).format('DD MMM YYYY')
                          : 'N/A'}
                    </p>
                  </div>

                  <div className="mt-4 md:mt-0">
                    <p className="text-xs text-gray-500 mb-1">Borrower's Name</p>
                    <p className="text-base font-bold text-gray-900">
                      {loan.User?.name || loan.user?.name || 'Unknown User'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {loan.User?.email || loan.user?.email || ''}
                    </p>
                  </div>
                </div>

              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex justify-center space-x-2 mt-8">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
          >
            Previous
          </button>
          <button
            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
