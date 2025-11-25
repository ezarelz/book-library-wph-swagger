'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { booksApi, authorsApi, categoriesApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { ArrowLeft, Upload, Plus } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function NewBookPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    authorId: 0,
    authorName: '', // For manual author input
    categoryId: 0,
    publishedYear: new Date().getFullYear(),
    isbn: '',
    totalCopies: 1,
    availableCopies: 1,
    description: '',
    coverImage: '',
  });
  const [showAuthorSuggestions, setShowAuthorSuggestions] = useState(false);

  // Fetch authors and categories for dropdowns
  const { data: authorsData } = useQuery({
    queryKey: ['authors'],
    queryFn: () => authorsApi.getAll(),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
  });

  // Handle different response structures
  // authorsApi.getAll() already extracts res.data.data.authors
  const authors = useMemo(() => {
    return Array.isArray(authorsData)
      ? authorsData
      : authorsData?.data?.authors || authorsData?.authors || [];
  }, [authorsData]);

  // categoriesApi.getAll() returns res.data, so we need to extract categories
  const categories =
    categoriesData?.data?.categories ||
    categoriesData?.categories ||
    (Array.isArray(categoriesData) ? categoriesData : []);

  // Filter authors based on typed name
  const filteredAuthors = useMemo(() => {
    if (!formData.authorName.trim()) return authors;
    const searchTerm = formData.authorName.toLowerCase();
    return authors.filter((author: { name: string }) =>
      author.name.toLowerCase().includes(searchTerm)
    );
  }, [authors, formData.authorName]);

  // Check if author name exists
  const authorExists = useMemo(() => {
    if (!formData.authorName.trim()) return false;
    return authors.some(
      (author: { name: string }) =>
        author.name.toLowerCase() === formData.authorName.toLowerCase()
    );
  }, [authors, formData.authorName]);

  // Mutation to create a new author
  const createAuthorMutation = useMutation({
    mutationFn: (name: string) => authorsApi.create({ name, bio: '' }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['authors'] });
      // Set the newly created author's ID
      const newAuthorId = data?.data?.id || data?.id;
      if (newAuthorId) {
        setFormData((prev) => ({
          ...prev,
          authorId: newAuthorId,
          authorName: formData.authorName, // Keep the name
        }));
      }
    },
    onError: (error: unknown) => {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ||
        (error as { message?: string })?.message ||
        'Failed to create author. The backend service is currently unavailable for creating new authors. Please select an existing author from the list instead.';
      alert(errorMessage);
    },
  });

  const createMutation = useMutation({
    mutationFn: booksApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['admin-books'] });
      router.push('/admin/books');
    },
    onError: (error: unknown) => {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ||
        (error as { message?: string })?.message ||
        'Failed to create book. Please try again.';
      alert(errorMessage);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.authorName.trim()) {
      alert('Please enter or select an author');
      return;
    }

    if (!formData.categoryId || formData.categoryId === 0) {
      alert('Please select a category');
      return;
    }

    if (formData.availableCopies > formData.totalCopies) {
      alert('Available copies cannot exceed total copies');
      return;
    }

    let finalAuthorId = formData.authorId;

    // If author doesn't exist and we have a name, create it first
    if (
      !authorExists &&
      formData.authorName.trim() &&
      formData.authorId === 0
    ) {
      try {
        const authorData = await createAuthorMutation.mutateAsync(
          formData.authorName.trim()
        );
        finalAuthorId = authorData?.data?.id || authorData?.id;
        if (!finalAuthorId) {
          alert('Failed to create author. Please try again.');
          return;
        }
      } catch {
        // Error already handled in mutation
        return;
      }
    } else if (formData.authorId === 0) {
      // Find author by name if ID is not set
      const foundAuthor = authors.find(
        (author: { name: string }) =>
          author.name.toLowerCase() === formData.authorName.toLowerCase()
      );
      if (foundAuthor) {
        finalAuthorId = foundAuthor.id;
      } else {
        alert('Please select an author from the list or create a new one');
        return;
      }
    }

    // Map form data to API format
    const apiData = {
      title: formData.title,
      description: formData.description || '',
      isbn: formData.isbn,
      publishedYear: formData.publishedYear,
      coverImage: formData.coverImage || '',
      authorId: finalAuthorId,
      categoryId: formData.categoryId,
      totalCopies: formData.totalCopies,
      availableCopies: formData.availableCopies,
    };
    createMutation.mutate(apiData);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === 'authorName') {
      setFormData((prev) => ({
        ...prev,
        authorName: value,
        authorId: 0, // Reset ID when typing
      }));
      setShowAuthorSuggestions(true);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]:
          name === 'publishedYear' ||
          name === 'totalCopies' ||
          name === 'availableCopies' ||
          name === 'authorId' ||
          name === 'categoryId'
            ? parseInt(value) || 0
            : value,
      }));
    }
  };

  const handleAuthorSelect = (author: { id: number; name: string }) => {
    setFormData((prev) => ({
      ...prev,
      authorId: author.id,
      authorName: author.name,
    }));
    setShowAuthorSuggestions(false);
  };

  const handleCreateNewAuthor = () => {
    if (formData.authorName.trim() && !authorExists) {
      createAuthorMutation.mutate(formData.authorName.trim());
      setShowAuthorSuggestions(false);
    }
  };

  return (
    <div className='max-w-3xl mx-auto'>
      <div className='mb-6 flex items-center gap-4'>
        <Link href='/admin/books' className='text-gray-500 hover:text-gray-700'>
          <ArrowLeft size={24} />
        </Link>
        <h1 className='text-2xl font-bold text-gray-900'>Add Book</h1>
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

        <div className='relative'>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Author
          </label>
          <input
            type='text'
            name='authorName'
            required
            value={formData.authorName}
            onChange={handleChange}
            onFocus={() => setShowAuthorSuggestions(true)}
            onBlur={() => {
              // Delay to allow clicking on suggestions
              setTimeout(() => setShowAuthorSuggestions(false), 200);
            }}
            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none'
            placeholder='Type author name or select from list'
          />

          {/* Author Suggestions Dropdown */}
          {showAuthorSuggestions && formData.authorName.trim() && (
            <div className='absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto'>
              {filteredAuthors.length > 0 ? (
                <>
                  {filteredAuthors.map(
                    (author: { id: number; name: string }) => (
                      <button
                        key={author.id}
                        type='button'
                        onClick={() => handleAuthorSelect(author)}
                        className='w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors'
                      >
                        {author.name}
                      </button>
                    )
                  )}
                  {!authorExists && (
                    <button
                      type='button'
                      onClick={handleCreateNewAuthor}
                      disabled={createAuthorMutation.isPending}
                      className='w-full text-left px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium transition-colors flex items-center gap-2'
                    >
                      <Plus size={16} />
                      Create new author: &quot;{formData.authorName}&quot;
                    </button>
                  )}
                </>
              ) : (
                !authorExists && (
                  <button
                    type='button'
                    onClick={handleCreateNewAuthor}
                    disabled={createAuthorMutation.isPending}
                    className='w-full text-left px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium transition-colors flex items-center gap-2'
                  >
                    <Plus size={16} />
                    {createAuthorMutation.isPending
                      ? 'Creating...'
                      : `Create new author: "${formData.authorName}"`}
                  </button>
                )
              )}
            </div>
          )}

          {/* Show selected author info */}
          {formData.authorId > 0 && (
            <p className='mt-1 text-sm text-gray-500'>
              Selected: {formData.authorName}
            </p>
          )}
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
            max={formData.totalCopies}
            value={formData.availableCopies}
            onChange={handleChange}
            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none'
          />
          <p className='mt-1 text-sm text-gray-500'>
            Available copies cannot exceed total copies ({formData.totalCopies})
          </p>
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
            Cover Image URL
          </label>
          <div className='border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors'>
            {formData.coverImage ? (
              <div className='relative w-32 h-48 mx-auto mb-4'>
                <Image
                  src={formData.coverImage}
                  alt='Cover preview'
                  fill
                  className='object-cover rounded-lg shadow-sm'
                />
                <button
                  type='button'
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, coverImage: '' }))
                  }
                  className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600'
                >
                  <svg
                    className='w-4 h-4'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M6 18L18 6M6 6l12 12'
                    />
                  </svg>
                </button>
              </div>
            ) : (
              <div className='space-y-2'>
                <div className='mx-auto w-12 h-12 text-gray-400'>
                  <Upload size={48} />
                </div>
                <div className='text-sm text-gray-600'>
                  <span className='font-medium text-blue-600 hover:text-blue-500 cursor-pointer'>
                    Paste an image URL
                  </span>{' '}
                  or enter it below
                </div>
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
          disabled={createMutation.isPending}
          className='w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50'
        >
          {createMutation.isPending ? 'Saving...' : 'Save'}
        </button>
      </form>
    </div>
  );
}
