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
import { Menu, X, Search } from 'lucide-react';

const CART_KEY = 'fake_cart';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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

  // Listen for same-tab cart updates via custom event
  useEffect(() => {
    const onCartUpdate = () => {
      setCartCount(loadCartCount());
    };
    window.addEventListener('cartUpdated', onCartUpdate);
    return () => window.removeEventListener('cartUpdated', onCartUpdate);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/books?search=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
    }
  };

  return (
    <nav className='bg-white border-b border-gray-200 relative'>
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
            {/* Text hidden on mobile, visible on desktop */}
            <span className='hidden md:block text-xl font-bold text-gray-900'>
              Booky
            </span>
          </Link>

          {/* Desktop Search Bar - Hidden on mobile */}
          <div className='hidden md:block flex-1 max-w-md mx-8'>
            <form onSubmit={handleSearch} className='relative'>
              <input
                type='text'
                placeholder='Search books...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='w-full px-4 py-2 pl-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              />
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
            </form>
          </div>

          {/* Mobile Search Expanded Overlay */}
          {isSearchOpen && (
            <div className='md:hidden absolute inset-x-0 top-0 h-16 bg-white z-50 flex items-center px-4 border-b border-gray-200'>
              <div className='flex items-center w-full space-x-2'>
                <Image
                  src='/logo/web-logo.svg'
                  alt='Booky Logo'
                  width={32}
                  height={32}
                  className='w-8 h-8 flex-shrink-0'
                />
                <form onSubmit={handleSearch} className='flex-1 relative'>
                  <input
                    type='text'
                    placeholder='Search book'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className='w-full px-4 py-2 pl-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    autoFocus
                  />
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
                </form>
                <button onClick={() => setIsSearchOpen(false)} className='p-2'>
                  <X className='w-6 h-6 text-gray-500' />
                </button>
              </div>
            </div>
          )}

          {/* Right Side Actions */}
          <div className='flex items-center space-x-4'>
            {/* Mobile Search Icon Trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className='md:hidden p-2 text-gray-700'
            >
              <Search className='w-6 h-6' />
            </button>

            {isAuthenticated ? (
              <>
                {/* Cart Icon (User only, not Admin) */}
                {user?.role !== 'ADMIN' && (
                  <Link
                    href='/cart'
                    className='relative p-2 hover:bg-gray-100 rounded-full transition-colors'
                    aria-label='Shopping Cart'
                  >
                    <svg
                      className='w-6 h-6 text-gray-700'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z'
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

                {/* Desktop User Dropdown */}
                <div className='hidden md:block'>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className='flex items-center space-x-2 focus:outline-none hover:opacity-80 transition-opacity'>
                        <div className='w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-gray-100'>
                          <Image
                            src='/avatar.svg'
                            alt={user?.name || 'User'}
                            width={32}
                            height={32}
                            className='w-full h-full object-cover'
                          />
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
                      {user?.role === 'ADMIN' ? (
                        <>
                          <DropdownMenuItem asChild>
                            <Link href='/admin/users'>Manage Users</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href='/admin/books'>Manage Books</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href='/admin/borrowed'>Borrowed Books</Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href='/'>User Homepage</Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      ) : (
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
                </div>
              </>
            ) : (
              /* Desktop Login/Register Buttons */
              <div className='hidden md:flex items-center space-x-4'>
                <Link
                  href='/login'
                  className='text-gray-700 hover:text-gray-900 font-medium'
                >
                  Login
                </Link>
                <Link
                  href='/register'
                  className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium'
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Menu Trigger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className='md:hidden p-2 text-gray-700'
            >
              {isMobileMenuOpen ? (
                <X className='w-6 h-6' />
              ) : (
                <Menu className='w-6 h-6' />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className='md:hidden border-t border-gray-200 py-4'>
            {isAuthenticated ? (
              <div className='space-y-1'>
                {/* User Info in Menu */}
                <div className='px-4 py-2 flex items-center space-x-3 mb-2'>
                  <div className='w-8 h-8 rounded-full overflow-hidden bg-gray-100'>
                    <Image
                      src='/avatar.svg'
                      alt={user?.name || 'User'}
                      width={32}
                      height={32}
                      className='w-full h-full object-cover'
                    />
                  </div>
                  <span className='font-medium text-gray-900'>
                    {user?.name}
                  </span>
                </div>

                {user?.role !== 'ADMIN' && (
                  <>
                    <Link
                      href='/books'
                      className='block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg'
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Books
                    </Link>
                    <Link
                      href='/profile'
                      className='block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg'
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      href='/borrowed'
                      className='block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg'
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Borrowed List
                    </Link>
                    <Link
                      href='/reviews'
                      className='block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg'
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Reviews
                    </Link>
                  </>
                )}
                {user?.role === 'ADMIN' && (
                  <>
                    <Link
                      href='/admin/users'
                      className='block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg'
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Manage Users
                    </Link>
                    <Link
                      href='/admin/books'
                      className='block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg'
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Manage Books
                    </Link>
                    <Link
                      href='/admin/borrowed'
                      className='block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg'
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Borrowed Books
                    </Link>
                    <Link
                      href='/'
                      className='block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg'
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      User Homepage
                    </Link>
                  </>
                )}
                <div className='border-t border-gray-200 my-2'></div>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className='block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg'
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className='space-y-2 px-4'>
                <Link
                  href='/login'
                  className='block w-full px-4 py-2 text-center text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50'
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href='/register'
                  className='block w-full px-4 py-2 text-center bg-blue-600 text-white rounded-lg hover:bg-blue-700'
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
