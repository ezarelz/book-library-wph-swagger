'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const tabs = [
    { name: 'Borrowed List', href: '/admin/borrowed' },
    { name: 'User', href: '/admin/users' },
    { name: 'Book List', href: '/admin/books' },
  ];

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>{children}</div>
    </div>
  );
}
