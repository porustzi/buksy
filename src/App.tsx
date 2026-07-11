import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useState, useEffect, lazy, Suspense } from 'react';
import { CartProvider } from './store/CartContext';
import './i18n/i18n';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { LogoAnimation } from './components/LogoAnimation';
import { ToastContainer } from './components/Toast';

const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const ShopPage = lazy(() => import('./pages/ShopPage').then(m => ({ default: m.ShopPage })));
const ProductPage = lazy(() => import('./pages/ProductPage').then(m => ({ default: m.ProductPage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then(m => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import('./pages/ContactPage').then(m => ({ default: m.ContactPage })));
const CartPage = lazy(() => import('./pages/CartPage').then(m => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then(m => ({ default: m.CheckoutPage })));
const InfoPage = lazy(() => import('./pages/InfoPage').then(m => ({ default: m.InfoPage })));
const EditorialPage = lazy(() => import('./pages/EditorialPage').then(m => ({ default: m.EditorialPage })));

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
    >
      {children}
    </motion.div>
  );
}

function LoadingFallback() {
  return <div className="min-h-screen bg-noir" />;
}

function AppRoutes() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname]);

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<LoadingFallback />}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageWrapper><HomePage /></PageWrapper>} />
          <Route path="/shop" element={<PageWrapper><ShopPage /></PageWrapper>} />
          <Route path="/product/:slug" element={<PageWrapper><ProductPage /></PageWrapper>} />
          <Route path="/about" element={<PageWrapper><AboutPage /></PageWrapper>} />
          <Route path="/editorial" element={<PageWrapper><EditorialPage /></PageWrapper>} />
          <Route path="/contact" element={<PageWrapper><ContactPage /></PageWrapper>} />
          <Route path="/cart" element={<PageWrapper><CartPage /></PageWrapper>} />
          <Route path="/checkout" element={<PageWrapper><CheckoutPage /></PageWrapper>} />
          <Route path=":slug" element={<PageWrapper><InfoPage /></PageWrapper>} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}

function App() {
  const [showIntro, setShowIntro] = useState(() => !sessionStorage.getItem('buksy_intro_seen'));

  const handleIntroComplete = () => {
    sessionStorage.setItem('buksy_intro_seen', 'true');
    setShowIntro(false);
  };

  if (showIntro) {
    return <LogoAnimation onComplete={handleIntroComplete} />;
  }

  return (
    <CartProvider>
        <div className="flex flex-col min-h-screen bg-noir">
          <Header />
          <main className="flex-1">
            <AppRoutes />
          </main>
          <Footer />
          <CartDrawer />
          <ToastContainer />
        </div>
      </CartProvider>
  );
}

export default function AppWithRouter() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}
