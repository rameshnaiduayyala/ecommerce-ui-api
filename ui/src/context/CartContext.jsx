import { createContext, useContext, useState, useEffect } from 'react';
import * as cartApi from '../api/cart';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [cartId, setCartId] = useState(() => localStorage.getItem('jwt_cart_id'));
  const [loading, setLoading] = useState(false);

  const formatBackendItems = (items) => {
    return items.map(item => {
      const prod = item.variant?.product || {};
      const variant = item.variant || {};
      
      // Determine image URL from product images or variant images
      let imgUrl = null;
      if (prod.images && prod.images.length > 0) {
        imgUrl = prod.images[0].url;
      } else if (variant.images && variant.images.length > 0) {
        imgUrl = variant.images[0].url;
      }

      return {
        id: prod.id,
        name: prod.name,
        price: Number(variant.price || prod.basePrice),
        discount_price: prod.discountPrice ? Number(prod.discountPrice) : null,
        image_url: imgUrl,
        quantity: item.quantity,
        variantId: variant.id,
        itemId: item.id
      };
    });
  };

  const syncCart = async () => {
    setLoading(true);
    try {
      if (user) {
        const guestId = localStorage.getItem('jwt_cart_id');
        if (guestId) {
          const merged = await cartApi.mergeCart(guestId);
          localStorage.removeItem('jwt_cart_id');
          setCartId(null);
          setCartItems(formatBackendItems(merged?.items || []));
          return;
        }

        const backendCart = await cartApi.getCart();
        setCartId(backendCart?.id || null);
        setCartItems(formatBackendItems(backendCart?.items || []));
      } else {
        const guestId = localStorage.getItem('jwt_cart_id');
        if (guestId) {
          const backendCart = await cartApi.getCart(guestId);
          setCartId(backendCart?.id || null);
          setCartItems(formatBackendItems(backendCart?.items || []));
        } else {
          setCartId(null);
          setCartItems([]);
        }
      }
    } catch (err) {
      console.warn("Cart synchronization failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncCart();

    window.addEventListener('auth_login_event', syncCart);
    window.addEventListener('auth_logout_event', syncCart);
    return () => {
      window.removeEventListener('auth_login_event', syncCart);
      window.removeEventListener('auth_logout_event', syncCart);
    };
  }, [user]);

  const addToCart = async (product, quantity = 1) => {
    const variantId = product.variants?.[0]?.id || product.variantId;
    if (!variantId) {
      console.error("No variant found for product:", product);
      return;
    }

    try {
      const activeCartId = !user ? localStorage.getItem('jwt_cart_id') : null;
      const res = await cartApi.addToCart(variantId, quantity, activeCartId);
      if (res) {
        if (!user && res.id) {
          localStorage.setItem('jwt_cart_id', res.id);
          setCartId(res.id);
        }
        setCartItems(formatBackendItems(res.items || []));
      }
    } catch (err) {
      console.error("Failed adding to cart:", err);
      setCartItems(prev => {
        const existing = prev.find(item => item.id === product.id);
        if (existing) {
          return prev.map(item => 
            item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
          );
        }
        return [...prev, { ...product, quantity, variantId }];
      });
    }
  };

  const removeFromCart = async (productId) => {
    const item = cartItems.find(i => i.id === productId);
    if (!item || !item.itemId) {
      setCartItems(prev => prev.filter(i => i.id !== productId));
      return;
    }

    try {
      await cartApi.removeCartItem(item.itemId);
      setCartItems(prev => prev.filter(i => i.id !== productId));
    } catch (err) {
      console.error("Failed removing from cart:", err);
      setCartItems(prev => prev.filter(i => i.id !== productId));
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    const item = cartItems.find(i => i.id === productId);
    if (!item || !item.itemId) {
      setCartItems(prev => prev.map(i => i.id === productId ? { ...i, quantity } : i));
      return;
    }

    try {
      await cartApi.updateCartItem(item.itemId, quantity);
      setCartItems(prev => prev.map(i => i.id === productId ? { ...i, quantity } : i));
    } catch (err) {
      console.error("Failed updating quantity:", err);
      alert(err.message || "Failed to update quantity. Check stock levels.");
    }
  };

  const clearCart = async () => {
    for (const item of cartItems) {
      if (item.itemId) {
        try {
          await cartApi.removeCartItem(item.itemId);
        } catch {}
      }
    }
    setCartItems([]);
  };

  const cartTotal = cartItems.reduce((total, item) => {
    const price = item.discount_price || item.price;
    return total + (price * item.quantity);
  }, 0);

  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  const value = {
    cartId,
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
    cartCount,
    loading
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);
