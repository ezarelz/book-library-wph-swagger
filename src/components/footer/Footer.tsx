import Image from 'next/image';

export default function Footer() {
  return (
    <footer className='bg-white border-t py-12'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='text-center'>
          {/* Logo and Booky Text Inline */}
          <div className='flex items-center justify-center gap-2 mb-4'>
            <Image
              src='/logo/web-logo.svg'
              alt='Booky Logo'
              width={40}
              height={40}
              className='w-10 h-10'
            />
            <h3 className='text-2xl font-bold text-gray-900'>Booky</h3>
          </div>

          {/* Description */}
          <p className='text-gray-600 mb-8 max-w-5xl mx-auto'>
            Discover inspiring stories & timeless knowledge, ready to borrow
            anytime. Explore online or visit our nearest library branch.
          </p>

          {/* Social Media Section */}
          <div>
            <h4 className='text-sm font-semibold text-gray-700 mb-4'>
              Follow on Social Media
            </h4>
            <div className='flex justify-center items-center gap-4'>
              {/* Facebook */}
              <a
                href='#'
                className='w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors'
                aria-label='Facebook'
              >
                <Image
                  src='/socials/fb.svg'
                  alt='Facebook'
                  width={20}
                  height={20}
                  className='w-5 h-5'
                />
              </a>

              {/* Instagram */}
              <a
                href='#'
                className='w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors'
                aria-label='Instagram'
              >
                <Image
                  src='/socials/ig.svg'
                  alt='Instagram'
                  width={20}
                  height={20}
                  className='w-5 h-5'
                />
              </a>

              {/* LinkedIn */}
              <a
                href='#'
                className='w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors'
                aria-label='LinkedIn'
              >
                <Image
                  src='/socials/linkedin.svg'
                  alt='LinkedIn'
                  width={20}
                  height={20}
                  className='w-5 h-5'
                />
              </a>

              {/* TikTok */}
              <a
                href='#'
                className='w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors'
                aria-label='TikTok'
              >
                <Image
                  src='/socials/tiktok.svg'
                  alt='TikTok'
                  width={20}
                  height={20}
                  className='w-5 h-5'
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
