'use client';

import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';

import { reviewsApi, Review } from '@/lib/api/reviewsApi';
import { booksApi } from '@/lib/api';
import ReviewsList from '@/components/reviews/ReviewsList';

export default function ReviewsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['my-reviews'],
    queryFn: () => reviewsApi.getMyReviews({ page: 1, limit: 20 }),
  });

  const baseReviews: Review[] = data?.data?.reviews || [];

  // 🟦 ENRICH LOGIC
  const enrichedReviews = useQuery({
    queryKey: ['my-reviews-enriched', baseReviews],
    enabled: baseReviews.length > 0,
    queryFn: async () => {
      // ambil semua bookId unik
      const ids = Array.from(new Set(baseReviews.map((r) => r.bookId)));

      // fetch detail tiap buku
      const promises = ids.map((id) => booksApi.getById(id).catch(() => null));

      const results = await Promise.all(promises);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const map = new Map<number, any>();
      results.forEach((res) => {
        if (res?.data) map.set(res.data.id, res.data);
      });

      // merge review + book detail
      return baseReviews.map((r) => {
        const detailedBook = map.get(r.bookId);

        return {
          ...r,
          Book: {
            ...r.Book, // minimal dari /me/reviews
            ...detailedBook, // lengkap: Author, Category, Rating, dll
          },
        };
      });
    },
  });

  const reviews =
    enrichedReviews.data && enrichedReviews.data.length > 0
      ? enrichedReviews.data
      : baseReviews;

  return (
    <div className='container mx-auto max-w-5xl px-4 py-8'>
      <h1 className='mb-6 text-2xl font-bold text-gray-900'>Reviews</h1>

      {/* Search Bar */}
      <div className='relative mb-8'>
        <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
          <Search className='h-5 w-5 text-gray-400' />
        </div>
        <input
          type='text'
          className='block w-full rounded-full border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
          placeholder='Search Reviews'
        />
      </div>

      <ReviewsList
        reviews={reviews}
        isLoading={isLoading || enrichedReviews.isLoading}
        isError={isError || enrichedReviews.isError}
      />
    </div>
  );
}
