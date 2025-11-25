'use client';

import { useQuery } from '@tanstack/react-query';
import { booksApi, authorsApi } from '@/lib/api';
import BookCard from '@/components/books/BookCard';
import { Book } from '@/types/book';
import { Author } from '@/types/book';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useMemo } from 'react';
import Footer from '@/components/footer/Footer';
import { Button } from '@/components/ui/button';

const categories = [
  { name: 'Fiction', icon: '✍️' },
  { name: 'Non-Fiction', icon: '📖' },
  { name: 'Self Improvement', icon: '📚' },
  { name: 'Finance', icon: '💰' },
  { name: 'Science', icon: '🔬' },
  { name: 'Education', icon: '🎓' },
];

// Hero Banner Carousel Component
function HeroBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 3;

  // Auto-rotate carousel every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 5000);

    return () => clearInterval(interval);
  }, [totalSlides]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <section className='py-8 bg-white'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Banner Container with rounded corners */}
        <div className='relative overflow-hidden bg-gradient-to-b from-[#7ec8e3] via-[#b8dcef] to-white rounded-3xl h-[441px]'>
          {/* Carousel Container */}
          <div className='relative w-full h-full'>
            {/* Slide Wrapper */}
            <div className='relative w-full h-full'>
              {Array.from({ length: totalSlides }).map((_, slideIndex) => (
                <div
                  key={slideIndex}
                  className={`absolute inset-0 transition-opacity duration-500 ${
                    slideIndex === currentSlide
                      ? 'opacity-100 z-10'
                      : 'opacity-0 z-0'
                  }`}
                >
                  {/* Main hero content */}
                  <div className='relative w-full h-full flex items-center justify-center'>
                    {/* Left character - child on book */}
                    <div className='absolute left-0 bottom-0 w-48 md:w-64 lg:w-80 z-10'>
                      <Image
                        src='/banner/left.png'
                        alt='Child reading on a book'
                        width={320}
                        height={320}
                        className='w-full h-auto object-contain'
                        priority={slideIndex === 0}
                      />
                    </div>

                    {/* Center text */}
                    <div className='text-center z-20 px-4'>
                      <h1
                        className='text-5xl md:text-6xl lg:text-7xl font-extrabold text-white'
                        style={{
                          textShadow:
                            '3px 3px 0 #7cb4e8, -3px -3px 0 #7cb4e8, 3px -3px 0 #7cb4e8, -3px 3px 0 #7cb4e8, 0 0 20px rgba(124, 180, 232, 0.5)',
                          fontFamily:
                            'var(--font-nunito, "Nunito", "Comic Sans MS", cursive)',
                          letterSpacing: '0.02em',
                        }}
                      >
                        Welcome to
                        <br />
                        Booky
                      </h1>
                    </div>

                    {/* Right character - child on paper plane */}
                    <div className='absolute right-0 bottom-0 w-48 md:w-64 lg:w-80 z-10'>
                      <Image
                        src='/banner/right.png'
                        alt='Child on paper plane'
                        width={320}
                        height={320}
                        className='w-full h-auto object-contain'
                        priority={slideIndex === 0}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Carousel dots indicator - Clickable */}
            <div className='absolute bottom-4 left-1/2 transform -translate-x-1/2 flex justify-center gap-2 z-30'>
              {Array.from({ length: totalSlides }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`transition-all duration-300 rounded-full ${
                    index === currentSlide
                      ? 'w-8 h-2.5 bg-blue-500'
                      : 'w-2.5 h-2.5 bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Popular Authors Section Component
function PopularAuthorsSection() {
  const { data: authorsData, isLoading } = useQuery({
    queryKey: ['authors', 'popular'],
    queryFn: async () => {
      const authors = await authorsApi.getAll();
      // Get authors with their book counts
      const authorsWithBooks = await Promise.all(
        authors.slice(0, 4).map(async (author: Author) => {
          try {
            const booksData = await authorsApi.getBooksByAuthor(author.id);
            const bookCount = booksData?.data?.books?.length || 0;
            return { ...author, bookCount };
          } catch {
            return { ...author, bookCount: 0 };
          }
        })
      );
      return authorsWithBooks;
    },
  });

  const authors = authorsData || [];

  return (
    <section className='py-12 bg-white'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <h2 className='text-3xl font-bold text-gray-900 mb-8'>Popular Authors</h2>

        {isLoading ? (
          <div className='flex gap-6 overflow-x-auto pb-4'>
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className='flex-shrink-0 w-64 bg-gray-100 rounded-lg p-4 animate-pulse'
              >
                <div className='flex items-center gap-4'>
                  <div className='w-16 h-16 bg-gray-300 rounded-full'></div>
                  <div className='flex-1 space-y-2'>
                    <div className='h-4 bg-gray-300 rounded w-3/4'></div>
                    <div className='h-3 bg-gray-300 rounded w-1/2'></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : authors.length > 0 ? (
          <div className='flex gap-6 overflow-x-auto pb-4'>
            {authors.map((author: Author & { bookCount?: number }) => (
              <Link
                key={author.id}
                href={`/books?authorId=${author.id}`}
                className='flex-shrink-0 w-64 bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow'
              >
                <div className='flex items-center gap-4'>
                  <div className='w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0'>
                    {author.name?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <h3 className='font-semibold text-gray-900 truncate'>
                      {author.name}
                    </h3>
                    <div className='flex items-center gap-1 text-sm text-gray-600 mt-1'>
                      <svg
                        className='w-4 h-4 text-blue-600'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
                        />
                      </svg>
                      <span>{author.bookCount || 0} books</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className='text-center py-12'>
            <p className='text-gray-500 text-lg'>No authors available.</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default function HomePage() {
  const { data: booksData, isLoading } = useQuery({
    queryKey: ['books', 'recommendations'],
    queryFn: () => booksApi.getAll({ limit: 10 }),
  });

  const rawBooks: Book[] = useMemo(
    () => booksData?.data?.books || [],
    [booksData?.data?.books]
  );

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
    queryKey: ['books', 'enriched', 'home', bookIdsToEnrich],
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
    <div className='min-h-screen'>
      {/* Hero Section */}
      <HeroBanner />

      {/* Categories */}
      <section className='py-12 bg-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4'>
            {categories.map((category) => (
              <Link
                key={category.name}
                href={`/books?category=${category.name}`}
                className='flex flex-col items-center p-6 bg-gray-50 rounded-xl hover:bg-blue-50 hover:shadow-md transition-all cursor-pointer'
              >
                <div className='text-4xl mb-2'>{category.icon}</div>
                <span className='text-sm font-medium text-gray-700'>
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recommendations */}
      <section className='py-12 bg-gray-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <h2 className='text-3xl font-bold text-gray-900 mb-8'>Recommendation</h2>

          {isLoading ? (
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6'>
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
              <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8'>
                {books.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
              <div className='flex justify-center'>
                <Button asChild variant='outline'>
                  <Link href='/books'>Load More</Link>
                </Button>
              </div>
            </>
          ) : (
            <div className='text-center py-12'>
              <p className='text-gray-500 text-lg'>
                No books available at the moment.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Popular Authors */}
      <PopularAuthorsSection />

      {/* Footer */}
      <Footer />
    </div>
  );
}
