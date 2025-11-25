// src/lib/api/reviewsApi.ts
import { api } from '../api';

/* -------------------------------------------------------------------------- */
/*                                Review Types                                */
/* -------------------------------------------------------------------------- */

export interface ReviewBookAuthor {
  name: string;
}

export interface ReviewBookCategory {
  name: string;
}

export interface ReviewBook {
  id: number;
  title: string;
  coverImage?: string;

  // Author bisa datang dari dua struktur:
  // { Author: { name } } atau { author: { name } } atau string
  Author?: ReviewBookAuthor | null;
  author?: ReviewBookAuthor | string | null;

  // Category juga bisa string atau object
  Category?: string | ReviewBookCategory | null;
}

export interface Review {
  id: number;
  bookId: number;
  star: number;
  comment: string;
  createdAt: string;

  // Data buku minimal dari /me/reviews
  Book?: ReviewBook | null;
}

/* -------------------------------------------------------------------------- */
/*                           Create Review Payload                            */
/* -------------------------------------------------------------------------- */

export interface CreateReviewDto {
  bookId: number;
  star: number;
  comment: string;
}

/* -------------------------------------------------------------------------- */
/*                                  API Calls                                 */
/* -------------------------------------------------------------------------- */

export const reviewsApi = {
  /**
   * Create a review for a book
   */
  createReview: async (data: CreateReviewDto) => {
    const res = await api.post('/api/reviews', data);
    return res.data;
  },

  /**
   * Get authenticated user's reviews (minimal data)
   * Includes Book: { id, title, coverImage }
   */
  getMyReviews: async (params?: { page?: number; limit?: number }) => {
    const res = await api.get('/api/me/reviews', { params });
    return res.data;
  },

  /**
   * Delete a review by ID
   */
  deleteReview: async (id: number) => {
    const res = await api.delete(`/api/reviews/${id}`);
    return res.data;
  },
};
