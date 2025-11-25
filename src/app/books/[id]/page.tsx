'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { booksApi } from '@/lib/api';
import { useUser } from '@/hooks/useUser';
import { useState } from 'react';
import Image from 'next/image';
import Footer from '@/components/footer/Footer';
import { isValidImageUrl } from '@/utils/imageUtils';

import { addToCartLocal } from '@/lib/cartLocal';

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useUser();

  const bookId = Number(params.id);
  const [addToCartSuccess, setAddToCartSuccess] = useState(false);

  // Validate that bookId is a valid number
  const isValidId = !isNaN(bookId) && bookId > 0;

  const { data: bookData, isLoading } = useQuery({
    queryKey: ['book', bookId],
    queryFn: () => booksApi.getById(bookId),
    enabled: isValidId,
  });

  const book = bookData?.data;

  // FE always uses availableCopies
  const availableCopies = book?.availableCopies ?? book?.totalCopies ?? 0;

  //  Invalid ID
  if (!isValidId) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='text-6xl mb-4'>📚</div>
          <h2 className='text-2xl font-bold text-gray-900 mb-2'>
            Invalid Book ID
          </h2>
          <p className='text-gray-600 mb-6'>The book ID is invalid.</p>
          <button
            onClick={() => router.push('/books')}
            className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
          >
            Back to Books
          </button>
        </div>
      </div>
    );
  }

  //  Loading
  if (isLoading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Loading book details...</p>
        </div>
      </div>
    );
  }

  //  Book Not Found
  if (!book) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='text-6xl mb-4'>📚</div>
          <h2 className='text-2xl font-bold text-gray-900 mb-2'>
            Book Not Found
          </h2>
          <p className='text-gray-600 mb-6'>
            The book you&apos;re looking for doesn&apos;t exist.
          </p>
          <button
            onClick={() => router.push('/books')}
            className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
          >
            Back to Books
          </button>
        </div>
      </div>
    );
  }

  // ➕ ADD TO CART (localStorage only)
  const handleAddToCart = () => {
    if (!isAuthenticated) return router.push('/login');

    if (availableCopies <= 0) {
      alert('This book is currently out of stock.');
      return;
    }

    // FE-only cart (safe)
    addToCartLocal({
      id: book.id,
      title: book.title,
      author: book.Author?.name,
      category: book.Category?.name,
      coverImage: book.coverImage,
      availableCopies,
    });

    setAddToCartSuccess(true);
    setTimeout(() => setAddToCartSuccess(false), 2500);
  };

  return (
    <div className='min-h-screen bg-gray-50 py-12'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Success Message */}
        {addToCartSuccess && (
          <div className='mb-6 p-4 bg-green-50 border border-green-200 rounded-lg'>
            <p className='text-green-800 font-medium'>
              ✓ Book added to cart!{' '}
              <button
                onClick={() => router.push('/cart')}
                className='underline font-semibold hover:text-green-900'
              >
                View Cart
              </button>
            </p>
          </div>
        )}

        <div className='bg-white rounded-2xl shadow-lg overflow-hidden'>
          <div className='md:flex'>
            {/* Book Cover */}
            <div className='md:w-1/3 bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center p-12 relative'>
              {isValidImageUrl(book.coverImage) ? (
                <div className='relative w-full max-w-sm aspect-[2/3]'>
                  <Image
                    src={book.coverImage}
                    alt={book.title}
                    fill
                    className='object-contain rounded-lg shadow-2xl'
                  />
                </div>
              ) : (
                <div className='text-white text-center'>
                  <div className='text-9xl mb-4'>📚</div>
                  <p className='text-xl font-medium'>{book.title}</p>
                </div>
              )}
            </div>

            {/* Book Content */}
            <div className='md:w-2/3 p-8 md:p-12'>
              {/* Title */}
              <div className='mb-6'>
                <h1 className='text-4xl font-bold text-gray-900 mb-2'>
                  {book.title}
                </h1>
                <p className='text-xl text-gray-600'>
                  by {book.Author?.name || 'Unknown Author'}
                </p>
              </div>

              {/* Rating */}
              {book.rating > 0 && (
                <div className='flex items-center mb-6'>
                  <span className='text-yellow-500 text-2xl'>⭐</span>
                  <span className='text-2xl font-bold ml-2'>
                    {book.rating.toFixed(1)}
                  </span>
                </div>
              )}

              {/* Info */}
              <div className='grid grid-cols-2 gap-6 mb-8'>
                <div>
                  <p className='text-sm text-gray-500 mb-1'>Year</p>
                  <p className='font-semibold text-gray-900'>
                    {book.publishedYear}
                  </p>
                </div>

                <div>
                  <p className='text-sm text-gray-500 mb-1'>ISBN</p>
                  <p className='font-semibold text-gray-900'>{book.isbn}</p>
                </div>

                <div>
                  <p className='text-sm text-gray-500 mb-1'>Category</p>
                  <p className='font-semibold text-gray-900'>
                    {book.Category?.name}
                  </p>
                </div>
              </div>

              {/* Availability */}
              <div className='mb-8'>
                <p className='text-sm text-gray-500 mb-2'>Availability</p>
                <span
                  className={`inline-block px-4 py-2 rounded-lg font-semibold ${
                    availableCopies > 0
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {availableCopies} copies available
                </span>
              </div>

              {/* Description */}
              <div className='mb-8'>
                <h3 className='text-lg font-bold text-gray-900 mb-3'>
                  Description
                </h3>
                <p className='text-gray-700 leading-relaxed'>
                  {book.description}
                </p>
              </div>

              {/* Buttons */}
              <div className='flex gap-4'>
                <button
                  onClick={handleAddToCart}
                  disabled={availableCopies === 0}
                  className='flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50'
                >
                  Add to Cart
                </button>

                <button
                  onClick={() => router.push('/books')}
                  className='px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50'
                >
                  Back to Books
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
