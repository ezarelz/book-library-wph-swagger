/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Eye } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useUser } from '@/hooks/useUser';
import type { LoginResponse } from '@/types/auth';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useUser();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const loginMutation = useMutation<LoginResponse, Error>({
    mutationFn: async () => {
      // authApi.login SUDAH return res.data, jadi langsung return saja
      return await authApi.login(email, password);
    },

    onSuccess: (resData) => {
      const { user, token } = resData.data;

      // Simpan ke context
      login(user, token);

      // Redirect
      if (user.role === 'ADMIN') {
        router.push('/admin/books');
      } else {
        router.push('/');
      }
    },

    onError: (err: any) => {
      setError(
        err?.response?.data?.message || 'Login failed. Please try again.'
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    loginMutation.mutate();
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 px-4'>
      <div className='max-w-md w-full bg-white rounded-2xl shadow-lg p-8'>
        <div className='text-center mb-8'>
          <div className='flex justify-center mb-4'>
            <Image
              src='/logo/web-logo.svg'
              alt='Booky Logo'
              width={48}
              height={48}
            />
          </div>
          <h2 className='text-3xl font-bold text-gray-900'>Login</h2>
          <p className='text-gray-600'>
            Sign in to manage your library account.
          </p>
        </div>

        {error && (
          <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded-lg'>
            <p className='text-sm text-red-600'>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Email */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Email
            </label>
            <input
              type='email'
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className='w-full px-4 py-3 border border-gray-300 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            />
          </div>

          {/* Password */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Password
            </label>
            <div className='relative'>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className='w-full px-4 py-3 border border-gray-300 rounded-lg 
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                placeholder='Enter your password'
                minLength={6}
              />

              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700'
              >
                {showPassword ? (
                  <Eye size={20} />
                ) : (
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    width='20'
                    height='20'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    className='lucide lucide-eye-closed-icon lucide-eye-closed'
                  >
                    <path d='m15 18-.722-3.25' />
                    <path d='M2 8a10.645 10.645 0 0 0 20 0' />
                    <path d='m20 15-1.726-2.05' />
                    <path d='m4 15 1.726-2.05' />
                    <path d='m9 18 .722-3.25' />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type='submit'
            disabled={loginMutation.isPending}
            className='w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg 
                       transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {loginMutation.isPending ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className='text-center mt-6 text-sm text-gray-600'>
          Don&apos;t have an account?{' '}
          <Link
            href='/register'
            className='text-blue-600 hover:text-blue-700 font-medium'
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
