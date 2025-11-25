'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { UserProvider } from '@/context/UserContext';
import Navbar from '@/components/navbar/Navbar';
import { Quicksand } from 'next/font/google';
import { ToastProvider } from '@/context/ToastContext';
import './globals.css';

const quicksand = Quicksand({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' className={quicksand.className} data-theme='light'>
      <body>
        <QueryClientProvider client={queryClient}>
          <UserProvider>
            <ToastProvider>
              <Navbar />
              <main className='min-h-screen page-wrapper'>{children}</main>
            </ToastProvider>
          </UserProvider>{' '}
        </QueryClientProvider>
      </body>
    </html>
  );
}
