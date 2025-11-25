/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Footer from '@/components/footer/Footer';
import { isValidImageUrl } from '@/utils/imageUtils';

const CART_KEY = 'fake_cart';

const getCart = () => {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
};

const saveCart = (cart: any[]) => {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
};

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: userLoading } = useUser();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  // Redirect jika belum login
  useEffect(() => {
    if (!userLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, userLoading, router]);

  // Load cart dari localStorage
  useEffect(() => {
    setCartItems(getCart());
  }, []);

  const handleSelectAll = () => {
    if (selectedItems.length === cartItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(cartItems.map((item) => item.id));
    }
  };

  const handleToggleItem = (itemId: number) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleRemoveItem = (id: number) => {
    const updated = cartItems.filter((item) => item.id !== id);
    setCartItems(updated);
    saveCart(updated);
    setSelectedItems((prev) => prev.filter((i) => i !== id));
  };

  const handleQuantityChange = (id: number, qty: number) => {
    if (qty < 1) return;

    const updated = cartItems.map((item) =>
      item.id === id ? { ...item, quantity: qty } : item
    );

    setCartItems(updated);
    saveCart(updated);
  };

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      alert('Please select at least one book.');
      return;
    }

    sessionStorage.setItem('checkoutItems', JSON.stringify(selectedItems));
    router.push('/checkout');
  };

  if (userLoading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Loading your cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='mb-8'>
          <h1 className='text-4xl font-bold text-gray-900 mb-4'>My Cart</h1>
        </div>

        {cartItems.length > 0 ? (
          <div className='bg-white rounded-lg shadow-md p-6'>
            {/* Select All */}
            <div className='mb-6 pb-4 border-b border-gray-200'>
              <label className='flex items-center cursor-pointer'>
                <input
                  type='checkbox'
                  checked={
                    cartItems.length > 0 &&
                    selectedItems.length === cartItems.length
                  }
                  onChange={handleSelectAll}
                  className='w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                />
                <span className='ml-3 text-sm font-medium text-gray-700'>
                  Select All
                </span>
              </label>
            </div>

            {/* Items */}
            <div className='space-y-4 mb-6'>
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className='flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50'
                >
                  <input
                    type='checkbox'
                    checked={selectedItems.includes(item.id)}
                    onChange={() => handleToggleItem(item.id)}
                    className='w-5 h-5 text-blue-600 border-gray-300 rounded'
                  />

                  {/* Cover */}
                  <div className='w-20 h-28 bg-gray-200 rounded-lg overflow-hidden relative flex-shrink-0'>
                    {isValidImageUrl(item.coverImage) ? (
                      <Image
                        src={item.coverImage}
                        alt={item.title}
                        fill
                        className='object-cover'
                      />
                    ) : (
                      <div className='w-full h-full flex items-center justify-center text-4xl'>
                        📚
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className='flex-1'>
                    <div className='mb-1'>
                      <span className='inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded'>
                        {item.category}
                      </span>
                    </div>
                    <h3 className='text-lg font-bold text-gray-900'>
                      {item.title}
                    </h3>
                    <p className='text-sm text-gray-600'>
                      {item.author || 'Unknown Author'}
                    </p>
                  </div>

                  {/* Quantity + Remove */}
                  <div className='flex items-center gap-4'>
                    <div className='flex flex-col items-end gap-1'>
                      <div className='flex items-center gap-2'>
                        <button
                          onClick={() =>
                            handleQuantityChange(
                              item.id,
                              (item.quantity || 1) - 1
                            )
                          }
                          className='w-8 h-8 border border-gray-300 rounded hover:bg-gray-100'
                        >
                          -
                        </button>

                        <span className='w-12 text-center font-medium'>
                          {item.quantity || 1}
                        </span>

                        <button
                          onClick={() =>
                            handleQuantityChange(
                              item.id,
                              (item.quantity || 1) + 1
                            )
                          }
                          className='w-8 h-8 border border-gray-300 rounded hover:bg-gray-100'
                        >
                          +
                        </button>
                      </div>
                      {item.availableCopies !== undefined && (
                        <span className='text-xs text-gray-500'>
                          {item.availableCopies} available
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className='px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Checkout */}
            <div className='pt-4 border-t border-gray-200'>
              <button
                onClick={handleCheckout}
                disabled={selectedItems.length === 0}
                className='w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50'
              >
                Checkout ({selectedItems.length} item
                {selectedItems.length !== 1 ? 's' : ''})
              </button>
            </div>
          </div>
        ) : (
          <div className='bg-white rounded-lg shadow-md p-12 text-center'>
            <div className='text-6xl mb-4'>🛒</div>
            <h2 className='text-2xl font-bold text-gray-900 mb-2'>
              Your Cart is Empty
            </h2>
            <p className='text-gray-600 mb-6'>
              Add some books to your cart to get started!
            </p>
            <Link
              href='/books'
              className='inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium'
            >
              Browse Books
            </Link>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
