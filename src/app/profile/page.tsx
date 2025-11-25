'use client';

import { useEffect, useState } from 'react';
import { useUserContext } from '@/context/UserContext';
import { userApi } from '@/lib/api';
import Footer from '@/components/footer/Footer';
import Image from 'next/image';

interface ProfileData {
  profile: {
    id: number;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  };
  loanStats: {
    borrowed: number;
    late: number;
    returned: number;
    total: number;
  };
  reviewsCount: number;
}

interface Loan {
  id: number;
  bookId: number;
  userId: number;
  borrowedAt: string;
  dueDate: string;
  returnedAt: string | null;
  status: string;
  book: {
    id: number;
    title: string;
    coverImage: string;
    author: {
      name: string;
    };
  };
}

interface Review {
  id: number;
  bookId: number;
  rating: number;
  comment: string;
  createdAt: string;
  book: {
    id: number;
    title: string;
    coverImage: string;
  };
}

export default function ProfilePage() {
  const { isAuthenticated, isLoading: authLoading } = useUserContext();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'profile' | 'borrowed' | 'reviews'
  >('profile');

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await userApi.getProfile();
        if (res.success) {
          setProfileData(res.data);
          setEditName(res.data.profile.name);
          setEditEmail(res.data.profile.email);
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchProfile();
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading]);

  // Fetch loans when borrowed tab is active
  useEffect(() => {
    const fetchLoans = async () => {
      try {
        const res = await userApi.getMyLoans();
        if (res.success) {
          setLoans(res.data.loans || []);
        }
      } catch (error) {
        console.error('Failed to fetch loans:', error);
      }
    };

    if (activeTab === 'borrowed' && isAuthenticated) {
      fetchLoans();
    }
  }, [activeTab, isAuthenticated]);

  // Fetch reviews when reviews tab is active
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await userApi.getMyReviews();
        if (res.success) {
          setReviews(res.data.reviews || []);
        }
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
      }
    };

    if (activeTab === 'reviews' && isAuthenticated) {
      fetchReviews();
    }
  }, [activeTab, isAuthenticated]);

  const handleUpdateProfile = async () => {
    setUpdating(true);
    try {
      const res = await userApi.updateProfile({
        name: editName,
        email: editEmail,
      });
      if (res.success) {
        setProfileData((prev) =>
          prev
            ? {
                ...prev,
                profile: { ...prev.profile, name: editName, email: editEmail },
              }
            : null
        );
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditName(profileData?.profile.name || '');
    setEditEmail(profileData?.profile.email || '');
    setIsEditing(false);
  };

  if (authLoading || loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex flex-col'>
        <div className='flex-grow flex items-center justify-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className='min-h-screen bg-gray-50 flex flex-col'>
        <div className='flex-grow flex items-center justify-center'>
          <p className='text-gray-500'>Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-white'>
      <main className='max-w-4xl mx-auto px-4 py-12'>
        {/* Tabs Navigation */}
        <div className='flex gap-8 mb-8 border-b border-gray-200'>
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-4 text-base font-medium transition-colors relative ${
              activeTab === 'profile'
                ? 'text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Profile
            {activeTab === 'profile' && (
              <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600' />
            )}
          </button>
          <button
            onClick={() => setActiveTab('borrowed')}
            className={`pb-4 text-base font-medium transition-colors relative ${
              activeTab === 'borrowed'
                ? 'text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Borrowed List
            {activeTab === 'borrowed' && (
              <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600' />
            )}
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-4 text-base font-medium transition-colors relative ${
              activeTab === 'reviews'
                ? 'text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Reviews
            {activeTab === 'reviews' && (
              <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600' />
            )}
          </button>
        </div>

        {/* Profile Content */}
        {activeTab === 'profile' && (
          <div>
            <h2 className='text-2xl font-bold text-gray-900 mb-8'>Profile</h2>

            {/* Profile Card */}
            <div className='bg-gray-50 rounded-2xl p-8'>
              {/* Avatar and Name */}
              <div className='flex items-start gap-6 mb-8'>
                <div className='w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex-shrink-0'>
                  <Image
                    src='/avatar.svg'
                    alt={profileData?.profile.name || 'User'}
                    width={80}
                    height={80}
                    className='w-full h-full object-cover'
                  />
                </div>
                <div className='flex-grow'>
                  <h3 className='text-xl font-bold text-gray-900 mb-1'>
                    {profileData?.profile.name}
                  </h3>
                </div>
              </div>

              {/* Profile Details Grid */}
              <div className='space-y-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  {/* Name Field */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Name
                    </label>
                    {isEditing ? (
                      <input
                        type='text'
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      />
                    ) : (
                      <div className='text-base text-gray-900'>
                        {profileData?.profile.name}
                      </div>
                    )}
                  </div>

                  {/* Email Field */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Email
                    </label>
                    {isEditing ? (
                      <input
                        type='email'
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      />
                    ) : (
                      <div className='text-base text-gray-900'>
                        {profileData?.profile.email}
                      </div>
                    )}
                  </div>

                  {/* Phone Field - Static */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Nomor Handphone
                    </label>
                    <div className='text-base text-gray-900'>081234567890</div>
                  </div>
                </div>

                {/* Update Profile Button */}
                <div className='pt-4 flex gap-3'>
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleUpdateProfile}
                        disabled={updating}
                        className='px-8 py-3 bg-blue-600 text-white text-base font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50'
                      >
                        {updating ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={updating}
                        className='px-8 py-3 bg-gray-200 text-gray-700 text-base font-medium rounded-xl hover:bg-gray-300 transition-colors disabled:opacity-50'
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className='w-full md:w-auto px-8 py-3 bg-blue-600 text-white text-base font-medium rounded-xl hover:bg-blue-700 transition-colors'
                    >
                      Update Profile
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Borrowed List Tab */}
        {activeTab === 'borrowed' && (
          <div>
            <h2 className='text-2xl font-bold text-gray-900 mb-8'>
              Borrowed List
            </h2>
            {loans.length > 0 ? (
              <div className='space-y-4'>
                {loans
                  .filter((loan) => loan.status === 'ACTIVE')
                  .map((loan) => (
                    <div
                      key={loan.id}
                      className='bg-gray-50 rounded-2xl p-6 flex gap-4'
                    >
                      <img
                        src={loan.book.coverImage}
                        alt={loan.book.title}
                        className='w-20 h-28 object-cover rounded-lg'
                      />
                      <div className='flex-grow'>
                        <h3 className='font-bold text-lg text-gray-900'>
                          {loan.book.title}
                        </h3>
                        <p className='text-sm text-gray-600'>
                          by {loan.book.author.name}
                        </p>
                        <p className='text-sm text-gray-500 mt-2'>
                          Due: {new Date(loan.dueDate).toLocaleDateString()}
                        </p>
                        <span
                          className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                            loan.status === 'ACTIVE'
                              ? 'bg-blue-100 text-blue-700'
                              : loan.status === 'OVERDUE'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {loan.status}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className='bg-gray-50 rounded-2xl p-12 text-center'>
                <div className='text-gray-400 mb-4'>
                  <svg
                    className='w-16 h-16 mx-auto'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={1.5}
                      d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
                    />
                  </svg>
                </div>
                <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                  No borrowed books yet
                </h3>
                <p className='text-gray-500'>
                  Your borrowed books will appear here
                </p>
              </div>
            )}
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div>
            <h2 className='text-2xl font-bold text-gray-900 mb-8'>Reviews</h2>
            {reviews.length > 0 ? (
              <div className='space-y-4'>
                {reviews
                  .filter((review) => review.book) // Filter out reviews without book data
                  .map((review) => (
                    <div
                      key={review.id}
                      className='bg-gray-50 rounded-2xl p-6 flex gap-4'
                    >
                      <img
                        src={review.book?.coverImage || '/placeholder-book.png'}
                        alt={review.book?.title || 'Book'}
                        className='w-20 h-28 object-cover rounded-lg'
                      />
                      <div className='flex-grow'>
                        <h3 className='font-bold text-lg text-gray-900'>
                          {review.book?.title || 'Unknown Book'}
                        </h3>
                        <div className='flex items-center gap-1 mt-1'>
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                              fill='none'
                              stroke='currentColor'
                              viewBox='0 0 24 24'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z'
                              />
                            </svg>
                          ))}
                        </div>
                        <p className='text-sm text-gray-700 mt-2'>
                          {review.comment}
                        </p>
                        <p className='text-xs text-gray-400 mt-2'>
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className='bg-gray-50 rounded-2xl p-12 text-center'>
                <div className='text-gray-400 mb-4'>
                  <svg
                    className='w-16 h-16 mx-auto'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={1.5}
                      d='M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z'
                    />
                  </svg>
                </div>
                <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                  No reviews yet
                </h3>
                <p className='text-gray-500'>
                  Your book reviews will appear here
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
