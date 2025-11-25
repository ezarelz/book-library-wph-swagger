'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { booksApi, categoriesApi } from '@/lib/api';
import BookCard from '@/components/books/BookCard';
import { Book } from '@/types/book';
import { Category } from '@/types/book';
import Footer from '@/components/footer/Footer';

export default function BooksPage() {
  const searchParams = useSearchParams();
  const categoryInitializedRef = useRef(false);

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await categoriesApi.getAll();
      return res.data?.categories || [];
    },
  });

  const categories: Category[] = useMemo(
    () => categoriesData || [],
    [categoriesData]
  );

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );
  const [selectedAuthorId, setSelectedAuthorId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 20; // Items per page

  // Handle URL query parameters - only initialize once
  useEffect(() => {
    if (categoryInitializedRef.current || categories.length === 0) return;
    
    const categoryParam = searchParams.get('category');
    const authorIdParam = searchParams.get('authorId');
    
    if (categoryParam) {
      const category = categories.find(
        (cat) => cat.name.toLowerCase() === categoryParam.toLowerCase()
      );
      if (category) {
        categoryInitializedRef.current = true;
        setTimeout(() => {
          setSelectedCategoryId(category.id);
        }, 0);
      }
    }
    
    if (authorIdParam) {
      const authorId = Number(authorIdParam);
      if (!isNaN(authorId) && authorId > 0) {
        categoryInitializedRef.current = true;
        setTimeout(() => {
          setSelectedAuthorId(authorId);
        }, 0);
      }
    }
  }, [searchParams, categories]);

  // Fetch books with correct parameters
  const { data: booksData, isLoading } = useQuery({
    queryKey: ['books', selectedCategoryId, selectedAuthorId, searchQuery, currentPage],
    queryFn: () =>
      booksApi.getAll({
        categoryId: selectedCategoryId || undefined,
        authorId: selectedAuthorId || undefined,
        q: searchQuery || undefined,
        page: currentPage,
        limit: limit,
      }),
  });

  const rawBooks: Book[] = useMemo(
    () => booksData?.data?.books || [],
    [booksData?.data?.books]
  );
  const pagination = booksData?.data?.pagination || {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  };

  // Get book IDs that need enrichment (missing Author or Category)
  const bookIdsToEnrich = useMemo(() => {
    const ids = new Set<number>();
    rawBooks.forEach((book) => {
      if (book.id && (!book.Author || !book.Category)) {
        ids.add(book.id);
      }
    });
    return Array.from(ids);
  }, [rawBooks]);

  // Fetch enriched book details for books missing Author/Category
  const { data: enrichedBooksData } = useQuery({
    queryKey: ['books', 'enriched', bookIdsToEnrich],
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

  // Enrich books with Author and Category data
  const books: Book[] = useMemo(() => {
    return rawBooks.map((book) => {
      // If book already has Author and Category, return as-is
      if (book.Author && book.Category) {
        return book;
      }

      // Otherwise, try to get enriched data
      if (enrichedBooksData && book.id) {
        const enrichedBook = enrichedBooksData.get(book.id);
        if (enrichedBook) {
          return {
            ...book,
            Author: enrichedBook.Author || book.Author,
            Category: enrichedBook.Category || book.Category,
          };
        }
      }

      return book;
    });
  }, [rawBooks, enrichedBooksData]);

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-4xl font-bold text-gray-900 mb-4'>All Books</h1>
          <p className='text-gray-600'>
            Browse our complete collection of books
          </p>
        </div>

        {/* Search Bar */}
        <div className='mb-6'>
          <input
            type='text'
            placeholder='Search books by title, author, or ISBN...'
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1); // Reset to first page on new search
            }}
            className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none'
          />
        </div>

        {/* Category Filter */}
        <div className='mb-8 flex flex-wrap gap-3'>
          <button
            onClick={() => {
              setSelectedCategoryId(null);
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCategoryId === null
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => {
                setSelectedCategoryId(category.id);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategoryId === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Books Grid */}
        {isLoading ? (
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6'>
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className='bg-white rounded-lg shadow-md h-96 animate-pulse'
              >
                <div className='h-64 bg-gray-300'></div>
                <div className='p-4 space-y-3'>
                  <div className='h-4 bg-gray-300 rounded'></div>
                  <div className='h-3 bg-gray-300 rounded w-2/3'></div>
                </div>
              </div>
            ))}
          </div>
        ) : books.length > 0 ? (
          <>
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8'>
              {books.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className='flex items-center justify-center gap-2 mt-8'>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className='px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  Previous
                </button>
                <div className='flex items-center gap-2'>
                  {Array.from(
                    { length: pagination.totalPages },
                    (_, i) => i + 1
                  )
                    .filter((page) => {
                      // Show first page, last page, current page, and pages around current
                      return (
                        page === 1 ||
                        page === pagination.totalPages ||
                        Math.abs(page - currentPage) <= 1
                      );
                    })
                    .map((page, index, array) => {
                      // Add ellipsis if there's a gap
                      const showEllipsisBefore =
                        index > 0 && page - array[index - 1] > 1;
                      return (
                        <div key={page} className='flex items-center gap-2'>
                          {showEllipsisBefore && (
                            <span className='px-2 text-gray-400'>...</span>
                          )}
                          <button
                            onClick={() => setCurrentPage(page)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                              currentPage === page
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                            }`}
                          >
                            {page}
                          </button>
                        </div>
                      );
                    })}
                </div>
                <button
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(pagination.totalPages, prev + 1)
                    )
                  }
                  disabled={currentPage === pagination.totalPages}
                  className='px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  Next
                </button>
              </div>
            )}

            {/* Results Info */}
            <div className='text-center text-sm text-gray-600 mt-4'>
              Showing {books.length} of {pagination.total} books
              {pagination.totalPages > 1 &&
                ` (Page ${currentPage} of ${pagination.totalPages})`}
            </div>
          </>
        ) : (
          <div className='text-center py-12'>
            <div className='text-6xl mb-4'>📚</div>
            <p className='text-gray-500 text-lg'>No books found.</p>
            <p className='text-gray-400 text-sm mt-2'>
              Try adjusting your search or filter.
            </p>
          </div>
        )}
      </div>
      {/* Footer */}
      <Footer />
    </div>
  );
}
