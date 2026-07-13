import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import CategoriesPage from './pages/CategoriesPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import WishlistPage from './pages/WishlistPage';
import SearchResultsPage from './pages/SearchResultsPage';
import NotFoundPage from './pages/NotFoundPage';
import PrintPackingSlip from './pages/PrintPackingSlip';
import PrintInvoice from './pages/PrintInvoice';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import TestNotificationsPage from './pages/TestNotificationsPage';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const routeTitles = {
  '/': 'Home',
  '/products': 'Sweets & Delicacies',
  '/categories': 'Categories',
  '/cart': 'Shopping Cart',
  '/checkout': 'Checkout',
  '/orders': 'My Orders',
  '/login': 'Login',
  '/register': 'Register',
  '/profile': 'My Profile',
  '/admin': 'Admin Dashboard',
  '/wishlist': 'My Wishlist',
  '/search': 'Search Results',
  '/test-notifications': 'Test Notifications',
};

const getTitleFromPath = (pathname) => {
  if (pathname === '/') return 'Aha Konaseema | Traditional Godavari Sweets';
  
  if (pathname.startsWith('/products/')) {
    return 'Product Details | Aha Konaseema';
  }
  if (pathname.startsWith('/print/packing-slip/')) {
    return 'Fulfillment Packing Slip | Aha Konaseema';
  }
  if (pathname.startsWith('/print/invoice/')) {
    return 'Purchase Invoice Receipt | Aha Konaseema';
  }

  const baseTitle = routeTitles[pathname];
  if (baseTitle) {
    return `${baseTitle} | Aha Konaseema`;
  }
  
  // Format segments like /about-us to "About Us | Aha Konaseema"
  const segment = pathname.split('/').filter(Boolean)[0];
  if (segment) {
    const formatted = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    return `${formatted} | Aha Konaseema`;
  }

  return 'Aha Konaseema';
};

function TitleUpdater() {
  const location = useLocation();

  useEffect(() => {
    document.title = getTitleFromPath(location.pathname);
  }, [location.pathname]);

  return null;
}

function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <CartProvider>
          <BrowserRouter>
            <TitleUpdater />
            <Routes>
              {/* Dedicated Print Routes WITHOUT MainLayout wrapper */}
              <Route path="/print/packing-slip/:orderId" element={<PrintPackingSlip />} />
              <Route path="/print/invoice/:orderId" element={<PrintInvoice />} />

              {/* Standard Application Routes wrapping with MainLayout */}
              <Route path="*" element={
                <MainLayout>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/products/:id" element={<ProductDetailsPage />} />
                    <Route path="/categories" element={<CategoriesPage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/orders" element={<OrdersPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                    <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><AdminDashboard /></ProtectedRoute>} />
                    <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
                    <Route path="/search" element={<SearchResultsPage />} />
                    <Route path="/test-notifications" element={<TestNotificationsPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </MainLayout>
              } />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </CurrencyProvider>
    </AuthProvider>
  );
}

export default App;