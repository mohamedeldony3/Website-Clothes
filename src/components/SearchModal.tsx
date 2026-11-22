import React, { useState, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import { Search, X, ArrowRight } from 'lucide-react';

export const SearchModal: React.FC = () => {
  const { isSearchOpen, setIsSearchOpen, setSelectedProduct, formatPrice, language, products } = useCart();
  const [query, setQuery] = useState('');

  const trendingTags = ['Hoodie', 'Oversized', '520 GSM', 'Cargo', 'Jacket', 'Boxy Tee', 'Cairo'];

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.nameAr.includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.descriptionAr.includes(q)
    );
  }, [query, products]);

  if (!isSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-start pt-20 px-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-[#0f0f0f] border border-[#262626] shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Search Input Bar */}
        <div className="flex items-center gap-4 border-b border-[#282828] pb-4">
          <Search className="w-5 h-5 text-[#CEFF00]" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={language === 'ar' ? 'ابحث بالاسم، الخامة، أو نوع القطعة...' : 'SEARCH PIECES, FABRIC, OR CODE...'}
            className="w-full bg-transparent text-lg sm:text-xl font-mono text-white placeholder-[#555] focus:outline-none"
          />
          <button
            onClick={() => {
              setQuery('');
              setIsSearchOpen(false);
            }}
            className="p-1.5 text-[#888] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Trending Searches Tags */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-mono text-[#666] uppercase">QUICK QUERIES:</span>
          {trendingTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setQuery(tag)}
              className="px-2.5 py-1 text-xs font-mono bg-[#161616] hover:bg-[#222] border border-[#282828] text-[#aaa] hover:text-[#CEFF00] transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="max-h-[50vh] overflow-y-auto space-y-3 divide-y divide-[#1c1c1c] pr-1">
          {query.trim() && results.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-[#777]">
              NO CORRESPONDING ARCHIVE PIECES FOUND FOR &quot;{query}&quot;
            </div>
          ) : (
            results.map((product) => (
              <div
                key={product.id}
                onClick={() => {
                  setSelectedProduct(product);
                  setIsSearchOpen(false);
                }}
                className="pt-3 first:pt-0 flex items-center justify-between group cursor-pointer hover:bg-[#141414] p-2 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-12 h-14 object-cover bg-[#161616] border border-[#262626]"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-[#F1F0EB] group-hover:text-[#CEFF00] uppercase transition-colors">
                      {language === 'ar' ? product.nameAr : product.name}
                    </h4>
                    <p className="text-[10px] font-mono text-[#777] uppercase">
                      {product.weightGsm} GSM • {product.category}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-[#ccc]">
                    {formatPrice(product.price)}
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#555] group-hover:text-[#CEFF00] transition-colors" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
