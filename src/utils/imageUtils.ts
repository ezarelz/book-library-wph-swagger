/**
 * Validates if a string is a valid image URL for Next.js Image component
 * Next.js Image requires URLs to start with:
 * - "/" for relative paths
 * - "http://" or "https://" for absolute URLs
 */
export function isValidImageUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmedUrl = url.trim();
  if (trimmedUrl.length === 0) return false;
  return (
    trimmedUrl.startsWith('/') ||
    trimmedUrl.startsWith('http://') ||
    trimmedUrl.startsWith('https://')
  );
}
