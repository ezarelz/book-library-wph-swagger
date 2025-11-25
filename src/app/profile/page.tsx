'use client';

import { useEffect, useState } from 'react';
import { useUserContext } from '@/context/UserContext';
import { booksApi, userApi } from '@/lib/api';
import Footer from '@/components/footer/Footer';
import Image from 'next/image';
import BorrowedList from '@/components/borrowed/BorrowedList';
import ReviewsList from '@/components/reviews/ReviewsList';
import { BorrowedBook, Book } from '@/types/book';
import { Review } from '@/lib/api/reviewsApi';
import { normalizeBook } from '@/utils/normalizeBook';

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

export default function ProfilePage() {
  const { isAuthenticated, isLoading: authLoading } = useUserContext();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loans, setLoans] = useState<(BorrowedBook & { book?: Book })[]>([]);
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
          // Map API response to BorrowedBook type

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mappedLoans = (res.data.loans || []).map((loan: any) => ({
            ...loan,
            borrowDate: loan.borrowedAt,
            book: loan.Book ? normalizeBook(loan.Book) : undefined,
          }));
          setLoans(mappedLoans);
        }
      } catch (error) {
        console.error('Failed to fetch loans:', error);
      }
    };

    if (activeTab === 'borrowed' && isAuthenticated) {
      fetchLoans();
    }
  }, [activeTab, isAuthenticated]);

  const [enrichedReviews, setEnrichedReviews] = useState<Review[]>([]);

  // Fetch reviews + enrich with book details
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await userApi.getMyReviews();

        if (!res.success) return;

        const baseReviews = res.data.reviews || [];
        setReviews(baseReviews); // simpan raw dulu

        // Kumpulkan bookId unik
        const ids = baseReviews.map((r: Review) => r.bookId);
        const uniqueIds = Array.from(new Set(ids));

        // Fetch detail book
        const promises = uniqueIds.map((id) =>
          booksApi.getById(Number(id)).catch(() => null)
        );
        const results = await Promise.all(promises);

        const bookMap = new Map<number, Book>();
        results.forEach((res) => {
          if (res?.data) bookMap.set(res.data.id, res.data);
        });

        // Merge review + detail book
        const merged = baseReviews.map((r: Review) => {
          const detailedBook = bookMap.get(r.bookId);

          return {
            ...r,
            Book: {
              ...r.Book,
              ...detailedBook,
              Author: detailedBook?.Author ?? r.Book?.Author ?? null,
              Category: detailedBook?.Category ?? r.Book?.Category ?? null,
            },
          };
        });

        setEnrichedReviews(merged);
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
            <BorrowedList borrowedBooks={loans} />
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div>
            <h2 className='text-2xl font-bold text-gray-900 mb-8'>Reviews</h2>
            <ReviewsList reviews={enrichedReviews} />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
