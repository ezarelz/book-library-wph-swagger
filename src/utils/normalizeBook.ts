/* eslint-disable @typescript-eslint/no-explicit-any */
import { Book } from '@/types/book';

export function normalizeBook(raw: any): Book {
  if (!raw) return raw;

  return {
    ...raw,
    Author: raw.Author
      ? { name: raw.Author.name }
      : raw.author
      ? { name: raw.author }
      : null,

    Category: raw.Category
      ? { name: raw.Category.name }
      : raw.category
      ? { name: raw.category }
      : null,
  };
}
