import React, { useState, useMemo, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { PRODUCTS } from '../data/products';
import { Product, ProductColor, ProductSize } from '../types';
import { ProductViewer3D } from './3d/ProductViewer3D';
import { X, Box, Image, Ruler, ShieldCheck, Truck, RefreshCw, Plus, Minus, Check } from 'lucide-react';

export const ProductModal: React.FC = () => {
  const { selectedProduct } = useCart();
  if (!selectedProduct) return null;
  return <ProductModalDialog product={selectedProduct} />;
};

const ProductModalDialog: React.FC<{ product: Product }> = ({ product }) => {
  const {
    setSelectedProduct,
    t,
    language,
    formatPrice,
    addToCart
  } = useCart();

  const [activeMediaTab, setActiveMediaTab] = useState<'photos' | '3d'>(() =>
    product.has3DModel !== false ? '3d' : 'photos'
  );
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<ProductColor>(
    product.colors[0] || { name: 'Onyx Black', nameAr: 'أسود أونيكس', hex: '#0F0F0F', threeColor: '#0c0c0c' }
  );
  const [selectedSize, setSelectedSize] = useState<ProductSize>(
    product.sizes[0] || 'L'
  );
  const [quantity, setQuantity] = useState(1);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Sync state whenever selected product opens or changes
  useEffect(() => {
    setActiveMediaTab(product.has3DModel !== false ? '3d' : 'photos');
    if (product.colors && product.colors.length > 0) {
      setSelectedColor(product.colors[0]);
    }
    if (product.sizes && product.sizes.length > 0) {
      setSelectedSize(product.sizes[0]);
    }
    setSelectedPhotoIndex(0);
  }, [product.id, product.has3DModel]);

  const activeGraphicUrl = useMemo(() => {
    if (product.graphicUrl) return product.graphicUrl;
    const defaultItem = PRODUCTS.find((p) => p.id === product.id);
    if (defaultItem?.graphicUrl) return defaultItem.graphicUrl;
    const id = product.id.toLowerCase();
    if (id.includes('spider')) return '/graphics/chrome-spider.png';
    if (id.includes('savage')) return '/graphics/savage.png';
    if (id.includes('revelation')) return '/graphics/revelation.png';
    if (id.includes('tokyo') || id.includes('wave')) return '/graphics/tokyo-wave.png';
    if (id.includes('one-piece') || id.includes('sanji')) return '/graphics/one-piece.png';
    if (id.includes('tree')) return '/graphics/bare-tree.png';
    if (id.includes('are-you-ok') || id.includes('hands')) return '/graphics/are-you-ok.png';
    if (id.includes('christmas') || id.includes('drip') || id.includes('calligraphy')) return '/graphics/merry-christmas.png';
    return undefined;
  }, [product]);

  const name = language === 'ar' ? product.nameAr : product.name;
  const description = language === 'ar' ? product.descriptionAr : product.description;
  const fabric = language === 'ar' ? product.fabricAr : product.fabric;
  const details = language === 'ar' ? product.detailsAr : product.details;

  const handleAddToCart = () => {
    addToCart(product, selectedColor, selectedSize, quantity);
    setAddedSuccess(true);
    setTimeout(() => {
      setAddedSuccess(false);
      setSelectedProduct(null);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-xl flex items-center justify-center p-0 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl bg-[#0e0e0e] border-0 sm:border border-[#242424] shadow-2xl overflow-hidden my-auto min-h-screen sm:min-h-0 sm:max-h-[90vh] flex flex-col">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[#202020] bg-[#141414] sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 bg-[#CEFF00]" />
            <span className="text-xs font-mono tracking-widest text-[#999] uppercase">
              STUDIO ARCHIVE • REF_{product.id.slice(0, 8).toUpperCase()}
            </span>
          </div>

          <button
            onClick={() => setSelectedProduct(null)}
            className="p-1.5 text-[#888] hover:text-white hover:bg-[#222] transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto">
          {/* Left Column: Visual Media Stage (3D or High-Res Photos) */}
          <div className="lg:col-span-7 bg-[#111] p-3 sm:p-6 border-b lg:border-b-0 lg:border-r border-[#202020] flex flex-col justify-between">
            {/* Media Selector Tabs */}
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveMediaTab('photos')}
                  className={`px-3 py-1.5 text-xs font-mono tracking-wider flex items-center gap-1.5 border transition-all ${activeMediaTab === 'photos'
                      ? 'bg-[#222] text-[#CEFF00] border-[#383838]'
                      : 'bg-[#151515] text-[#777] border-[#222] hover:text-[#ccc]'
                    }`}
                >
                  <Image className="w-3.5 h-3.5" />
                  <span>{t.modal.viewPhotos}</span>
                </button>

                {product.has3DModel && (
                  <button
                    onClick={() => setActiveMediaTab('3d')}
                    className={`px-3 py-1.5 text-xs font-mono tracking-wider flex items-center gap-1.5 border transition-all ${activeMediaTab === '3d'
                        ? 'bg-[#CEFF00] text-[#090909] border-[#CEFF00] font-bold'
                        : 'bg-[#151515] text-[#777] border-[#222] hover:text-[#ccc]'
                      }`}
                  >
                    <Box className="w-3.5 h-3.5" />
                    <span>{t.modal.view3D}</span>
                  </button>
                )}
              </div>

              <span className="text-[10px] font-mono text-[#666] uppercase">
                {activeMediaTab === 'photos' ? `${selectedPhotoIndex + 1} OF ${product.images.length}` : 'LIVE 3D WEBGL'}
              </span>
            </div>

            {/* Display Stage */}
            <div className="relative w-full aspect-[4/5] max-h-[340px] sm:max-h-[560px] bg-[#161616] overflow-hidden border border-[#222]">
              {activeMediaTab === '3d' && product.has3DModel ? (
                <ProductViewer3D
                  currentColor={selectedColor}
                  onColorChange={setSelectedColor}
                  availableColors={product.colors}
                  graphicUrl={activeGraphicUrl}
                  frontGraphicUrl={product.frontGraphicUrl}
                  backGraphicUrl={product.backGraphicUrl || activeGraphicUrl}
                />
              ) : (
                <div className="w-full h-full relative group">
                  <img
                    src={product.images[selectedPhotoIndex] || product.images[0]}
                    alt={name}
                    className="w-full h-full object-cover object-center"
                  />
                  {/* Photo Badges */}
                  <div className="absolute top-4 left-4">
                    <span className="px-2.5 py-1 bg-black/80 text-[#CEFF00] font-mono text-[10px] tracking-widest uppercase border border-[#333]">
                      {product.badge || 'STUDIO DROP'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Photo Thumbnails */}
            {activeMediaTab === 'photos' && product.images.length > 1 && (
              <div className="flex gap-2.5 mt-4 overflow-x-auto pb-1">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedPhotoIndex(idx)}
                    className={`w-16 h-20 shrink-0 border overflow-hidden transition-all ${selectedPhotoIndex === idx
                        ? 'border-[#CEFF00] opacity-100 scale-105'
                        : 'border-[#292929] opacity-50 hover:opacity-100'
                      }`}
                  >
                    <img src={img} alt={`thumb ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Garment Specs, Size Selector, & Cart Action */}
          <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              {/* Garment Header */}
              <div>
                <div className="text-xs font-mono text-[#CEFF00] tracking-widest uppercase mb-1">
                  {product.weightGsm} GSM • {product.category.toUpperCase()}
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight uppercase text-[#F1F0EB]">
                  {name}
                </h1>
                <div className="flex items-baseline gap-3 mt-3">
                  <span className="text-2xl font-mono font-bold text-[#F1F0EB]">
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm font-mono text-[#555] line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                </div>
              </div>

              {/* Color Selector */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-[#aaa] mb-2">
                  <span>{t.modal.color}: <strong className="text-white">{language === 'ar' ? selectedColor.nameAr : selectedColor.name}</strong></span>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  {product.colors.map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => setSelectedColor(c)}
                      title={language === 'ar' ? (c.nameAr || c.name) : c.name}
                      className={`w-8 h-8 border transition-all flex items-center justify-center ${selectedColor.hex.toLowerCase() === c.hex.toLowerCase()
                          ? 'border-[#CEFF00] scale-110 shadow-[0_0_10px_rgba(206,255,0,0.4)]'
                          : 'border-[#383838] opacity-60 hover:opacity-100 hover:border-[#666]'
                        }`}
                      style={{ backgroundColor: c.hex }}
                    >
                      {selectedColor.hex.toLowerCase() === c.hex.toLowerCase() && (
                        <span className="w-1.5 h-1.5 bg-[#CEFF00] rounded-full" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Selector */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-[#aaa] mb-2">
                  <span>{t.modal.size}: <strong className="text-white">{selectedSize}</strong></span>
                  <button
                    onClick={() => setShowSizeGuide(!showSizeGuide)}
                    className="flex items-center gap-1 text-[11px] text-[#CEFF00] hover:underline"
                  >
                    <Ruler className="w-3.5 h-3.5" />
                    <span>{t.modal.sizeGuide}</span>
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`py-3 text-xs font-mono tracking-wider border transition-all ${selectedSize === s
                          ? 'bg-[#CEFF00] text-[#090909] border-[#CEFF00] font-bold shadow-[0_0_12px_rgba(206,255,0,0.3)]'
                          : 'bg-[#151515] text-[#ccc] border-[#292929] hover:border-[#666]'
                        }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity Selector */}
              <div>
                <span className="text-xs font-mono text-[#aaa] block mb-2">{t.modal.quantity}</span>
                <div className="inline-flex items-center border border-[#2c2c2c] bg-[#141414]">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 text-[#999] hover:text-white hover:bg-[#222] transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-12 text-center font-mono text-sm font-bold text-white">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-3 text-[#999] hover:text-white hover:bg-[#222] transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Size Guide Modal Overlay */}
              {showSizeGuide && (
                <div className="p-4 bg-[#141414] border border-[#333] space-y-3 text-xs font-mono">
                  <div className="flex items-center justify-between text-[#CEFF00] font-bold uppercase">
                    <span>OVERSIZED FIT SPEC (CM)</span>
                    <button onClick={() => setShowSizeGuide(false)}>✕</button>
                  </div>
                  <table className="w-full text-left border-collapse text-[#ccc]">
                    <thead>
                      <tr className="border-b border-[#2c2c2c] text-[#777]">
                        <th className="py-1">SIZE</th>
                        <th>CHEST</th>
                        <th>LENGTH</th>
                        <th>SHOULDER</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-[#222]"><td>S</td><td>62 cm</td><td>72 cm</td><td>58 cm</td></tr>
                      <tr className="border-b border-[#222]"><td>M</td><td>66 cm</td><td>74 cm</td><td>61 cm</td></tr>
                      <tr className="border-b border-[#222]"><td>L</td><td>70 cm</td><td>76 cm</td><td>64 cm</td></tr>
                      <tr className="border-b border-[#222]"><td>XL</td><td>74 cm</td><td>78 cm</td><td>67 cm</td></tr>
                      <tr><td>XXL</td><td>78 cm</td><td>80 cm</td><td>70 cm</td></tr>
                    </tbody>
                  </table>
                  <p className="text-[10px] text-[#777]">
                    Engineered intentionally oversized. Take your true size for our signature brutalist boxy drape.
                  </p>
                </div>
              )}

              {/* Fabric & Construction Specs */}
              <div className="space-y-3 pt-3 border-t border-[#1f1f1f]">
                <div className="text-xs font-mono text-[#888] space-y-1.5">
                  <div>
                    <strong className="text-[#ccc] uppercase">{t.modal.fabricSpec}:</strong> {fabric}
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[#aaa] text-[11px] pt-1">
                    {details.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-6 border-t border-[#202020] space-y-3">
              <button
                onClick={handleAddToCart}
                disabled={addedSuccess}
                className={`w-full py-4 text-xs font-mono font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${addedSuccess
                    ? 'bg-green-500 text-black'
                    : 'bg-[#CEFF00] hover:bg-[#b8e600] text-[#090909] shadow-[0_0_20px_rgba(206,255,0,0.3)]'
                  }`}
              >
                {addedSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{t.modal.addedToBag}</span>
                  </>
                ) : (
                  <span>{t.modal.addToBag} • {formatPrice(product.price * quantity)}</span>
                )}
              </button>

              <div className="flex items-center justify-between text-[11px] font-mono text-[#777] pt-1">
                <span className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#CEFF00]" />
                  <span>{t.modal.freeShippingNote}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#CEFF00]" />
                  <span>CASH ON DELIVERY</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
