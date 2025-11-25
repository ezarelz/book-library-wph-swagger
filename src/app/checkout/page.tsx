/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useMutation } from '@tanstack/react-query';
import { borrowApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import Image from 'next/image';
import Footer from '@/components/footer/Footer';
import { isValidImageUrl } from '@/utils/imageUtils';

const CART_KEY = 'fake_cart';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: userLoading } = useUser();

  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [cartItems, setCartItems] = useState<any[]>([]);

  const [borrowDuration, setBorrowDuration] = useState<number>(3);
  const [agreeToReturn, setAgreeToReturn] = useState(false);
  const [agreeToPolicy, setAgreeToPolicy] = useState(false);

  /* ----------------------------------------
   * 1. Load selected items & cart from FE
   ---------------------------------------- */
  useEffect(() => {
    if (!userLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    const stored = sessionStorage.getItem('checkoutItems');
    if (!stored) {
      router.push('/cart');
      return;
    }

    const selected = JSON.parse(stored);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedItems(selected);

    // Load entire cart
    const rawCart = localStorage.getItem(CART_KEY);
    const parsedCart = rawCart ? JSON.parse(rawCart) : [];

    setCartItems(parsedCart);
  }, [isAuthenticated, userLoading, router]);

  /* ----------------------------------------
   * 2. Filter only selected cart items
   ---------------------------------------- */
  const selectedCartItems = cartItems.filter((item) =>
    selectedItems.includes(item.id)
  );

  /* ----------------------------------------
   * 3. Mutation: Borrow books via backend
   ---------------------------------------- */
  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (selectedCartItems.length === 0) throw new Error('No items selected');

      const promises = selectedCartItems.map(
        (item) => borrowApi.borrowBook(item.id, borrowDuration) // item.id adalah bookId
      );

      await Promise.all(promises);

      const updatedCart = cartItems.filter(
        (item) => !selectedItems.includes(item.id)
      );

      localStorage.setItem(CART_KEY, JSON.stringify(updatedCart));
      sessionStorage.removeItem('checkoutItems');

      return { success: true };
    },
    onSuccess: () => {
      router.push('/checkout/success');
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || err.message || 'Checkout failed');
    },
  });

  const borrowDate = dayjs();
  const returnDate = borrowDate.add(borrowDuration, 'day');

  /* ----------------------------------------
   * 4. UI states
   ---------------------------------------- */
  if (userLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        Loading...
      </div>
    );
  }

  if (selectedCartItems.length === 0) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <h2 className='text-2xl font-bold mb-2'>No items selected</h2>
          <button
            onClick={() => router.push('/cart')}
            className='px-6 py-3 bg-blue-600 text-white rounded-lg'
          >
            Back to Cart
          </button>
        </div>
      </div>
    );
  }

  /* ----------------------------------------
   * 5. UI Layout
   ---------------------------------------- */
  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <h1 className='text-4xl font-bold text-gray-900 mb-8'>Checkout</h1>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* LEFT SIDE */}
          <div className='lg:col-span-2 space-y-6'>
            {/* User Info */}
            <div className='bg-white rounded-lg shadow-md p-6'>
              <h2 className='text-xl font-bold mb-4'>User Information</h2>
              <div className='space-y-4'>
                <Input label='Name' value={user?.name} />
                <Input label='Email' value={user?.email} />
              </div>
            </div>

            {/* Book List */}
            <div className='bg-white rounded-lg shadow-md p-6'>
              <h2 className='text-xl font-bold mb-4'>Books</h2>

              <div className='space-y-4'>
                {selectedCartItems.map((item) => (
                  <div
                    key={item.id}
                    className='flex items-center gap-4 p-4 border rounded-lg'
                  >
                    <div className='w-16 h-24 bg-gray-200 rounded-lg relative overflow-hidden'>
                      {isValidImageUrl(item.coverImage) ? (
                        <Image
                          src={item.coverImage}
                          alt={item.title}
                          fill
                          className='object-cover'
                        />
                      ) : (
                        <div className='flex items-center justify-center h-full'>
                          📚
                        </div>
                      )}

                      <div className='flex-1'>
                        <span className='inline-block text-xs bg-gray-100 px-2 py-1 rounded'>
                          {item.category}
                        </span>

                        <h3 className='font-bold'>{item.title}</h3>
                        <p className='text-sm text-gray-600'>{item.author}</p>
                      </div>
                    </div>

                    <div className='flex-1'>
                      <span className='inline-block text-xs bg-gray-100 px-2 py-1 rounded'>
                        {item.category}
                      </span>

                      <h3 className='font-bold'>{item.title}</h3>
                      <p className='text-sm text-gray-600'>{item.author}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className='lg:col-span-1'>
            <div className='bg-white rounded-lg shadow-md p-6 sticky top-4'>
              <h2 className='text-xl font-bold mb-6'>
                Complete Your Borrow Request
              </h2>

              {/* Borrow date */}
              <Input
                label='Borrow Date'
                value={borrowDate.format('DD MMM YYYY')}
                disabled
              />

              {/* Borrow duration */}
              <div className='mb-6'>
                <label className='block text-sm font-medium mb-3'>
                  Borrow Duration
                </label>

                <div className='space-y-2'>
                  {[3, 5, 10].map((days) => (
                    <label
                      key={days}
                      className='flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50'
                    >
                      <input
                        type='radio'
                        name='duration'
                        value={days}
                        checked={borrowDuration === days}
                        onChange={() => setBorrowDuration(days)}
                      />
                      <span className='ml-3'>{days} Days</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Return date */}
              <div className='mb-6 p-4 bg-blue-50 border rounded-lg'>
                Return before:
                <span className='ml-2 font-bold text-red-600'>
                  {returnDate.format('DD MMMM YYYY')}
                </span>
              </div>

              {/* Agreements */}
              <Checkbox
                checked={agreeToReturn}
                onChange={setAgreeToReturn}
                text='I agree to return the book(s) before the due date.'
              />
              <Checkbox
                checked={agreeToPolicy}
                onChange={setAgreeToPolicy}
                text='I accept the library borrowing policy.'
              />

              <button
                onClick={() => checkoutMutation.mutate()}
                disabled={
                  !agreeToReturn || !agreeToPolicy || checkoutMutation.isPending
                }
                className='w-full px-6 py-3 bg-blue-600 text-white rounded-lg disabled:opacity-50'
              >
                {checkoutMutation.isPending
                  ? 'Processing...'
                  : 'Confirm & Borrow'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

/* ----------------------------------------
 * Small UI helpers
 ---------------------------------------- */

function Input({ label, value, disabled = true }) {
  return (
    <div className='mb-4'>
      <label className='block text-sm font-medium mb-1'>{label}</label>
      <input
        type='text'
        value={value || ''}
        disabled={disabled}
        className='w-full px-4 py-2 border rounded bg-gray-50'
      />
    </div>
  );
}

function Checkbox({ checked, onChange, text }) {
  return (
    <label className='flex items-start mb-3 cursor-pointer'>
      <input
        type='checkbox'
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className='mt-1 w-4 h-4 text-blue-600 border-gray-300'
      />
      <span className='ml-3 text-sm'>{text}</span>
    </label>
  );
}
