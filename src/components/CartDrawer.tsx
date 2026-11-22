import React from 'react';
import { useCart } from '../context/CartContext';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShieldCheck } from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const {
    isCartOpen,
    setIsCartOpen,
    items,
    removeFromCart,
    updateQuantity,
    subtotal,
    formatPrice,
    setIsCheckoutOpen,
    t,
    language,
    storeSettings
  } = useCart();

  if (!isCartOpen) return null;

  const freeShippingThreshold = storeSettings?.freeShippingThreshold ?? 2500;
  const progressPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100);
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="absolute inset-0"
        onClick={() => setIsCartOpen(false)}
      />

      <div className={`fixed inset-y-0 ${language === 'ar' ? 'left-0' : 'right-0'} max-w-full flex pl-0`}>
        <div className="w-screen max-w-md bg-[#0c0c0c] border-x border-[#222] shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-6 border-b border-[#202020] bg-[#121212] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#CEFF00]" />
              <h2 className="text-xs font-mono font-bold tracking-widest uppercase text-[#F1F0EB]">
                {t.cart.title} ({items.reduce((acc, i) => acc + i.quantity, 0)})
              </h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 text-[#777] hover:text-white hover:bg-[#222] transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Meter */}
          <div className="px-6 py-3 bg-[#161616] border-b border-[#222]">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#aaa] mb-1.5">
              {remainingForFreeShipping > 0 ? (
                <span>
                  {formatPrice(remainingForFreeShipping)} {t.cart.awayFromFreeShipping}
                </span>
              ) : (
                <span className="text-[#CEFF00] font-bold">
                  ✓ {t.cart.freeShippingUnlocked}
                </span>
              )}
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="w-full h-1 bg-[#282828] overflow-hidden">
              <div
                className="h-full bg-[#CEFF00] transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 divide-y divide-[#1c1c1c]">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-16">
                <div className="w-14 h-14 bg-[#161616] border border-[#2a2a2a] flex items-center justify-center text-[#555]">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-mono font-bold text-[#F1F0EB] uppercase">
                    {t.cart.emptyTitle}
                  </h3>
                  <p className="text-xs font-mono text-[#777] max-w-xs">
                    {t.cart.emptySub}
                  </p>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-2.5 bg-[#181818] border border-[#333] hover:border-[#CEFF00] text-xs font-mono text-[#CEFF00] uppercase tracking-wider transition-all"
                >
                  {t.cart.continueShopping}
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={`${item.product.id}-${item.selectedSize}-${item.selectedColor.hex}`} className="pt-4 first:pt-0 flex gap-4">
                  {/* Thumbnail */}
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-20 h-24 object-cover bg-[#161616] border border-[#262626] shrink-0"
                  />

                  {/* Item Specs */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <h4 className="text-xs font-bold text-[#F1F0EB] uppercase line-clamp-1">
                          {language === 'ar' ? item.product.nameAr : item.product.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.product.id, item.selectedSize, item.selectedColor.hex)}
                          className="text-[#666] hover:text-red-400 p-1"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Tag info */}
                      <div className="flex items-center gap-2 text-[11px] font-mono text-[#888] mt-1">
                        <span>SIZE: <strong className="text-white">{item.selectedSize}</strong></span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-[#444]"
                            style={{ backgroundColor: item.selectedColor.hex }}
                          />
                          <span className="text-white">{language === 'ar' ? item.selectedColor.nameAr : item.selectedColor.name}</span>
                        </span>
                      </div>
                    </div>

                    {/* Qty & Price */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="inline-flex items-center border border-[#282828] bg-[#141414]">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.selectedSize, item.selectedColor.hex, item.quantity - 1)}
                          className="p-1.5 text-[#888] hover:text-white"
                          aria-label="Decrease"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-mono font-bold text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.selectedSize, item.selectedColor.hex, item.quantity + 1)}
                          className="p-1.5 text-[#888] hover:text-white"
                          aria-label="Increase"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-xs font-mono font-bold text-[#F1F0EB]">
                        {formatPrice(item.product.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout Drawer Bar */}
          {items.length > 0 && (
            <div className="p-6 border-t border-[#202020] bg-[#121212] space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono text-[#888]">
                  <span>{t.cart.subtotal}</span>
                  <span className="text-base font-bold text-[#F1F0EB]">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-[#666]">
                  <span>SHIPPING</span>
                  <span>{t.cart.shippingCalc}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsCartOpen(false);
                  setIsCheckoutOpen(true);
                }}
                className="w-full py-4 bg-[#CEFF00] hover:bg-[#b8e600] text-[#090909] text-xs font-mono font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(206,255,0,0.25)]"
              >
                <span>{t.cart.checkoutBtn}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-[#666] uppercase text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-[#CEFF00]" />
                <span>CASH ON DELIVERY • INSPECT BEFORE PAYING</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
