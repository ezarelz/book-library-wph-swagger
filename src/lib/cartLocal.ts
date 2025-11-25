export const CART_KEY = 'fake_cart';

export interface CartItem {
  id: number;
  title: string;
  author?: string;
  category?: string;
  coverImage?: string;
  availableCopies?: number;
}

export const getCart = (): CartItem[] => {
  if (typeof window === 'undefined') return [];

  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  } catch {
    return [];
  }
};

export const saveCart = (items: CartItem[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CART_KEY, JSON.stringify(items));

  // Dispatch custom event for same-tab cart updates
  window.dispatchEvent(new CustomEvent('cartUpdated', { detail: items }));
};

export const addToCartLocal = (book: CartItem): CartItem[] => {
  const cart = getCart();

  const exists = cart.some((i) => i.id === book.id);
  if (!exists) {
    cart.push(book);
  }

  saveCart(cart);
  return cart;
};

export const removeFromCartLocal = (bookId: number): CartItem[] => {
  const cart = getCart().filter((i) => i.id !== bookId);
  saveCart(cart);
  return cart;
};

export const clearCartLocal = (): void => {
  saveCart([]);
};
