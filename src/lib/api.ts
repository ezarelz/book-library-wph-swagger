/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';

// Normalize book object from backend
const normalizeBook = (book: any) => {
  if (!book) return book;

  const available = book.availableCopies ?? book.totalCopies ?? 0;

  return {
    ...book,

    // Override stock agar BE tidak reject
    stock: available,

    availableCopies: available,
    totalCopies: book.totalCopies ?? available,
  };
};

// Normalize array of books
const normalizeBooks = (data: any[]) => data.map(normalizeBook);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

//  Request Interceptor – inject token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

//  Response Interceptor – auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

/* ================================
   AUTH API
================================ */
export const authApi = {
  login: async (email: string, password: string) => {
    const res = await api.post('/api/auth/login', { email, password });
    return res.data;
  },

  register: async (name: string, email: string, password: string) => {
    const res = await api.post('/api/auth/register', {
      name,
      email,
      password,
    });
    return res.data;
  },
};

/* ================================
   BOOKS API (FIXED)
================================ */
export const booksApi = {
  getAll: async (params?: {
    categoryId?: number;
    authorId?: number;
    q?: string;
    page?: number;
    limit?: number;
  }) => {
    const res = await api.get('/api/books', { params });

    const books = res.data?.data?.books ?? [];
    const pagination = res.data?.data?.pagination ?? null;

    return {
      ...res.data,
      data: {
        books: normalizeBooks(books),
        pagination,
      },
    };
  },

  getById: async (id: number) => {
    const res = await api.get(`/api/books/${id}`);

    return {
      ...res.data,
      data: normalizeBook(res.data?.data),
    };
  },

  getRecommend: async () => {
    const res = await api.get('/api/books/recommend');

    const books = res.data?.data?.books ?? res.data?.data ?? [];

    return {
      ...res.data,
      data: normalizeBooks(books),
    };
  },

  create: async (data: any) => {
    const res = await api.post('/api/books', data);
    return {
      ...res.data,
      data: normalizeBook(res.data.data),
    };
  },

  update: async (id: number, data: any) => {
    const res = await api.put(`/api/books/${id}`, data);
    return {
      ...res.data,
      data: normalizeBook(res.data.data),
    };
  },

  delete: async (id: number) => {
    const res = await api.delete(`/api/books/${id}`);
    return res.data;
  },
};

/* ================================
   BORROW / LOANS API
================================ */
export const borrowApi = {
  borrowBook: async (bookId: number, days: number = 7) => {
    const res = await api.post('/api/loans', { bookId, days });
    return res.data;
  },

  getMyBorrowedBooks: async () => {
    const res = await api.get('/api/loans/my');
    return res.data;
  },

  returnBook: async (loanId: number) => {
    const res = await api.patch(`/api/loans/${loanId}/return`);
    return res.data;
  },
};

/* ================================
   AUTHORS API (NEW)
================================ */
export const authorsApi = {
  getAll: async () => {
    const res = await api.get('/api/authors');

    // Swagger kamu:
    // { success, message, data: { authors: [...] } }
    return res.data.data.authors;
  },

  getBooksByAuthor: async (id: number) => {
    const res = await api.get(`/api/authors/${id}/books`);
    return res.data;
  },

  create: async (data: any) => {
    const res = await api.post('/api/authors', data);
    return res.data;
  },

  update: async (id: number, data: any) => {
    const res = await api.put(`/api/authors/${id}`, data);
    return res.data;
  },

  delete: async (id: number) => {
    const res = await api.delete(`/api/authors/${id}`);
    return res.data;
  },
};

/* ================================
   CART API
================================ */
export const cartApi = {
  getCart: async () => {
    const res = await api.get('/api/cart');
    return res.data;
  },

  addItem: async (bookId: number, quantity: number = 1) => {
    const res = await api.post('/api/cart/items', { bookId, qty: quantity });
    return res.data;
  },

  updateItem: async (itemId: number, quantity: number) => {
    const res = await api.patch(`/api/cart/items/${itemId}`, { qty: quantity });
    return res.data;
  },

  removeItem: async (itemId: number) => {
    const res = await api.delete(`/api/cart/items/${itemId}`);
    return res.data;
  },

  clearCart: async () => {
    const res = await api.delete('/api/cart');
    return res.data;
  },
};

/* ================================
   CATEGORIES API
================================ */
export const categoriesApi = {
  getAll: async () => {
    const res = await api.get('/api/categories');
    return res.data;
  },
};

/* ================================
   ADMIN API
================================ */
export const adminApi = {
  getUsers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => {
    const res = await api.get('/api/admin/users', { params });
    return res.data;
  },

  getAllLoans: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) => {
    // For overdue loans, use the specific endpoint
    if (params?.status === 'OVERDUE') {
      const res = await api.get('/api/admin/loans/overdue', {
        params: { page: params.page, limit: params.limit },
      });
      return res.data;
    }
    // For admin, use /api/loans/my which works with admin token

    const res = await api.get('/api/loans/my', {
      params: {
        page: params?.page,
        limit: params?.limit,
      },
    });
    return res.data;
  },

  getOverdueLoans: async (params?: { page?: number; limit?: number }) => {
    const res = await api.get('/api/admin/loans/overdue', { params });
    return res.data;
  },

  getOverview: async () => {
    const res = await api.get('/api/admin/overview');
    return res.data;
  },
};

/* ================================
   USER API
================================ */
export const userApi = {
  getProfile: async () => {
    const res = await api.get('/api/me');
    return res.data;
  },

  updateProfile: async (data: { name?: string; email?: string }) => {
    const res = await api.patch('/api/me', data);
    return res.data;
  },

  getMyLoans: async () => {
    const res = await api.get('/api/me/loans');
    return res.data;
  },

  getMyReviews: async () => {
    const res = await api.get('/api/me/reviews');
    return res.data;
  },
};
