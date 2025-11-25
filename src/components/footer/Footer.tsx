import Image from 'next/image';

export default function Footer() {
  return (
    <footer className='bg-white border-t py-12'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='text-center'>
          <div className='flex justify-center mb-4'>
            <Image
              src='/logo/web-logo.svg'
              alt='Booky Logo'
              width={48}
              height={48}
              className='w-12 h-12'
            />
          </div>
          <h3 className='text-2xl font-bold text-gray-900 mb-2'>Booky</h3>
          <p className='text-gray-600 mb-6 max-w-2xl mx-auto'>
            Discover inspiring stories & timeless knowledge, ready to borrow
            anytime. Explore online or visit our nearest library branch.
          </p>
          <div className='mb-4'>
            <h4 className='text-sm font-semibold text-gray-700 mb-3'>
              Follow on Social Media
            </h4>
            <div className='flex justify-center space-x-4'>
              <a
                href='#'
                className='w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors'
              >
                <span>f</span>
              </a>
              <a
                href='#'
                className='w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors'
              >
                <span>📷</span>
              </a>
              <a
                href='#'
                className='w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors'
              >
                <span>in</span>
              </a>
              <a
                href='#'
                className='w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors'
              >
                <span>🎵</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

