import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import { CartItem, Product } from '../types';
import { products as allProducts } from '../data/products';

interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

type CartAction =
  | { type: 'ADD_ITEM'; product: Product; size: string; quantity: number }
  | { type: 'REMOVE_ITEM'; productId: string; size: string }
  | { type: 'UPDATE_QUANTITY'; productId: string; size: string; quantity: number }
  | { type: 'CLEAR_CART' }
  | { type: 'TOGGLE_CART' }
  | { type: 'CLOSE_CART' }
  | { type: 'LOAD_CART'; items: CartItem[] };

interface CartContextType extends CartState {
  addItem: (product: Product, size: string, quantity?: number) => void;
  removeItem: (productId: string, size: string) => void;
  updateQuantity: (productId: string, size: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  closeCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = 'buksy_cart';

interface StoredItem { slug: string; size: string; quantity: number; }

function toStored(items: CartItem[]): StoredItem[] {
  return items.map((i) => ({ slug: i.product.slug, size: i.size, quantity: i.quantity }));
}

function fromStored(stored: StoredItem[]): CartItem[] {
  const result: CartItem[] = [];
  for (const s of stored) {
    const product = allProducts.find((p) => p.slug === s.slug);
    if (product) {
      result.push({ product, size: s.size, quantity: s.quantity });
    }
  }
  return result;
}

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingIndex = state.items.findIndex(
        (item) => item.product.id === action.product.id && item.size === action.size
      );

      if (existingIndex >= 0) {
        const newItems = [...state.items];
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + action.quantity,
        };
        return { ...state, items: newItems, isOpen: true };
      }

      return {
        ...state,
        items: [
          ...state.items,
          { product: action.product, size: action.size, quantity: action.quantity },
        ],
        isOpen: true,
      };
    }
    case 'REMOVE_ITEM': {
      return {
        ...state,
        items: state.items.filter(
          (item) => !(item.product.id === action.productId && item.size === action.size)
        ),
      };
    }
    case 'UPDATE_QUANTITY': {
      if (action.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(
            (item) => !(item.product.id === action.productId && item.size === action.size)
          ),
        };
      }
      return {
        ...state,
        items: state.items.map((item) =>
          item.product.id === action.productId && item.size === action.size
            ? { ...item, quantity: action.quantity }
            : item
        ),
      };
    }
    case 'CLEAR_CART':
      return { ...state, items: [] };
    case 'TOGGLE_CART':
      return { ...state, isOpen: !state.isOpen };
    case 'CLOSE_CART':
      return { ...state, isOpen: false };
    case 'LOAD_CART':
      return { ...state, items: action.items };
    default:
      return state;
  }
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], isOpen: false });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: StoredItem[] = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const restored = fromStored(parsed);
          if (restored.length > 0) {
            dispatch({ type: 'LOAD_CART', items: restored });
          } else {
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStored(state.items)));
  }, [state.items]);

  const addItem = (product: Product, size: string, quantity = 1) => {
    dispatch({ type: 'ADD_ITEM', product, size, quantity });
  };

  const removeItem = (productId: string, size: string) => {
    dispatch({ type: 'REMOVE_ITEM', productId, size });
  };

  const updateQuantity = (productId: string, size: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', productId, size, quantity });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const toggleCart = () => {
    dispatch({ type: 'TOGGLE_CART' });
  };

  const closeCart = () => {
    dispatch({ type: 'CLOSE_CART' });
  };

  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = state.items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        ...state,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        toggleCart,
        closeCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
