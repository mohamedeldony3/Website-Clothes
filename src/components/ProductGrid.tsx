import React, { useState, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import { PRODUCTS } from '../data/products';
import { ProductCard } from './ProductCard';
import { ProductCategory } from '../types';
import { SlidersHorizontal, ArrowUpDown } from 'lucide-react';

export const ProductGrid: React.FC = () => {
  const { t, language, activeCategory, setActiveCategory, products, categories } = useCart();
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');

  const allCategoryTabs = useMemo(() => {
    return [
      { key: 'all', labelEn: 'ALL PIECES', labelAr: 'الكل' },
      ...categories,
    ];
  }, [categories]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (activeCategory !== 'all') {
      result = result.filter((p) => p.category === activeCategory);
    }

    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [activeCategory, sortBy, products]);

  return (
    <section id="shop" className="py-24 bg-[#090909] text-[#F1F0EB] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 border-b border-[#222] pb-6">
          <div>
            <div className="text-xs font-mono text-[#CEFF00] tracking-widest uppercase mb-2">
              // 03. APPAREL VAULT
            </div>
            <h2 className="text-4xl sm:text-6xl font-black tracking-tight uppercase">
              {t.products.title}
            </h2>
          </div>
          <p className="text-sm font-mono text-[#777] max-w-sm mt-3 md:mt-0 tracking-wider">
            {t.products.subtitle}
          </p>
        </div>

        {/* Filter Bar & Sort Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-10 pb-4 border-b border-[#1c1c1c]">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
            {allCategoryTabs.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`px-4 py-2 text-xs font-mono tracking-widest uppercase transition-all whitespace-nowrap border ${
                  activeCategory === cat.key
                    ? 'bg-[#CEFF00] text-[#090909] border-[#CEFF00] font-bold shadow-[0_0_15px_rgba(206,255,0,0.2)]'
                    : 'bg-[#121212] text-[#888] border-[#252525] hover:border-[#555] hover:text-[#F1F0EB]'
                }`}
              >
                {language === 'ar' ? cat.labelAr : cat.labelEn}
              </button>
            ))}
          </div>

          {/* Sort & Count */}
          <div className="flex items-center justify-between lg:justify-end gap-4 text-xs font-mono text-[#777]">
            <span>
              {filteredProducts.length} {language === 'ar' ? 'قطع معروضة' : 'PIECES FOUND'}
            </span>

            <div className="flex items-center gap-2 bg-[#121212] px-3 py-1.5 border border-[#252525]">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#CEFF00]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label={t.products.sortBy}
                className="bg-transparent text-[#bbb] font-mono text-xs focus:outline-none cursor-pointer"
              >
                <option value="featured" className="bg-[#141414] text-[#ccc]">
                  {t.products.sortFeatured}
                </option>
                <option value="price-asc" className="bg-[#141414] text-[#ccc]">
                  {t.products.sortPriceAsc}
                </option>
                <option value="price-desc" className="bg-[#141414] text-[#ccc]">
                  {t.products.sortPriceDesc}
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Cards Grid: 2 Columns on Mobile, 3 on Tablet/Laptop, 4 on Desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};
