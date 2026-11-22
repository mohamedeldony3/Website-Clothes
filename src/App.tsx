import React, { Suspense, lazy, useEffect } from 'react';
import { CartProvider, useCart } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Marquee } from './components/Marquee';
import { Collections } from './components/Collections';
import { ProductGrid } from './components/ProductGrid';
import { BrandStory } from './components/BrandStory';
import { Campaign } from './components/Campaign';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { SearchModal } from './components/SearchModal';
import { CustomCursor } from './components/CustomCursor';
import { AdminDashboard } from './components/AdminDashboard';

// Lazy load 3D-heavy modals and interactive fitting lab to optimize initial page load
const VirtualShowroom = lazy(() =>
  import('./components/VirtualShowroom').then((mod) => ({ default: mod.VirtualShowroom }))
);
const ProductModal = lazy(() =>
  import('./components/ProductModal').then((mod) => ({ default: mod.ProductModal }))
);

function AppContent() {
  const { isAdminOpen, setIsAdminOpen } = useCart();

  // URL Path Route Synchronization: /admin & #admin
  useEffect(() => {
    const checkRoute = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path === '/admin' || path.startsWith('/admin/') || hash === '#admin') {
        setIsAdminOpen(true);
      }
    };

    checkRoute();
    window.addEventListener('popstate', checkRoute);
    window.addEventListener('hashchange', checkRoute);
    return () => {
      window.removeEventListener('popstate', checkRoute);
      window.removeEventListener('hashchange', checkRoute);
    };
  }, [setIsAdminOpen]);

  // Sync address bar state on open/close
  useEffect(() => {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const isAtAdmin = path === '/admin' || path.startsWith('/admin/') || hash === '#admin';

    if (isAdminOpen && !isAtAdmin) {
      try {
        window.history.pushState(null, '', '/admin');
      } catch {
        window.location.hash = 'admin';
      }
    } else if (!isAdminOpen && isAtAdmin) {
      try {
        window.history.pushState(null, '', '/');
      } catch {
        window.location.hash = '';
      }
    }
  }, [isAdminOpen]);

  // Global Admin Access Shortcut: Press Ctrl + Shift + A or Alt + A
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') || (e.altKey && e.key.toLowerCase() === 'a')) {
        e.preventDefault();
        setIsAdminOpen(!isAdminOpen);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdminOpen, setIsAdminOpen]);

  return (
    <div className="min-h-screen bg-[#090909] text-[#F1F0EB] relative selection:bg-[#CEFF00] selection:text-[#090909]">
      {/* Subtle Luxury Film Grain Effect */}
      <div className="fixed inset-0 pointer-events-none film-grain z-40" />

      {/* Custom Dot Follower Cursor (Desktop) */}
      <CustomCursor />

      {/* Floating Glass Navigation */}
      <Navbar />

      {/* Main Fashion Experience */}
      <main>
        <Hero />
        <Marquee />
        <Collections />

        {/* Dedicated 3D Digital Atelier & Virtual Fitting Lab */}
        <Suspense
          fallback={
            <div className="py-24 bg-[#0a0a0a] text-center text-xs font-mono text-[#777] tracking-widest uppercase">
              LOADING 3D ATELIER ENVIRONMENT...
            </div>
          }
        >
          <VirtualShowroom />
        </Suspense>

        <ProductGrid />
        <BrandStory />
        <Campaign />
      </main>

      {/* Luxury Brutalist Footer */}
      <Footer />

      {/* Dedicated Interactive Modals & Admin Studio Command Center */}
      <AdminDashboard />
      <Suspense fallback={null}>
        <ProductModal />
      </Suspense>
      <CartDrawer />
      <CheckoutModal />
      <SearchModal />
    </div>
  );
}

export function App() {
  return (
    <CartProvider>
      <AppContent />
    </CartProvider>
  );
}

export default App;
