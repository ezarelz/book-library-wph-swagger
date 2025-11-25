'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { booksApi, authorsApi, categoriesApi } from '@/lib/api';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Upload, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { isValidImageUrl } from '@/utils/imageUtils';

export default function EditBookPage() {
  const router = useRouter();
  const params = useParams();
  const id = parseInt(params.id as string);
  const queryClient = useQueryClient();

  // Validate that id is a valid number
  const isValidId = !isNaN(id) && id > 0;

  const { data: bookData, isLoading } = useQuery({
    queryKey: ['book', id],
    queryFn: () => booksApi.getById(id),
    enabled: isValidId,
  });

  const [formData, setFormData] = useState({
    title: '',
    authorId: 0,
    categoryId: 0,
    publishedYear: new Date().getFullYear(),
    isbn: '',
    totalCopies: 1,
    availableCopies: 0,
    description: '',
    coverImage: '',
  });

  // Fetch authors and categories for dropdowns
  const { data: authorsData } = useQuery({
    queryKey: ['authors'],
    queryFn: () => authorsApi.getAll(),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
  });

  const authors = authorsData || [];
  const categories = categoriesData?.data?.categories || categoriesData || [];

  useEffect(() => {
    if (bookData?.data) {
      const book = bookData.data;
      setFormData({
        title: book.title || '',
        authorId: book.Author?.id || book.authorId || 0,
        categoryId: book.Category?.id || book.categoryId || 0,
        publishedYear:
          book.publishedYear || book.year || new Date().getFullYear(),
        isbn: book.isbn || '',
        totalCopies: book.totalCopies || 1,
        availableCopies: book.availableCopies || 0,
        description: book.description || '',
        coverImage: book.coverImage || '',
      });
    }
  }, [bookData]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => booksApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['book', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-books'] });
      router.push('/admin/books');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Map form data to API format
    const apiData = {
      title: formData.title,
      description: formData.description,
      isbn: formData.isbn,
      publishedYear: formData.publishedYear,
      coverImage: formData.coverImage,
      authorId: formData.authorId,
      categoryId: formData.categoryId,
      totalCopies: formData.totalCopies,
      availableCopies: formData.availableCopies,
    };
    updateMutation.mutate(apiData);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'publishedYear' ||
        name === 'authorId' ||
        name === 'categoryId' ||
        name === 'totalCopies' ||
        name === 'availableCopies'
          ? parseInt(value) || 0
          : value,
    }));
  };

  // Show error if ID is invalid
  if (!isValidId) {
    return (
      <div className='max-w-3xl mx-auto'>
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center'>
          <div className='text-6xl mb-4'>📚</div>
          <h2 className='text-2xl font-bold text-gray-900 mb-2'>
            Invalid Book ID
          </h2>
          <p className='text-gray-600 mb-6'>
            The book ID you&apos;re trying to edit is invalid.
          </p>
          <button
            onClick={() => router.push('/admin/books')}
            className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
          >
            Back to Books
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <div className='text-center py-12'>Loading book details...</div>;
  }

  return (
    <div className='max-w-3xl mx-auto'>
      <div className='mb-6 flex items-center gap-4'>
        <Link href='/admin/books' className='text-gray-500 hover:text-gray-700'>
          <ArrowLeft size={24} />
        </Link>
        <h1 className='text-2xl font-bold text-gray-900'>Edit Book</h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className='bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6'
      >
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Title
          </label>
          <input
            type='text'
            name='title'
            required
            value={formData.title}
            onChange={handleChange}
            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none'
            placeholder='Enter book title'
          />
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Author
            </label>
            <select
              name='authorId'
              required
              value={formData.authorId}
              onChange={handleChange}
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white'
            >
              <option value='0'>Select Author</option>
              {authors.map((author: { id: number; name: string }) => (
                <option key={author.id} value={author.id}>
                  {author.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Category
            </label>
            <select
              name='categoryId'
              required
              value={formData.categoryId}
              onChange={handleChange}
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white'
            >
              <option value='0'>Select Category</option>
              {categories.map((category: { id: number; name: string }) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Published Year
            </label>
            <input
              type='number'
              name='publishedYear'
              required
              value={formData.publishedYear}
              onChange={handleChange}
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              ISBN
            </label>
            <input
              type='text'
              name='isbn'
              required
              value={formData.isbn}
              onChange={handleChange}
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none'
              placeholder='ISBN'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Number of Pages
            </label>
            <input
              type='number'
              name='numberOfPages'
              min='0'
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none'
              placeholder='Optional'
            />
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Total Copies
            </label>
            <input
              type='number'
              name='totalCopies'
              required
              min='1'
              value={formData.totalCopies}
              onChange={handleChange}
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Available Copies
            </label>
            <input
              type='number'
              name='availableCopies'
              required
              min='0'
              value={formData.availableCopies}
              onChange={handleChange}
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none'
            />
          </div>
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Description
          </label>
          <textarea
            name='description'
            rows={4}
            value={formData.description}
            onChange={handleChange}
            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none'
            placeholder='Enter book description'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Cover Image
          </label>
          <div className='border-2 border-dashed border-gray-300 rounded-lg p-6'>
            {formData.coverImage && isValidImageUrl(formData.coverImage) ? (
              <div className='space-y-4'>
                <div className='relative w-32 h-48 mx-auto'>
                  <Image
                    src={formData.coverImage}
                    alt='Cover preview'
                    fill
                    className='object-cover rounded-lg shadow-sm'
                  />
                </div>
                <div className='flex gap-2 justify-center'>
                  <button
                    type='button'
                    className='flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors'
                  >
                    <Upload size={16} />
                    Change Image
                  </button>
                  <button
                    type='button'
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, coverImage: '' }))
                    }
                    className='flex items-center gap-2 px-4 py-2 border border-red-200 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors'
                  >
                    <Trash2 size={16} />
                    Delete Image
                  </button>
                </div>
                <p className='text-xs text-gray-500 text-center'>
                  PNG or JPG (max. 5mb)
                </p>
              </div>
            ) : (
              <div className='text-center space-y-2'>
                <div className='mx-auto w-12 h-12 text-gray-400'>
                  <Upload size={48} />
                </div>
                <div className='text-sm text-gray-600'>
                  <span className='font-medium text-blue-600 hover:text-blue-500 cursor-pointer'>
                    Paste an image URL
                  </span>
                </div>
                <p className='text-xs text-gray-500'>PNG or JPG (max. 5mb)</p>
              </div>
            )}
            <input
              type='url'
              name='coverImage'
              value={formData.coverImage}
              onChange={handleChange}
              className='mt-4 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm'
              placeholder='https://example.com/image.jpg'
            />
          </div>
        </div>

        <button
          type='submit'
          disabled={updateMutation.isPending}
          className='w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50'
        >
          {updateMutation.isPending ? 'Saving Changes...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
