'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Book } from '@/types/book';
import { isValidImageUrl } from '@/utils/imageUtils';

interface BookCardProps {
  book: Book;
}

export default function BookCard({ book }: BookCardProps) {
  // Get author name from Author object or fallback to author string
  const authorName = book.Author?.name || book.author || 'Unknown Author';
  // Get category name from Category object or fallback to category string
  const categoryName = book.Category?.name || book.category || 'Uncategorized';

  const hasValidCoverImage = isValidImageUrl(book.coverImage);

  return (
    <Link href={`/books/${book.id}`}>
      <div className='bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer h-full'>
        {/* Book Cover */}
        <div className='relative h-64 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center overflow-hidden'>
          {hasValidCoverImage ? (
            <Image
              src={book.coverImage!}
              alt={book.title}
              fill
              className='object-cover'
              sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
            />
          ) : (
            <div className='text-white text-center p-4 z-10 relative'>
              <div className='text-6xl mb-2'>📚</div>
              <p className='text-sm font-medium line-clamp-2'>{book.title}</p>
            </div>
          )}
        </div>

        {/* Book Info */}
        <div className='p-4'>
          <h3 className='text-lg font-bold text-gray-900 line-clamp-2 mb-2'>
            {book.title}
          </h3>
          <p className='text-sm text-gray-600 mb-1'>
            Author: <span className='font-medium'>{authorName}</span>
          </p>
          <p className='text-sm text-gray-600 mb-3'>
            Category: <span className='font-medium'>{categoryName}</span>
          </p>

          {/* Rating */}
          {book.rating && (
            <div className='flex items-center mb-2'>
              <span className='text-yellow-500'>⭐</span>
              <span className='text-sm font-semibold ml-1'>
                {book.rating.toFixed(1)}
              </span>
            </div>
          )}

          {/* Availability Status */}
          <div className='flex items-center justify-between'>
            <span
              className={`text-xs font-semibold px-2 py-1 rounded ${
                (book.availableCopies ?? 0) > 0
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {(book.availableCopies ?? 0) > 0
                ? `${book.availableCopies} Available`
                : 'Out of Stock'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
