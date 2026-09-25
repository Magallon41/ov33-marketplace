import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useProducts, getProductStock } from './ProductContext';

const CartContext = createContext();

export function CartProvider({ children }) {
  const { currentUser } = useAuth();
  const { products } = useProducts();
  const [items, setItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [cartNotice, setCartNotice] = useState(null);
  const isLoadedRef = useRef(false);

  // Determine active storage key
  const getStorageKey = () => {
    return currentUser ? `ov33_cart_${currentUser.id}` : 'ov33_cart_guest';
  };

  // 1. Handle user login/logout & cart merging
  useEffect(() => {
    const key = getStorageKey();
    const storedCart = localStorage.getItem(key);
    let activeItems = storedCart ? JSON.parse(storedCart) : [];

    // If a user just logged in, check if there's a guest cart to merge
    if (currentUser) {
      const guestCart = localStorage.getItem('ov33_cart_guest');
      if (guestCart) {
        const guestItems = JSON.parse(guestCart);
        if (guestItems.length > 0) {
          // Merge guest items into active user items
          const merged = [...activeItems];
          guestItems.forEach(guestItem => {
            const existing = merged.find(i => 
              i.id === guestItem.id &&
              i.selectedSize === guestItem.selectedSize &&
              i.selectedColor === guestItem.selectedColor
            );
            if (existing) {
              existing.quantity += guestItem.quantity;
            } else {
              merged.push(guestItem);
            }
          });
          activeItems = merged;
          // Clear guest cart
          localStorage.removeItem('ov33_cart_guest');
        }
      }
    }

    setItems(activeItems);
    isLoadedRef.current = true;
  }, [currentUser]);

  // 2. Persist items to correct key when items change
  useEffect(() => {
    if (!isLoadedRef.current) return;
    const key = getStorageKey();
    localStorage.setItem(key, JSON.stringify(items));
  }, [items, currentUser]);

  const addItem = (product, quantityToAdd = 1) => {
    if (!product) return { success: false, message: 'Producto no válido' };

    const selectedSize = product.selectedSize || "M";
    const selectedColor = product.selectedColor || null;
    const qty = Math.max(1, Number(quantityToAdd) || 1);

    // Obtener producto y stock real actual
    const realProduct = (products && products.length > 0) 
      ? (products.find(p => p.id === product.id) || product)
      : product;
      
    const availableStock = getProductStock(realProduct, selectedSize, selectedColor);

    if (availableStock <= 0) {
      const msg = `Lo sentimos, "${product.name}" está agotado en talla ${selectedSize}.`;
      setCartNotice(msg);
      return { success: false, message: msg };
    }

    const cleanItems = (items || []).filter(Boolean);
    const existing = cleanItems.find(item => 
      item.id === product.id && 
      item.selectedSize === selectedSize && 
      item.selectedColor === selectedColor
    );

    const currentQtyInCart = existing ? (existing.quantity || 0) : 0;
    
    if (currentQtyInCart >= availableStock) {
      const msg = `Ya tienes el stock máximo disponible (${availableStock} pzs) de este modelo en tu bolsa.`;
      setCartNotice(msg);
      return { success: false, message: msg };
    }

    const finalQuantity = Math.min(availableStock, currentQtyInCart + qty);

    setItems(currentItems => {
      const list = (currentItems || []).filter(Boolean);
      if (existing) {
        return list.map(item => 
          (item.id === product.id && 
           item.selectedSize === selectedSize && 
           item.selectedColor === selectedColor)
            ? { ...item, quantity: finalQuantity } 
            : item
        );
      }
      return [...list, { ...product, selectedSize, selectedColor, quantity: finalQuantity }];
    });

    setCartNotice(null);
    setIsOpen(true);
    return { success: true };
  };

  const removeItem = (id, selectedSize, selectedColor) => {
    setItems(currentItems => 
      (currentItems || []).filter(Boolean).filter(item => 
        !(item.id === id && 
          item.selectedSize === selectedSize && 
          item.selectedColor === selectedColor)
      )
    );
    setCartNotice(null);
  };

  const updateQuantity = (id, selectedSize, selectedColor, quantity) => {
    if (quantity < 1) {
      removeItem(id, selectedSize, selectedColor);
      return { success: true };
    }

    const realProduct = (products && products.length > 0) 
      ? products.find(p => p.id === id)
      : null;

    if (realProduct) {
      const availableStock = getProductStock(realProduct, selectedSize, selectedColor);
      
      if (availableStock <= 0) {
        removeItem(id, selectedSize, selectedColor);
        setCartNotice(`El producto ha quedado agotado y fue removido de tu bolsa.`);
        return { success: false, message: 'Producto agotado' };
      }

      if (quantity > availableStock) {
        // Limitar al stock máximo disponible
        setItems(currentItems => 
          (currentItems || []).filter(Boolean).map(item => 
            (item.id === id && 
             item.selectedSize === selectedSize && 
             item.selectedColor === selectedColor) 
              ? { ...item, quantity: availableStock } 
              : item
          )
        );
        const msg = `Solo hay ${availableStock} pieza(s) disponible(s) de este modelo.`;
        setCartNotice(msg);
        return { success: false, message: msg };
      }
    }

    setItems(currentItems => 
      (currentItems || []).filter(Boolean).map(item => 
        (item.id === id && 
         item.selectedSize === selectedSize && 
         item.selectedColor === selectedColor) 
          ? { ...item, quantity } 
          : item
      )
    );
    setCartNotice(null);
    return { success: true };
  };

  const clearCart = () => {
    setItems([]);
    const key = getStorageKey();
    localStorage.removeItem(key);
  };

  const totalItems = (items || []).filter(Boolean).reduce((sum, item) => sum + (item.quantity || 0), 0);
  
  // Parse string price safely to number for total calculation
  const subtotal = (items || []).filter(Boolean).reduce((sum, item) => {
    if (!item.price) return sum;
    const priceStr = String(item.price);
    const numericPrice = Number(priceStr.replace(/,/g, '')) || 0;
    return sum + (numericPrice * (item.quantity || 0));
  }, 0);

  return (
    <CartContext.Provider value={{
      items: (items || []).filter(Boolean),
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      isOpen,
      setIsOpen,
      totalItems,
      subtotal,
      cartNotice,
      setCartNotice
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
