'use client';

import { Star } from 'lucide-react';
import Image from 'next/image';
import dayjs from 'dayjs';
import { Review } from '@/lib/api/reviewsApi';

export default function ReviewsList({
  reviews,
  isLoading,
  isError,
}: {
  reviews: Review[];
  isLoading?: boolean;
  isError?: boolean;
}) {
  if (isLoading)
    return (
      <div className='flex flex-col gap-4'>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className='h-48 animate-pulse rounded-xl bg-gray-100'
          ></div>
        ))}
      </div>
    );

  if (isError)
    return (
      <div className='rounded-xl bg-red-50 p-4 text-red-600'>
        Failed to load reviews. Please try again later.
      </div>
    );

  if (reviews.length === 0)
    return (
      <div className='flex flex-col items-center justify-center py-12 text-gray-500'>
        <p className='text-lg'>No reviews found.</p>
      </div>
    );

  return (
    <div className='flex flex-col gap-3'>
      {reviews.map((review) => {
        // --- FIX CATEGORY ---
        const category =
          typeof review.Book?.Category === 'string'
            ? review.Book?.Category
            : review.Book?.Category?.name || 'Uncategorized';

        // --- FIX AUTHOR ---
        const author =
          review.Book?.Author?.name || // dari API detail
          (typeof review.Book?.author === 'string'
            ? review.Book?.author
            : null) ||
          'Unknown Author';

        return (
          <div
            key={review.id}
            className='flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:flex-row'
          >
            {/* Book Cover */}
            <div className='shrink-0'>
              <div className='relative h-[140px] w-[100px] overflow-hidden rounded-md shadow-sm'>
                <Image
                  src={review.Book?.coverImage || '/placeholder-book.png'}
                  alt={review.Book?.title || 'Book'}
                  fill
                  className='object-cover'
                />
              </div>
            </div>

            {/* Content */}
            <div className='flex flex-1 flex-col gap-2'>
              <div className='text-xs text-gray-500'>
                {dayjs(review.createdAt).format('D MMMM YYYY, HH:mm')}
              </div>

              {/* Category */}
              <span className='rounded-md border border-gray-200 px-2 py-0.5 text-[15px] font-medium bg-gray-50 text-gray-600'>
                {category}
              </span>

              {/* Title */}
              <h3 className='text-lg font-bold text-gray-900'>
                {review.Book?.title || 'Unknown Book'}
              </h3>

              {/* Author */}
              <p className='text-sm text-gray-500'>{author}</p>

              {/* Stars */}
              <div className='flex items-center gap-1 py-1'>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-4 w-4 ${
                      s <= review.star
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-gray-200 text-gray-200'
                    }`}
                  />
                ))}
              </div>

              {/* Comment */}
              <p className='text-sm leading-relaxed text-gray-600'>
                {review.comment}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
