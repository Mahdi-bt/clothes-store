import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Product, ProductVariant } from '@/types';

interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
  size: string;
  color: string;
  product?: Product;
  variant?: ProductVariant;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'product' | 'variant'>) => void;
  removeItem: (productId: string, variantId: string) => void;
  updateQuantity: (productId: string, variantId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  deliveryCost: number;
  total: number;
  totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const [items, setItems] = useState<CartItem[]>([]);
  const [deliveryCost, setDeliveryCost] = useState(0);

  // Calculate total items
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setItems(JSON.parse(savedCart));
    }

    // Load delivery cost from localStorage
    const savedDeliveryCost = localStorage.getItem('deliveryCost');
    if (savedDeliveryCost) {
      setDeliveryCost(JSON.parse(savedDeliveryCost));
    }
  }, []);

  useEffect(() => {
    // Save cart to localStorage whenever it changes
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addItem = (item: Omit<CartItem, 'product' | 'variant'>) => {
    setItems(currentItems => {
      const existingItemIndex = currentItems.findIndex(
        i => i.productId === item.productId && i.variantId === item.variantId
      );

      let newItems;
      if (existingItemIndex > -1) {
        newItems = [...currentItems];
        newItems[existingItemIndex].quantity += item.quantity;
        toast.success(t('cart.success.quantityUpdated'));
      } else {
        newItems = [...currentItems, item];
        toast.success(t('cart.success.itemAdded'));
      }

      // Save to localStorage immediately
      localStorage.setItem('cart', JSON.stringify(newItems));
      return newItems;
    });
  };

  const removeItem = (productId: string, variantId: string) => {
    setItems(currentItems => {
      const newItems = currentItems.filter(
        item => !(item.productId === productId && item.variantId === variantId)
      );
      toast.info(t('cart.success.itemRemoved'));
      return newItems;
    });
  };

  const updateQuantity = (productId: string, variantId: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(productId, variantId);
      return;
    }

    setItems(currentItems =>
      currentItems.map(item =>
        item.productId === productId && item.variantId === variantId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    toast.success(t('cart.success.cleared'));
  };

  const subtotal = items.reduce((total, item) => {
    // This will be calculated in the CartPage component where we have access to product prices
    return total;
  }, 0);

  const total = subtotal + deliveryCost;

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        subtotal,
        deliveryCost,
        total,
        totalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
