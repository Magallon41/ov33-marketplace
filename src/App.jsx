import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { CartDrawer } from './components/cart/CartDrawer';
import { Home } from './pages/Home';
import { Catalog } from './pages/Catalog';
import { ProductDetail } from './pages/ProductDetail';
import { About } from './pages/About';
import { Auth } from './pages/Auth';
import { Account } from './pages/Account';
import { Checkout } from './pages/Checkout';
import { AdminDashboard } from './pages/AdminDashboard';
import { Tracking } from './pages/Tracking';
import { Shipping } from './pages/Shipping';
import { Privacy } from './pages/Privacy';
import { SizeGuide } from './pages/SizeGuide';
import { Magazine } from './pages/Magazine';
import { ArticleDetail } from './pages/ArticleDetail';
import { Wholesale } from './pages/Wholesale';
import { Offers } from './pages/Offers';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { useProducts } from './context/ProductContext';
import { useAuth } from './context/AuthContext';

function App() {
  const { isUsingFallback } = useProducts();
  const { currentUser } = useAuth();

  const adminBannerActive = currentUser && currentUser.role === 'admin';
  const fallbackBannerActive = isUsingFallback;

  let bannerOffset = 0;
  if (adminBannerActive && fallbackBannerActive) {
    bannerOffset = 64;
  } else if (adminBannerActive || fallbackBannerActive) {
    bannerOffset = 32;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background" style={{ paddingTop: `${bannerOffset}px` }}>
      <Navbar />
      <CartDrawer />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/account" element={<Account />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/admin" element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/tracking" element={<Tracking />} />
          <Route path="/shipping" element={<Shipping />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/size-guide" element={<SizeGuide />} />
          <Route path="/revista" element={<Magazine />} />
          <Route path="/revista/:slug" element={<ArticleDetail />} />
          <Route path="/mayoristas" element={<Wholesale />} />
          <Route path="/ofertas" element={<Offers />} />
          <Route path="/offers" element={<Offers />} />
        </Routes>
      </div>

      <Footer />
    </div>
  );
}

export default App;
