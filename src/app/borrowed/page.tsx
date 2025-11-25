'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { borrowApi, booksApi } from '@/lib/api';
import { BorrowedBook, Book } from '@/types/book';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { useEffect, useMemo } from 'react';
import Footer from '@/components/footer/Footer';
import BorrowedList from '@/components/borrowed/BorrowedList';
import { useToast } from '@/context/ToastContext';

export default function BorrowedBooksPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: userLoading } = useUser();
  const toast = useToast();

  useEffect(() => {
    if (!userLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, userLoading, router]);

  const {
    data: borrowedData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['borrowed-books'],
    queryFn: () => borrowApi.getMyBorrowedBooks(),
    enabled: isAuthenticated,
  });

  const returnMutation = useMutation({
    mutationFn: (loanId: number) => {
      // Ensure loanId is a number
      const numericLoanId = Number(loanId);
      if (isNaN(numericLoanId)) {
        throw new Error(`Invalid loan ID: ${loanId}`);
      }
      return borrowApi.returnBook(numericLoanId);
    },
    onSuccess: async () => {
      toast.success('Book returned successfully');
      await queryClient.invalidateQueries({ queryKey: ['borrowed-books'] });
      await queryClient.refetchQueries({ queryKey: ['borrowed-books'] });
    },
    onError: (error: unknown) => {
      let errorMessage = 'Failed to return book. Please try again.';

      if (error && typeof error === 'object') {
        if (
          'response' in error &&
          error.response &&
          typeof error.response === 'object'
        ) {
          const response = error.response as { data?: { message?: string } };
          errorMessage = response.data?.message || errorMessage;
        } else if ('message' in error && typeof error.message === 'string') {
          errorMessage = error.message;
        }
      }

      toast.error(errorMessage);
    },
  });

  // Try different possible data structures
  // API might return: data.loans, data.borrowedBooks, or just data (array)
  const borrowedBooks = useMemo(() => {
    const loans: BorrowedBook[] = [];
    if (borrowedData?.data) {
      if (Array.isArray(borrowedData.data)) {
        return borrowedData.data;
      } else if (
        borrowedData.data.loans &&
        Array.isArray(borrowedData.data.loans)
      ) {
        return borrowedData.data.loans;
      } else if (
        borrowedData.data.borrowedBooks &&
        Array.isArray(borrowedData.data.borrowedBooks)
      ) {
        return borrowedData.data.borrowedBooks;
      }
    }
    return loans;
  }, [borrowedData]);

  // Get unique book IDs that need to be fetched
  const bookIdsToFetch = useMemo(() => {
    const ids = new Set<number>();
    borrowedBooks.forEach((loan: BorrowedBook & { book?: Book }) => {
      const bookId = loan.bookId || loan.book?.id;
      // Only fetch if book data is missing or incomplete
      if (bookId && (!loan.book || !loan.book.title)) {
        ids.add(Number(bookId));
      }
    });
    return Array.from(ids);
  }, [borrowedBooks]);

  // Fetch book details for loans that don't have complete book data
  const { data: booksData } = useQuery({
    queryKey: ['books', 'details', bookIdsToFetch],
    queryFn: async () => {
      const bookPromises = bookIdsToFetch.map((bookId) =>
        booksApi.getById(bookId).catch(() => {
          return null;
        })
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
    enabled: bookIdsToFetch.length > 0,
  });

  // Enrich borrowed books with book data
  const enrichedBorrowedBooks = useMemo(() => {
    return borrowedBooks.map((loan: BorrowedBook & { book?: Book }) => {
      // If book data exists in loan, use it
      if (loan.book && loan.book.title) {
        return loan;
      }

      // Otherwise, try to get from fetched books
      const bookId = loan.bookId || loan.book?.id;
      if (bookId && booksData) {
        const book = booksData.get(Number(bookId));
        if (book) {
          return {
            ...loan,
            book: {
              ...book,
              // Map Author and Category if they exist
              Author: book.Author,
              Category: book.Category,
            },
          };
        }
      }

      // Return loan as-is if no book data available
      return loan;
    });
  }, [borrowedBooks, booksData]);

  if (userLoading || isLoading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Loading your borrowed books...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='text-6xl mb-4'>⚠️</div>
          <h2 className='text-2xl font-bold text-gray-900 mb-2'>
            Error Loading Books
          </h2>
          <p className='text-gray-600 mb-6'>
            {error instanceof Error
              ? error.message
              : 'Failed to load your borrowed books.'}
          </p>
          <button
            onClick={() =>
              queryClient.refetchQueries({ queryKey: ['borrowed-books'] })
            }
            className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium'
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-4xl font-bold text-gray-900 mb-4'>
            My Borrowed Books
          </h1>
          <p className='text-gray-600'>
            Manage your borrowed books and return dates
          </p>
        </div>

        {/* Borrowed Books List */}
        <BorrowedList
          borrowedBooks={enrichedBorrowedBooks}
          onReturn={(id) => returnMutation.mutate(id)}
          isReturning={returnMutation.isPending}
        />
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
