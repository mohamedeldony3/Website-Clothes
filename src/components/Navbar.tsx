import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { ShoppingBag, Search, Heart, Menu, X, Globe } from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    t,
    language,
    toggleLanguage,
    totalItemCount,
    setIsCartOpen,
    setIsSearchOpen,
    wishlist
  } = useCart();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const navHeight = 70;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navHeight;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? 'bg-[#090909]/85 backdrop-blur-xl border-b border-[#1f1f1f] py-3.5 shadow-[0_10px_30px_rgba(0,0,0,0.8)]'
            : 'bg-gradient-to-b from-[#090909]/90 via-[#090909]/40 to-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Left: Brand Logo */}
            <div className="flex items-center gap-3">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="group flex items-center gap-2 tracking-tighter"
              >
                <div className="w-2.5 h-2.5 bg-[#CEFF00] group-hover:scale-125 transition-transform duration-300" />
                <span className="font-extrabold text-lg sm:text-xl tracking-widest text-[#F1F0EB] group-hover:text-white uppercase">
                  MONO <span className="text-[#CEFF00]">/</span> STUDIO
                </span>
              </a>
              <span className="hidden xl:inline-block text-[10px] font-mono tracking-widest text-[#666] border-l border-[#262626] pl-3 ml-1 uppercase">
                CAIRO LAB
              </span>
            </div>

            {/* Center: Desktop Nav Links */}
            <nav className="hidden md:flex items-center gap-7 lg:gap-8">
              <button
                onClick={() => scrollToSection('shop')}
                className="text-xs font-mono tracking-widest text-[#898989] hover:text-[#CEFF00] uppercase transition-colors"
              >
                {t.nav.shop}
              </button>
              <button
                onClick={() => scrollToSection('collections')}
                className="text-xs font-mono tracking-widest text-[#898989] hover:text-[#CEFF00] uppercase transition-colors"
              >
                {t.nav.collection}
              </button>
              <button
                onClick={() => scrollToSection('fitting-lab')}
                className="text-xs font-mono tracking-widest text-[#CEFF00] hover:text-white uppercase transition-colors flex items-center gap-1.5 px-2 py-0.5 border border-[#CEFF00]/40 bg-[#CEFF00]/10"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#CEFF00] animate-ping" />
                <span>3D LAB</span>
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className="text-xs font-mono tracking-widest text-[#898989] hover:text-[#CEFF00] uppercase transition-colors"
              >
                {t.nav.about}
              </button>
              <button
                onClick={() => scrollToSection('campaign')}
                className="text-xs font-mono tracking-widest text-[#898989] hover:text-[#CEFF00] uppercase transition-colors"
              >
                {t.nav.campaign}
              </button>
            </nav>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5 sm:gap-3">
              {/* Language Switcher */}
              <button
                onClick={toggleLanguage}
                title="Switch Language (English / العربية)"
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-mono tracking-wider border border-[#2a2a2a] bg-[#141414]/70 hover:border-[#CEFF00] text-[#ccc] hover:text-white transition-all"
              >
                <Globe className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-[#CEFF00]" />
                <span>{language === 'en' ? 'عربي' : 'EN'}</span>
              </button>

              {/* Search Toggle */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-1.5 sm:p-2 text-[#898989] hover:text-[#F1F0EB] hover:bg-[#1a1a1a] transition-all"
                aria-label="Search"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Wishlist Indicator */}
              <button
                onClick={() => scrollToSection('shop')}
                className="relative p-2 text-[#898989] hover:text-[#F1F0EB] hover:bg-[#1a1a1a] transition-all hidden sm:block"
                aria-label="Wishlist"
              >
                <Heart className={`w-4 h-4 ${wishlist.length > 0 ? 'text-[#CEFF00] fill-[#CEFF00]/20' : ''}`} />
                {wishlist.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#CEFF00]" />
                )}
              </button>

              {/* Shopping Bag Button */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 bg-[#171717] hover:bg-[#202020] border border-[#2c2c2c] hover:border-[#CEFF00] transition-all group"
                aria-label="Cart"
              >
                <ShoppingBag className="w-4 h-4 text-[#F1F0EB] group-hover:text-[#CEFF00] transition-colors" />
                <span className="text-xs font-mono font-bold tracking-wider text-[#F1F0EB]">
                  {totalItemCount}
                </span>
                {totalItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#CEFF00] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#CEFF00]"></span>
                  </span>
                )}
              </button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 sm:p-2 text-[#F1F0EB] md:hidden hover:bg-[#1a1a1a] transition-all"
                aria-label="Toggle Mobile Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Fullscreen Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-[#090909]/98 backdrop-blur-2xl flex flex-col justify-between p-6 pt-24 md:hidden border-b border-[#222]">
          <div className="space-y-6">
            <div className="text-[10px] font-mono tracking-widest text-[#555] uppercase">
              // INDEX NAVIGATION
            </div>
            <nav className="flex flex-col space-y-4">
              <button
                onClick={() => scrollToSection('shop')}
                className="text-2xl font-bold tracking-tight text-start text-[#F1F0EB] hover:text-[#CEFF00] transition-colors flex items-center justify-between border-b border-[#1c1c1c] pb-3"
              >
                <span>{t.nav.shop}</span>
                <span className="text-xs font-mono text-[#555]">01</span>
              </button>
              <button
                onClick={() => scrollToSection('collections')}
                className="text-2xl font-bold tracking-tight text-start text-[#F1F0EB] hover:text-[#CEFF00] transition-colors flex items-center justify-between border-b border-[#1c1c1c] pb-3"
              >
                <span>{t.nav.collection}</span>
                <span className="text-xs font-mono text-[#555]">02</span>
              </button>
              <button
                onClick={() => scrollToSection('fitting-lab')}
                className="text-2xl font-bold tracking-tight text-start text-[#CEFF00] hover:text-white transition-colors flex items-center justify-between border-b border-[#1c1c1c] pb-3"
              >
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#CEFF00] animate-ping" />
                  <span>3D FITTING LAB</span>
                </span>
                <span className="text-xs font-mono text-[#CEFF00]">03</span>
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className="text-2xl font-bold tracking-tight text-start text-[#F1F0EB] hover:text-[#CEFF00] transition-colors flex items-center justify-between border-b border-[#1c1c1c] pb-3"
              >
                <span>{t.nav.about}</span>
                <span className="text-xs font-mono text-[#555]">04</span>
              </button>
              <button
                onClick={() => scrollToSection('campaign')}
                className="text-2xl font-bold tracking-tight text-start text-[#F1F0EB] hover:text-[#CEFF00] transition-colors flex items-center justify-between border-b border-[#1c1c1c] pb-3"
              >
                <span>{t.nav.campaign}</span>
                <span className="text-xs font-mono text-[#555]">05</span>
              </button>
            </nav>
          </div>

          <div className="border-t border-[#1a1a1a] pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#777] uppercase">Language</span>
              <button
                onClick={toggleLanguage}
                className="px-3 py-1.5 text-xs font-mono border border-[#333] bg-[#141414] text-[#CEFF00]"
              >
                {language === 'en' ? 'Switch to العربية' : 'Switch to English'}
              </button>
            </div>
            <div className="text-[11px] font-mono text-[#555] tracking-widest">
              MONO / STUDIO LAB • CAIRO EGYPT (UTC+2)
            </div>
          </div>
        </div>
      )}
    </>
  );
};
