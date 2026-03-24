import React, { createContext, useContext, useState, useMemo } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [saleType, setSaleType] = useState('retail'); // 'retail' or 'wholesale'

  const addToCart = (product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product_id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product_id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { ...product, product_id: product.id, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(item => item.product_id !== productId));
  };

  const updateQuantity = (productId, delta) => {
    setCartItems(prev => prev.map(item => {
      if (item.product_id === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const clearCart = () => setCartItems([]);

  const toggleSaleType = () => {
    setSaleType(prev => prev === 'retail' ? 'wholesale' : 'retail');
  };

  const cartTotal = useMemo(() => {
    return cartItems.reduce((total, item) => {
      const price = saleType === 'wholesale' ? item.wholesale_price : item.retail_price;
      return total + (price * item.quantity);
    }, 0);
  }, [cartItems, saleType]);

  return (
    <CartContext.Provider value={{
      cartItems,
      saleType,
      setSaleType,
      toggleSaleType,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartTotal
    }}>
      {children}
    </CartContext.Provider>
  );
};
