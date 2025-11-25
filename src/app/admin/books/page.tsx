'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { booksApi, adminApi } from '@/lib/api';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import Image from 'next/image';
import { Plus, Search, Edit2, Trash2, Eye } from 'lucide-react';
import { isValidImageUrl } from '@/utils/imageUtils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function AdminBooksPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('All'); // All, Available, Borrowed, Returned, Damaged
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-books', search, page],
    queryFn: () =>
      booksApi.getAll({
        q: search || undefined, // Use 'q' instead of 'search' and don't send empty strings
        page: page,
        limit: 20, // Use 20 as shown in the working example
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: booksApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['admin-books'] });
      queryClient.invalidateQueries({ queryKey: ['admin-all-loans'] }); // Invalidate loans to recalculate available copies
      setDeleteId(null);
    },
  });

  const rawBooks = useMemo(() => data?.data?.books || [], [data?.data?.books]);

  // Fetch all active loans to calculate actual availableCopies
  const { data: loansData } = useQuery({
    queryKey: ['admin-all-loans', 'active'],
    queryFn: () => adminApi.getAllLoans({ limit: 1000 }), // Fetch all loans to count active ones
  });

  // Count total loans per book (all loans, including returned ones)
  const totalLoansByBook = useMemo(() => {
    const loans = loansData?.data?.loans || loansData?.data || [];
    const countMap = new Map<number, number>();

    loans.forEach((loan: { bookId?: number }) => {
      const bookId = loan.bookId;
      // Count all loans for this book (both active and returned)
      if (bookId) {
        countMap.set(Number(bookId), (countMap.get(Number(bookId)) || 0) + 1);
      }
    });

    return countMap;
  }, [loansData]);

  // Count active loans per book (status is BORROWED and not returned) for available copies calculation
  const activeLoansByBook = useMemo(() => {
    const loans = loansData?.data?.loans || loansData?.data || [];
    const countMap = new Map<number, number>();

    loans.forEach(
      (loan: {
        bookId?: number;
        status?: string;
        returnedAt?: string | null;
      }) => {
        const bookId = loan.bookId;
        // Count only active loans (BORROWED status and not returned)
        if (bookId && loan.status === 'BORROWED' && !loan.returnedAt) {
          countMap.set(Number(bookId), (countMap.get(Number(bookId)) || 0) + 1);
        }
      }
    );

    return countMap;
  }, [loansData]);

  // Get book IDs that need enrichment
  const bookIdsToEnrich = useMemo(() => {
    const ids = new Set<number>();
    rawBooks.forEach(
      (book: { id?: number; Author?: { name?: string }; author?: string }) => {
        if (book.id && !book.Author?.name && !book.author) {
          ids.add(Number(book.id));
        }
      }
    );
    return Array.from(ids);
  }, [rawBooks]);

  // Fetch enriched book details for books missing author/category
  const { data: enrichedBooksData } = useQuery({
    queryKey: ['admin-books-enriched', bookIdsToEnrich],
    queryFn: async () => {
      const bookPromises = bookIdsToEnrich.map((bookId) =>
        booksApi.getById(bookId).catch(() => null)
      );
      const results = await Promise.all(bookPromises);
      const bookMap = new Map();
      results.forEach((result) => {
        if (result?.data) {
          bookMap.set(result.data.id, result.data);
        }
      });
      return bookMap;
    },
    enabled: bookIdsToEnrich.length > 0,
  });

  // Enrich books with author and category data, and sync availableCopies with active loans
  const enrichedBooks = useMemo(() => {
    return rawBooks.map(
      (book: {
        id?: number;
        Author?: { name?: string };
        Category?: { name?: string };
        author?: string;
        category?: string;
        title?: string;
        coverImage?: string;
        totalCopies?: number;
        availableCopies?: number;
        rating?: number;
      }) => {
        const bookId = book.id;
        const totalCopies = book.totalCopies || 0;
        const activeLoansCount = bookId
          ? activeLoansByBook.get(Number(bookId)) || 0
          : 0;
        const totalLoansCount = bookId
          ? totalLoansByBook.get(Number(bookId)) || 0
          : 0;

        // Calculate actual availableCopies based on active loans
        // availableCopies = totalCopies - activeLoansCount
        const actualAvailableCopies = Math.max(
          0,
          totalCopies - activeLoansCount
        );

        // If book already has Author/Category, use it
        if (book.Author || book.Category) {
          return {
            ...book,
            author: book.Author?.name || book.author || 'Unknown Author',
            category: book.Category?.name || book.category || 'Uncategorized',
            totalCopies: totalCopies,
            availableCopies: actualAvailableCopies, // Use calculated value
            totalLoansCount: totalLoansCount, // Add total loans count
          };
        }

        // Otherwise, try to get from enriched data
        if (bookId && enrichedBooksData) {
          const enrichedBook = enrichedBooksData.get(Number(bookId));
          if (enrichedBook) {
            const enrichedTotalCopies = enrichedBook.totalCopies || totalCopies;
            const enrichedAvailableCopies = Math.max(
              0,
              enrichedTotalCopies - activeLoansCount
            );

            return {
              ...book,
              Author: enrichedBook.Author,
              Category: enrichedBook.Category,
              author:
                enrichedBook.Author?.name || book.author || 'Unknown Author',
              category:
                enrichedBook.Category?.name || book.category || 'Uncategorized',
              totalCopies: enrichedTotalCopies,
              availableCopies: enrichedAvailableCopies, // Use calculated value
              totalLoansCount: totalLoansCount, // Add total loans count
            };
          }
        }

        return {
          ...book,
          author: book.author || 'Unknown Author',
          category: book.category || 'Uncategorized',
          totalCopies: totalCopies,
          availableCopies: actualAvailableCopies, // Use calculated value
          totalLoansCount: totalLoansCount, // Add total loans count
        };
      }
    );
  }, [rawBooks, enrichedBooksData, activeLoansByBook, totalLoansByBook]);

  // Filter books by status
  const books = useMemo(() => {
    if (statusFilter === 'All') return enrichedBooks;

    return enrichedBooks.filter(
      (book: { totalCopies?: number; availableCopies?: number }) => {
        const totalCopies = book.totalCopies || 0;
        const availableCopies = book.availableCopies || 0;

        switch (statusFilter) {
          case 'Available':
            return availableCopies > 0;
          case 'Borrowed':
            return availableCopies < totalCopies && totalCopies > 0;
          case 'Returned':
            return availableCopies === totalCopies && totalCopies > 0;
          case 'Damaged':
            // For damaged, we'll show books with 0 available and 0 total, or books that might be marked as damaged
            // This might need adjustment based on actual API response
            return (
              totalCopies === 0 || (availableCopies === 0 && totalCopies > 0)
            );
          default:
            return true;
        }
      }
    );
  }, [enrichedBooks, statusFilter]);

  return (
    <div className='space-y-6'>
      {/* Header Actions */}
      <div className='flex flex-col sm:flex-row justify-between gap-4'>
        <Link
          href='/admin/books/new'
          className='inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium'
        >
          <Plus size={20} className='mr-2' />
          Add Book
        </Link>

        <div className='relative flex-1 max-w-md'>
          <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
            <Search size={20} className='text-gray-400' />
          </div>
          <input
            type='text'
            placeholder='Search book'
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1); // Reset to first page when search changes
            }}
            className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          />
        </div>
      </div>

      {/* Filter Pills */}
      <div className='flex flex-wrap gap-2'>
        {['All', 'Available', 'Borrowed', 'Returned', 'Damaged'].map(
          (filter) => (
            <button
              key={filter}
              onClick={() => {
                setStatusFilter(filter);
                setPage(1); // Reset to first page when filter changes
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                statusFilter === filter
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {filter}
            </button>
          )
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className='bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm'>
          Error loading books:{' '}
          {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      )}

      {/* Book List */}
      <div className='space-y-4'>
        {isLoading ? (
          <div className='text-center py-12 text-gray-500'>
            Loading books...
          </div>
        ) : books.length === 0 ? (
          <div className='text-center py-12 text-gray-500 bg-white rounded-lg border border-gray-200'>
            No books found.
          </div>
        ) : (
          books.map(
            (book: {
              id: number;
              title?: string;
              coverImage?: string;
              Author?: { name?: string };
              Category?: { name?: string };
              author?: string;
              category?: string;
              totalCopies?: number;
              availableCopies?: number;
              rating?: number;
            }) => (
              <div
                key={book.id}
                className='bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow'
              >
                <div className='flex flex-col sm:flex-row gap-6'>
                  {/* Cover Image */}
                  <div className='relative w-full sm:w-32 h-48 flex-shrink-0 mx-auto sm:mx-0 bg-gray-200 rounded-lg overflow-hidden'>
                    {book.coverImage && isValidImageUrl(book.coverImage) ? (
                      <Image
                        src={book.coverImage}
                        alt={book.title || 'Book Cover'}
                        fill
                        className='object-cover rounded-lg shadow-sm'
                      />
                    ) : (
                      <div className='w-full h-full flex items-center justify-center text-3xl text-gray-400'>
                        📚
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className='flex-1 flex flex-col justify-between'>
                    <div>
                      <div className='flex flex-wrap items-center gap-2 mb-2'>
                        <span className='px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded'>
                          {book.Category?.name ||
                            book.category ||
                            'Uncategorized'}
                        </span>
                        {(() => {
                          const totalLoansCount =
                            (book as { totalLoansCount?: number })
                              .totalLoansCount || 0;
                          const totalCopies = book.totalCopies || 0;
                          const availableCopies = book.availableCopies || 0;

                          // Show loan count if there are any loans
                          if (totalLoansCount > 0) {
                            return (
                              <span className='px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded'>
                                {totalLoansCount} time
                                {totalLoansCount !== 1 ? 's' : ''} loaned
                              </span>
                            );
                          } else if (availableCopies > 0) {
                            // If no loans yet but copies available
                            return (
                              <span className='px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded'>
                                {availableCopies} Created
                              </span>
                            );
                          } else if (totalCopies > 0) {
                            return (
                              <span className='px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded'>
                                All borrowed
                              </span>
                            );
                          } else {
                            return (
                              <span className='px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded'>
                                Out of stock
                              </span>
                            );
                          }
                        })()}
                      </div>

                      <h3 className='text-xl font-bold text-gray-900 mb-1'>
                        {book.title || 'Untitled'}
                      </h3>
                      <p className='text-gray-600 mb-2'>
                        {book.Author?.name || book.author || 'Unknown Author'}
                      </p>

                      <div className='flex items-center gap-1 text-yellow-500 mb-4'>
                        <span className='font-bold text-sm'>
                          {book.rating || '4.9'}
                        </span>
                        <svg
                          className='w-4 h-4 fill-current'
                          viewBox='0 0 20 20'
                        >
                          <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                        </svg>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className='flex flex-wrap gap-2 mt-4 sm:mt-0'>
                      <Link
                        href={`/books/${book.id}`}
                        className='flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors'
                      >
                        <Eye size={16} className='mr-2' />
                        Preview
                      </Link>
                      <Link
                        href={`/admin/books/${book.id}/edit`}
                        className='flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors'
                      >
                        <Edit2 size={16} className='mr-2' />
                        Edit
                      </Link>
                      <button
                        onClick={() => setDeleteId(book.id)}
                        className='flex items-center px-4 py-2 border border-red-200 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors'
                      >
                        <Trash2 size={16} className='mr-2' />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          )
        )}
      </div>

      {/* Pagination */}
      {data?.data?.pagination && (
        <div className='flex justify-center items-center gap-4 mt-8'>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
            className='px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50 transition-colors'
          >
            Previous
          </button>
          <span className='text-sm text-gray-600'>
            Page {data.data.pagination.page} of{' '}
            {data.data.pagination.totalPages}
          </span>
          <button
            onClick={() =>
              setPage((p) => Math.min(data.data.pagination.totalPages, p + 1))
            }
            disabled={page === data.data.pagination.totalPages || isLoading}
            className='px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50 transition-colors'
          >
            Next
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Dialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Data</DialogTitle>
            <DialogDescription>
              Once deleted, you won&apos;t be able to recover this data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setDeleteId(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
