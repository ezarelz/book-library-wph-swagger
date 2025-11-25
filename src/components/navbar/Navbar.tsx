/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { useEffect, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const CART_KEY = 'fake_cart';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useUser();
  const [searchQuery, setSearchQuery] = useState('');

  // ===== CART COUNT STATE =====
  const [cartCount, setCartCount] = useState(0);

  const loadCartCount = () => {
    if (typeof window === 'undefined') return 0;

    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return 0;

    try {
      const cart = JSON.parse(raw);
      const count = cart.reduce(
        (sum: number, item: any) => sum + (item.quantity || 1),
        0
      );
      return count;
    } catch {
      return 0;
    }
  };

  // Load on mount + every route change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCartCount(loadCartCount());
  }, [pathname]);

  // Listen for cross-tab updates or other parts of FE updating localStorage
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === CART_KEY) {
        setCartCount(loadCartCount());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/books?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <nav className='bg-white border-b border-gray-200'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          {/* Logo */}
          <Link
            href={user?.role === 'ADMIN' ? '/admin/users' : '/'}
            className='flex items-center space-x-2'
          >
            <Image
              src='/logo/web-logo.svg'
              alt='Booky Logo'
              width={32}
              height={32}
              className='w-8 h-8'
            />
            <span className='text-xl font-bold text-gray-900'>Booky</span>
          </Link>

          {/* Admin Navigation Links */}
          {isAuthenticated && user?.role === 'ADMIN' && (
            <div className='hidden md:flex space-x-8'>
              <NavLink
                href='/admin/borrowed'
                pathname={pathname}
                label='Borrowed List'
              />
              <NavLink href='/admin/users' pathname={pathname} label='User' />
              <NavLink
                href='/admin/books'
                pathname={pathname}
                label='Book List'
              />
            </div>
          )}

          {/* Search Bar */}
          {isAuthenticated && user?.role !== 'ADMIN' && (
            <div className='flex-1 max-w-xl mx-8'>
              <form onSubmit={handleSearch} className='relative'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <svg
                    className='h-5 w-5 text-gray-400'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                    />
                  </svg>
                </div>
                <input
                  type='text'
                  placeholder='Search book'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </form>
            </div>
          )}

          {/* Right Side */}
          <div className='flex items-center space-x-4'>
            {isAuthenticated ? (
              <>
                {/* Cart Icon for Users */}
                {user?.role !== 'ADMIN' && (
                  <Link
                    href='/cart'
                    className='relative p-2 text-gray-600 hover:text-gray-900 transition-colors'
                  >
                    <svg
                      className='w-6 h-6'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M5 8h14l-1.5 12H6.5L5 8z'
                      />
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M9 8V6a3 3 0 116 0v2'
                      />
                    </svg>

                    {cartCount > 0 && (
                      <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center'>
                        {cartCount > 99 ? '99+' : cartCount}
                      </span>
                    )}
                  </Link>
                )}

                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className='flex items-center space-x-2 focus:outline-none hover:opacity-80 transition-opacity'>
                      <div className='w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold'>
                        {user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className='text-sm font-medium text-gray-900 hidden md:block'>
                        {user?.name}
                      </span>
                      <svg
                        className='w-4 h-4 text-gray-600'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M19 9l-7 7-7-7'
                        />
                      </svg>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end' className='w-48'>
                    {user?.role !== 'ADMIN' && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href='/profile'>Profile</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href='/borrowed'>Borrowed List</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href='/reviews'>Reviews</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className='text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50'
                    >
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className='flex items-center space-x-3'>
                <Link
                  href='/login'
                  className='px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900'
                >
                  Login
                </Link>
                <Link
                  href='/register'
                  className='px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700'
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavLink({
  href,
  pathname,
  label,
}: {
  href: string;
  pathname: string;
  label: string;
}) {
  const active = pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={`text-sm font-medium ${
        active ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
      }`}
    >
      {label}
    </Link>
  );
}
