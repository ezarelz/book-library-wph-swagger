export interface Author {
  id: number;
  name: string;
  bio?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: number;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Book {
  averageRating: number;
  id: number;
  title: string;
  author: string;
  publisher?: string;
  year?: number;
  isbn?: string;
  category: string;
  stock?: number;
  totalCopies?: number;
  availableCopies?: number;
  description?: string;
  coverImage?: string;
  rating?: number;
  createdAt?: string;
  updatedAt?: string;
  //Enrich From API
  Author?: Author;
  Category?: Category;
}

export interface BorrowedBook {
  id: number;
  bookId: number;
  userId: number;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'BORROWED' | 'RETURNED' | 'OVERDUE';
  book?: Book;
}
