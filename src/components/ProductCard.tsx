import React, { useState } from 'react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { Heart, Box, Plus, Check } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const {
    language,
    formatPrice,
    addToCart,
    setSelectedProduct,
    toggleWishlist,
    isInWishlist
  } = useCart();

  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] ?? 'M');
  const [isHovered, setIsHovered] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [addedAnim, setAddedAnim] = useState(false);

  const isFav = isInWishlist(product.id);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, selectedColor, selectedSize, 1);
    setAddedAnim(true);
    setTimeout(() => setAddedAnim(false), 1500);
  };

  const name = language === 'ar' ? product.nameAr : product.name;
  const badge = language === 'ar' ? product.badgeAr : product.badge;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowQuickAdd(false);
      }}
      className="group relative flex flex-col bg-[#111111] border border-[#222222] hover:border-[#444] transition-all duration-300"
    >
      {/* Product Image Stage */}
      <div
        onClick={() => setSelectedProduct(product)}
        className="relative w-full aspect-[3/4] bg-[#161616] overflow-hidden cursor-pointer"
      >
        {/* Main Image */}
        <img
          src={product.images[0]}
          alt={name}
          className={`w-full h-full object-cover object-center transition-all duration-700 ease-out ${
            isHovered && product.images[1] ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
          }`}
          loading="lazy"
        />

        {/* Secondary Hover Image */}
        {product.images[1] && (
          <img
            src={product.images[1]}
            alt={`${name} secondary`}
            className={`absolute inset-0 w-full h-full object-cover object-center transition-all duration-700 ease-out ${
              isHovered ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
            }`}
            loading="lazy"
          />
        )}

        {/* Top Floating Badges */}
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 right-2 sm:right-3 flex items-start justify-between pointer-events-none">
          <div className="flex flex-col gap-1 items-start">
            {badge && (
              <span className={`px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[10px] font-mono font-bold tracking-widest uppercase ${
                product.badge === 'LIMITED EDITION'
                  ? 'bg-[#FF4800] text-white'
                  : 'bg-[#CEFF00] text-[#090909]'
              }`}>
                {badge}
              </span>
            )}
            {product.has3DModel && (
              <span className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[9px] font-mono tracking-wider bg-[#0a0a0a]/90 backdrop-blur-md border border-[#333] text-[#CEFF00]">
                <Box className="w-2.5 h-2.5" />
                <span>3D MODEL</span>
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(product.id);
            }}
            className="p-1.5 sm:p-2 bg-[#090909]/80 backdrop-blur-md border border-[#333] hover:border-[#CEFF00] text-[#ccc] hover:text-[#CEFF00] transition-colors pointer-events-auto"
            aria-label="Toggle Wishlist"
          >
            <Heart className={`w-3 sm:w-3.5 h-3 sm:h-3.5 ${isFav ? 'fill-[#CEFF00] text-[#CEFF00]' : ''}`} />
          </button>
        </div>

        {/* Mobile Quick 3D Pill on Card */}
        {product.has3DModel && (
          <div className="sm:hidden absolute bottom-2 right-2 z-10 pointer-events-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedProduct(product);
              }}
              className="px-2 py-1 bg-[#090909]/90 border border-[#333] text-[#CEFF00] flex items-center gap-1 text-[9px] font-mono rounded-none"
            >
              <Box className="w-2.5 h-2.5" />
              <span>3D</span>
            </button>
          </div>
        )}

        {/* Quick View Button on Hover (Desktop) */}
        <div className="hidden sm:flex absolute inset-x-3 bottom-3 flex-col gap-2 transition-all duration-300 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0">
          {!showQuickAdd ? (
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedProduct(product);
                }}
                className="flex-1 py-2.5 bg-[#090909]/90 hover:bg-black text-[#F1F0EB] text-xs font-mono tracking-wider border border-[#333] backdrop-blur-md transition-colors uppercase text-center"
              >
                {language === 'ar' ? 'معاينة سريعة' : 'QUICK VIEW'}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowQuickAdd(true);
                }}
                className="px-3 py-2.5 bg-[#CEFF00] hover:bg-[#b8e600] text-[#090909] text-xs font-mono font-bold tracking-wider transition-colors flex items-center justify-center"
                title="Quick Select Size"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              onClick={(e) => e.stopPropagation()}
              className="p-2.5 bg-[#0e0e0e] border border-[#333] space-y-2 shadow-2xl"
            >
              <div className="flex items-center justify-between text-[10px] font-mono text-[#888]">
                <span>SELECT SIZE:</span>
                <button
                  onClick={() => setShowQuickAdd(false)}
                  className="text-[#666] hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="flex gap-1.5">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`flex-1 py-1 text-[11px] font-mono border transition-all ${
                      selectedSize === s
                        ? 'bg-[#CEFF00] text-[#090909] border-[#CEFF00] font-bold'
                        : 'bg-[#181818] text-[#ccc] border-[#2c2c2c] hover:border-[#666]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <button
                onClick={handleQuickAdd}
                className="w-full py-1.5 bg-[#F1F0EB] hover:bg-white text-[#090909] text-xs font-mono font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-1.5"
              >
                {addedAnim ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-600" />
                    <span>ADDED</span>
                  </>
                ) : (
                  <span>ADD TO BAG</span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Product Details Section */}
      <div className="p-2.5 sm:p-4 flex flex-col flex-1 justify-between gap-2 sm:gap-3">
        <div>
          {/* Colors Swatches */}
          <div className="flex items-center gap-1 sm:gap-1.5 mb-1.5 sm:mb-2">
            {product.colors.map((c) => (
              <button
                key={c.hex}
                onClick={() => setSelectedColor(c)}
                title={language === 'ar' ? c.nameAr : c.name}
                className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-none border transition-all ${
                  selectedColor.hex === c.hex
                    ? 'border-[#CEFF00] scale-110 shadow-[0_0_6px_rgba(206,255,0,0.6)]'
                    : 'border-[#444] opacity-60 hover:opacity-100'
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
            <span className="text-[9px] sm:text-[10px] font-mono text-[#666] ml-1">
              {product.colors.length} {language === 'ar' ? 'ألوان' : 'colors'}
            </span>
          </div>

          {/* Product Name */}
          <h3
            onClick={() => setSelectedProduct(product)}
            className="text-xs sm:text-base font-bold tracking-tight text-[#F1F0EB] hover:text-[#CEFF00] transition-colors line-clamp-1 uppercase cursor-pointer"
          >
            {name}
          </h3>

          <p className="text-[9px] sm:text-[11px] font-mono text-[#777] mt-0.5 uppercase line-clamp-1">
            {product.weightGsm} GSM • {language === 'ar' ? product.fitAr : product.fit}
          </p>
        </div>

        {/* Price & EGP tag */}
        <div className="flex items-center justify-between border-t border-[#1f1f1f] pt-2 sm:pt-3">
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-xs sm:text-base font-mono font-bold text-[#F1F0EB]">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-[10px] sm:text-xs font-mono text-[#555] line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          <span className="hidden sm:inline-block text-[10px] font-mono text-[#777] tracking-wider uppercase">
            {language === 'ar' ? 'الدفع عند الاستلام' : 'COD AVAILABLE'}
          </span>
        </div>
      </div>
    </div>
  );
};
