export const CART_KEY = 'fake_cart';

export const getCart = () => {
  if (typeof window === 'undefined') return [];

  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  } catch {
    return [];
  }
};

export const saveCart = (items) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CART_KEY, JSON.stringify(items));
};

export const addToCartLocal = (book) => {
  const cart = getCart();

  const exists = cart.some((i) => i.id === book.id);
  if (!exists) {
    cart.push(book);
  }

  saveCart(cart);
  return cart;
};

export const removeFromCartLocal = (bookId) => {
  const cart = getCart().filter((i) => i.id !== bookId);
  saveCart(cart);
  return cart;
};

export const clearCartLocal = () => {
  saveCart([]);
};
