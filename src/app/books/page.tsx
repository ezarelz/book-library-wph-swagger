'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { booksApi, categoriesApi } from '@/lib/api';
import BookCard from '@/components/books/BookCard';
import { Book } from '@/types/book';
import { Category } from '@/types/book';
import { Star, ListFilter } from 'lucide-react';
import Footer from '@/components/footer/Footer';

export default function BooksPage() {
  // ==========================
  // FETCH CATEGORIES
  // ==========================
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

  // ==========================
  // STATE
  // ==========================
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [searchQuery] = useState('');
  const [currentPage] = useState(1);
  const limit = 20;
  const [showFilter, setShowFilter] = useState(false);

  // ==========================
  // HANDLE CATEGORY CHECKBOX
  // ==========================
  const toggleCategory = (id: number) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  // ==========================
  // HANDLE RATING CHECKBOX
  // ==========================
  const toggleRating = (value: number) => {
    setSelectedRatings((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  // ==========================
  // FETCH BOOKS (WITHOUT RATING)
  // ==========================
  const { data: booksData, isLoading } = useQuery({
    queryKey: ['books', selectedCategories, searchQuery, currentPage],
    queryFn: () =>
      booksApi.getAll({
        categoryId:
          selectedCategories.length === 1 ? selectedCategories[0] : undefined,
        q: searchQuery || undefined,
        page: currentPage,
        limit,
      }),
  });

  const rawBooks: Book[] = useMemo(
    () => booksData?.data?.books || [],
    [booksData?.data?.books]
  );

  // ==========================
  // LOCAL RATING FILTER
  // ==========================
  const filteredBooks = useMemo(() => {
    if (selectedRatings.length === 0) return rawBooks;
    return rawBooks.filter((book) =>
      selectedRatings.includes(Math.round(book.averageRating || 0))
    );
  }, [rawBooks, selectedRatings]);

  // ==========================
  // UI
  // ==========================
  return (
    <div className='min-h-screen bg-white py-8'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <h1 className='text-4xl font-bold mb-6'>Book List</h1>

        {/* MOBILE FILTER BUTTON */}
        <div className='mb-4 md:hidden flex justify-between items-center'>
          <span className='font-medium'>FILTER</span>
          <button
            onClick={() => setShowFilter(true)}
            className='p-2 border rounded-lg'
          >
            <ListFilter className='w-5 h-5' />
          </button>
        </div>

        {/* SIDEBAR + GRID */}
        <div className='flex gap-10'>
          {/* SIDEBAR DESKTOP */}
          <aside className='hidden md:block w-64 rounded-xl border p-6 shadow-sm h-fit'>
            {/* CATEGORY */}
            <h2 className='font-semibold mb-4'>Category</h2>
            <div className='flex flex-col gap-2 mb-8'>
              {categories.map((cat) => (
                <label
                  key={cat.id}
                  className='flex items-center gap-2 cursor-pointer'
                >
                  <input
                    type='checkbox'
                    checked={selectedCategories.includes(cat.id)}
                    onChange={() => toggleCategory(cat.id)}
                    className='w-4 h-4'
                  />
                  <span>{cat.name}</span>
                </label>
              ))}
            </div>

            {/* RATING */}
            <h2 className='font-semibold mb-4'>Rating</h2>
            <div className='flex flex-col gap-3'>
              {[5, 4, 3, 2, 1].map((r) => (
                <label
                  key={r}
                  className='flex items-center gap-2 cursor-pointer'
                >
                  <input
                    type='checkbox'
                    checked={selectedRatings.includes(r)}
                    onChange={() => toggleRating(r)}
                    className='w-4 h-4'
                  />
                  <div className='flex items-center gap-1 text-gray-700'>
                    <Star className='w-4 h-4 text-yellow-400 fill-yellow-400' />
                    <span className='text-sm'>{r}</span>
                  </div>
                </label>
              ))}
            </div>
          </aside>

          {/* GRID */}
          <main className='flex-1'>
            {isLoading ? (
              <p>Loading...</p>
            ) : (
              <div className='grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6'>
                {filteredBooks.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {showFilter && (
        <div className='fixed inset-0 bg-black/40 z-50 flex justify-end'>
          <div className='w-72 bg-white h-full p-6'>
            <div className='flex justify-between items-center mb-4'>
              <span className='font-semibold'>Filter</span>
              <button onClick={() => setShowFilter(false)}>✕</button>
            </div>

            {/* CATEGORY MOBILE */}
            <h3 className='font-medium mb-3'>Category</h3>
            <div className='flex flex-col gap-2 mb-6'>
              {categories.map((cat) => (
                <label
                  key={cat.id}
                  className='flex items-center gap-2 cursor-pointer'
                >
                  <input
                    type='checkbox'
                    checked={selectedCategories.includes(cat.id)}
                    onChange={() => toggleCategory(cat.id)}
                    className='w-4 h-4'
                  />
                  <span>{cat.name}</span>
                </label>
              ))}
            </div>

            {/* RATING MOBILE */}
            <h3 className='font-medium mb-3'>Rating</h3>
            <div className='flex flex-col gap-3'>
              {[5, 4, 3, 2, 1].map((r) => (
                <label
                  key={r}
                  className='flex items-center gap-2 cursor-pointer'
                >
                  <input
                    type='checkbox'
                    checked={selectedRatings.includes(r)}
                    onChange={() => toggleRating(r)}
                    className='w-4 h-4'
                  />
                  <div className='flex items-center gap-1 text-gray-700'>
                    <Star className='w-4 h-4 text-yellow-400 fill-yellow-400' />
                    <span className='text-sm'>{r}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
