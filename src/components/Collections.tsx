import React from 'react';
import { useCart } from '../context/CartContext';
import { COLLECTIONS } from '../data/collections';
import { ArrowUpRight } from 'lucide-react';

export const Collections: React.FC = () => {
  const { collections, t, language, setActiveCategory } = useCart();

  const handleSelectCollection = (categoryKey: string) => {
    setActiveCategory(categoryKey as any);
    const shopEl = document.getElementById('shop');
    if (shopEl) {
      const navOffset = 70;
      const pos = shopEl.getBoundingClientRect().top + window.pageYOffset - navOffset;
      window.scrollTo({ top: pos, behavior: 'smooth' });
    }
  };

  const items = collections && collections.length > 0 ? collections : COLLECTIONS;
  const featured = items[0] || COLLECTIONS[0];
  const secondary = items[1] || COLLECTIONS[1];
  const remaining = items.slice(2);

  return (
    <section id="collections" className="py-16 sm:py-24 bg-[#090909] text-[#F1F0EB] relative border-b border-[#1c1c1c]">
      {/* Background Section Accent */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-16 border-b border-[#222] pb-6 sm:pb-8">
          <div>
            <div className="text-[10px] sm:text-xs font-mono text-[#CEFF00] tracking-widest uppercase mb-1.5 sm:mb-2">
              // 02. EDITORIAL CATALOGUE
            </div>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight uppercase">
              {t.collections.title}
            </h2>
          </div>
          <p className="text-xs sm:text-sm font-mono text-[#888] max-w-sm mt-3 md:mt-0 tracking-wider leading-relaxed">
            {t.collections.subtitle}
          </p>
        </div>

        {/* Asymmetrical Magazine Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
          {/* Item 1 - Featured Hero Box */}
          {featured && (
            <div
              onClick={() => handleSelectCollection(featured.key)}
              className="md:col-span-8 group relative h-[340px] sm:h-[480px] md:h-[600px] overflow-hidden bg-[#141414] border border-[#222] cursor-pointer touch-manipulation active:scale-[0.99] transition-transform"
            >
              <img
                src={featured.image}
                alt={language === 'ar' ? featured.titleAr : featured.titleEn}
                className="w-full h-full object-cover object-center filter grayscale-0 sm:grayscale sm:group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#090909] via-[#090909]/45 to-transparent opacity-95 group-hover:opacity-80 transition-opacity" />

              {/* Badge */}
              <div className="absolute top-3.5 sm:top-6 start-3.5 sm:start-6 flex items-center gap-2 z-10">
                <span className="px-2.5 sm:px-3 py-1 bg-[#CEFF00] text-[#090909] text-[9px] sm:text-[10px] font-mono font-bold tracking-widest uppercase shadow-sm">
                  {language === 'ar' ? featured.seasonAr : featured.seasonEn}
                </span>
                <span className="text-[9px] sm:text-[11px] font-mono text-[#ccc] bg-[#111]/85 backdrop-blur-md px-2 sm:px-2.5 py-1 border border-[#333]">
                  {featured.itemCount} {t.collections.pieces}
                </span>
              </div>

              {/* Floating Info */}
              <div className="absolute bottom-3.5 sm:bottom-6 start-3.5 sm:start-6 end-3.5 sm:end-6 flex items-end justify-between gap-3 z-10 text-start">
                <div className="min-w-0 flex-1">
                  <h3 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight uppercase group-hover:text-[#CEFF00] transition-colors leading-tight">
                    {language === 'ar' ? featured.titleAr : featured.titleEn}
                  </h3>
                  <p className="text-xs sm:text-sm font-mono text-[#ccc] sm:text-[#aaa] mt-1 tracking-wider line-clamp-2 max-w-xl">
                    {language === 'ar' ? featured.subtitleAr : featured.subtitleEn}
                  </p>
                </div>

                <div className="w-10 sm:w-12 h-10 sm:h-12 bg-[#171717]/90 backdrop-blur-sm border border-[#333] group-hover:border-[#CEFF00] group-hover:bg-[#CEFF00] group-hover:text-[#090909] transition-all flex items-center justify-center shrink-0">
                  <ArrowUpRight className="w-4 sm:w-5 h-4 sm:h-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl:-scale-x-100" />
                </div>
              </div>
            </div>
          )}

          {/* Item 2 - Tall Side Box */}
          {secondary && (
            <div
              onClick={() => handleSelectCollection(secondary.key)}
              className="md:col-span-4 group relative h-[300px] sm:h-[480px] md:h-[600px] overflow-hidden bg-[#141414] border border-[#222] cursor-pointer touch-manipulation active:scale-[0.99] transition-transform"
            >
              <img
                src={secondary.image}
                alt={language === 'ar' ? secondary.titleAr : secondary.titleEn}
                className="w-full h-full object-cover object-center filter grayscale-0 sm:grayscale sm:group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#090909] via-[#090909]/45 to-transparent opacity-95 group-hover:opacity-80 transition-opacity" />

              <div className="absolute top-3.5 sm:top-6 start-3.5 sm:start-6 z-10">
                <span className="px-2.5 sm:px-3 py-1 bg-[#1a1a1a]/90 backdrop-blur-md text-[#F1F0EB] text-[9px] sm:text-[10px] font-mono tracking-widest uppercase border border-[#333]">
                  {language === 'ar' ? secondary.seasonAr : secondary.seasonEn}
                </span>
              </div>

              <div className="absolute bottom-3.5 sm:bottom-6 start-3.5 sm:start-6 end-3.5 sm:end-6 flex items-end justify-between gap-3 z-10 text-start">
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight uppercase group-hover:text-[#CEFF00] transition-colors leading-tight">
                    {language === 'ar' ? secondary.titleAr : secondary.titleEn}
                  </h3>
                  <p className="text-xs font-mono text-[#ccc] sm:text-[#aaa] mt-1 line-clamp-2">
                    {language === 'ar' ? secondary.subtitleAr : secondary.subtitleEn}
                  </p>
                </div>
                <div className="w-9 sm:w-10 h-9 sm:h-10 bg-[#171717]/90 backdrop-blur-sm border border-[#333] group-hover:border-[#CEFF00] group-hover:bg-[#CEFF00] group-hover:text-[#090909] transition-all flex items-center justify-center shrink-0">
                  <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl:-scale-x-100" />
                </div>
              </div>
            </div>
          )}

          {/* Bottom Grid Items */}
          {remaining.map((col) => (
            <div
              key={col.id}
              onClick={() => handleSelectCollection(col.key)}
              className="md:col-span-4 group relative h-[260px] sm:h-[340px] md:h-[380px] overflow-hidden bg-[#141414] border border-[#222] cursor-pointer touch-manipulation active:scale-[0.99] transition-transform"
            >
              <img
                src={col.image}
                alt={language === 'ar' ? col.titleAr : col.titleEn}
                className="w-full h-full object-cover object-center filter grayscale-0 sm:grayscale sm:group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#090909] via-[#090909]/50 to-transparent opacity-95 group-hover:opacity-80 transition-opacity" />

              <div className="absolute top-3 sm:top-4 start-3 sm:start-4 z-10">
                <span className="px-2.5 py-0.5 bg-[#171717]/90 backdrop-blur-md text-[#aaa] text-[9px] sm:text-[10px] font-mono tracking-widest uppercase border border-[#333]">
                  {language === 'ar' ? col.seasonAr : col.seasonEn}
                </span>
              </div>

              <div className="absolute bottom-3.5 sm:bottom-5 start-3.5 sm:start-5 end-3.5 sm:end-5 flex items-end justify-between gap-2.5 z-10 text-start">
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight uppercase group-hover:text-[#CEFF00] transition-colors leading-tight">
                    {language === 'ar' ? col.titleAr : col.titleEn}
                  </h3>
                  <p className="text-[11px] font-mono text-[#aaa] sm:text-[#888] mt-0.5 line-clamp-1">
                    {language === 'ar' ? col.subtitleAr : col.subtitleEn}
                  </p>
                </div>
                <div className="w-8 h-8 bg-[#171717]/90 backdrop-blur-sm border border-[#333] group-hover:border-[#CEFF00] group-hover:bg-[#CEFF00] group-hover:text-[#090909] transition-all flex items-center justify-center shrink-0">
                  <ArrowUpRight className="w-3.5 h-3.5 rtl:-scale-x-100" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
