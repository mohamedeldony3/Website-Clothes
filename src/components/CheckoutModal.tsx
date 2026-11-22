import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { EGYPTIAN_GOVERNORATES } from '../data/governorates';
import { CheckoutFormData, OrderReceipt } from '../types';
import { X, Check, MessageSquare, Truck, ShieldCheck, AlertCircle } from 'lucide-react';

export const CheckoutModal: React.FC = () => {
  const {
    isCheckoutOpen,
    setIsCheckoutOpen,
    items,
    subtotal,
    clearCart,
    formatPrice,
    t,
    language,
    addOrder,
    storeSettings,
  } = useCart();

  const STORE_WHATSAPP_NUMBER = storeSettings?.whatsappNumber || '201099998888';
  const FREE_SHIPPING_THRESHOLD = storeSettings?.freeShippingThreshold || 2500;

  const [formData, setFormData] = useState<CheckoutFormData>({
    fullName: '',
    phone: '',
    governorate: 'cairo',
    city: '',
    streetAddress: '',
    notes: '',
    paymentMethod: 'cod',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<OrderReceipt | null>(null);

  if (!isCheckoutOpen) return null;

  const currentGov = EGYPTIAN_GOVERNORATES.find((g) => g.id === formData.governorate) || EGYPTIAN_GOVERNORATES[0];
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : currentGov.shippingFee;
  const grandTotal = subtotal + shippingFee;

  const validatePhone = (num: string): boolean => {
    // Egyptian phone format: 11 digits starting with 010, 011, 012, or 015
    const cleaned = num.replace(/[\s-]/g, '');
    const regex = /^01[0125][0-9]{8}$/;
    return regex.test(cleaned);
  };

  const handleInputChange = (field: keyof CheckoutFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.fullName.trim() || formData.fullName.trim().length < 3) {
      newErrors.fullName = language === 'ar' ? 'يرجى إدخال الاسم بالكامل' : 'Full name is required';
    }

    if (!validatePhone(formData.phone)) {
      newErrors.phone = t.checkout.phoneError;
    }

    if (!formData.city.trim()) {
      newErrors.city = language === 'ar' ? 'يرجى تحديد المدينة أو الحي' : 'City / Area is required';
    }

    if (!formData.streetAddress.trim() || formData.streetAddress.trim().length < 5) {
      newErrors.streetAddress = language === 'ar' ? 'يرجى كتابة العنوان بالتفصيل' : 'Detailed street address is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createOrderReceipt = (): OrderReceipt => {
    const orderId = `MONO-${Math.floor(100000 + Math.random() * 900000)}`;
    return {
      orderId,
      items: [...items],
      subtotal,
      shippingFee,
      total: grandTotal,
      customer: { ...formData },
      createdAt: new Date().toISOString(),
    };
  };

  const buildWhatsAppMessage = (order: OrderReceipt): string => {
    const govName = language === 'ar' ? currentGov.nameAr : currentGov.nameEn;
    const itemsList = order.items
      .map(
        (i, idx) =>
          `• ${idx + 1}. ${i.product.name} (${i.selectedSize} / ${i.selectedColor.name}) x${i.quantity} = ${i.product.price * i.quantity} EGP`
      )
      .join('\n');

    const msg = `⚡ *MONO / STUDIO — NEW ORDER CONFIRMATION*
━━━━━━━━━━━━━━━━━━━━
*Order ID:* #${order.orderId}
*Customer:* ${order.customer.fullName}
*Phone:* ${order.customer.phone}
*Governorate:* ${govName}
*City / District:* ${order.customer.city}
*Address:* ${order.customer.streetAddress}
${order.customer.notes ? `*Delivery Notes:* ${order.customer.notes}\n` : ''}
━━━━━━━━━━━━━━━━━━━━
*ORDERED PIECES:*
${itemsList}

━━━━━━━━━━━━━━━━━━━━
*Subtotal:* ${order.subtotal} EGP
*Delivery Fee:* ${order.shippingFee === 0 ? 'FREE' : `${order.shippingFee} EGP`}
*GRAND TOTAL:* ${order.total} EGP
*Payment:* Cash on Delivery (COD)
━━━━━━━━━━━━━━━━━━━━
_Please confirm dispatch and tracking details. Thank you!_`;

    return encodeURIComponent(msg);
  };

  const handleStandardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const order = createOrderReceipt();
      addOrder(order);
      setCompletedOrder(order);
      setIsSubmitting(false);
      clearCart();
    }, 800);
  };

  const handleWhatsAppSubmit = () => {
    if (!validateForm()) return;

    const order = createOrderReceipt();
    addOrder(order);
    setCompletedOrder(order);
    clearCart();

    const waText = buildWhatsAppMessage(order);
    const waUrl = `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${waText}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#0e0e0e] border border-[#252525] shadow-2xl my-auto overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#202020] bg-[#141414]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#CEFF00]" />
            <h2 className="text-xs font-mono font-bold tracking-widest uppercase text-[#F1F0EB]">
              {t.checkout.title} • {t.checkout.subtitle}
            </h2>
          </div>
          <button
            onClick={() => setIsCheckoutOpen(false)}
            className="p-1.5 text-[#888] hover:text-white"
            aria-label="Close checkout"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Completed Order Receipt State */}
        {completedOrder ? (
          <div className="p-8 sm:p-12 text-center space-y-6">
            <div className="w-16 h-16 bg-[#CEFF00] text-[#090909] rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(206,255,0,0.4)]">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl sm:text-3xl font-black uppercase text-[#F1F0EB]">
                {t.checkout.orderSuccess}
              </h3>
              <p className="text-xs font-mono text-[#888] max-w-md mx-auto">
                {t.checkout.orderSuccessSub}
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="max-w-md mx-auto p-5 bg-[#141414] border border-[#262626] text-left space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-[#242424] pb-2 text-[#aaa]">
                <span>{t.checkout.orderId}:</span>
                <strong className="text-[#CEFF00]">#{completedOrder.orderId}</strong>
              </div>
              <div className="flex justify-between text-[#888]">
                <span>Customer:</span>
                <span className="text-white">{completedOrder.customer.fullName}</span>
              </div>
              <div className="flex justify-between text-[#888]">
                <span>Destination:</span>
                <span className="text-white">{completedOrder.customer.city}, {currentGov.nameEn}</span>
              </div>
              <div className="flex justify-between text-[#888]">
                <span>Payment:</span>
                <span className="text-white">Cash on Delivery</span>
              </div>
              <div className="flex justify-between border-t border-[#242424] pt-2 text-[#F1F0EB] font-bold text-sm">
                <span>Total Amount:</span>
                <span className="text-[#CEFF00]">{formatPrice(completedOrder.total)}</span>
              </div>
            </div>

            <p className="text-xs font-mono text-[#666] max-w-sm mx-auto">
              {t.checkout.whatsappFollowup}
            </p>

            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <button
                onClick={() => {
                  const waText = buildWhatsAppMessage(completedOrder);
                  window.open(`https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${waText}`, '_blank');
                }}
                className="px-6 py-3 bg-[#25D366] hover:bg-[#20ba59] text-black font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>OPEN ORDER IN WHATSAPP</span>
              </button>

              <button
                onClick={() => {
                  setCompletedOrder(null);
                  setIsCheckoutOpen(false);
                }}
                className="px-6 py-3 bg-[#181818] border border-[#333] hover:border-[#666] text-white font-mono text-xs uppercase tracking-wider"
              >
                {t.checkout.closeReceipt}
              </button>
            </div>
          </div>
        ) : (
          /* Checkout Form & Order Summary */
          <div className="grid grid-cols-1 lg:grid-cols-12 max-h-[80vh] overflow-y-auto">
            {/* Form Fields */}
            <form onSubmit={handleStandardSubmit} className="lg:col-span-7 p-6 sm:p-8 space-y-5 border-b lg:border-b-0 lg:border-r border-[#202020]">
              <div className="text-xs font-mono text-[#CEFF00] tracking-widest uppercase">
                // {t.checkout.customerDetails}
              </div>

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#aaa] block">
                  {t.checkout.fullName} *
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder={t.checkout.fullNamePlaceholder}
                  className={`w-full p-3 bg-[#141414] border ${
                    errors.fullName ? 'border-red-500' : 'border-[#292929] focus:border-[#CEFF00]'
                  } text-sm text-white font-mono focus:outline-none transition-colors`}
                />
                {errors.fullName && <p className="text-[11px] font-mono text-red-400">{errors.fullName}</p>}
              </div>

              {/* Mobile Phone Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#aaa] block">
                  {t.checkout.phone} *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder={t.checkout.phonePlaceholder}
                  className={`w-full p-3 bg-[#141414] border ${
                    errors.phone ? 'border-red-500' : 'border-[#292929] focus:border-[#CEFF00]'
                  } text-sm text-white font-mono focus:outline-none transition-colors`}
                />
                {errors.phone && <p className="text-[11px] font-mono text-red-400">{errors.phone}</p>}
              </div>

              {/* Governorate Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#aaa] block">
                  {t.checkout.governorate} *
                </label>
                <select
                  value={formData.governorate}
                  onChange={(e) => handleInputChange('governorate', e.target.value)}
                  className="w-full p-3 bg-[#141414] border border-[#292929] focus:border-[#CEFF00] text-sm text-white font-mono focus:outline-none transition-colors cursor-pointer"
                >
                  {EGYPTIAN_GOVERNORATES.map((g) => (
                    <option key={g.id} value={g.id} className="bg-[#121212] text-white">
                      {language === 'ar' ? g.nameAr : g.nameEn} — (+{g.shippingFee} EGP)
                    </option>
                  ))}
                </select>
              </div>

              {/* City / Area */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#aaa] block">
                  {t.checkout.city} *
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder={t.checkout.cityPlaceholder}
                  className={`w-full p-3 bg-[#141414] border ${
                    errors.city ? 'border-red-500' : 'border-[#292929] focus:border-[#CEFF00]'
                  } text-sm text-white font-mono focus:outline-none transition-colors`}
                />
                {errors.city && <p className="text-[11px] font-mono text-red-400">{errors.city}</p>}
              </div>

              {/* Detailed Street Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#aaa] block">
                  {t.checkout.streetAddress} *
                </label>
                <input
                  type="text"
                  value={formData.streetAddress}
                  onChange={(e) => handleInputChange('streetAddress', e.target.value)}
                  placeholder={t.checkout.streetPlaceholder}
                  className={`w-full p-3 bg-[#141414] border ${
                    errors.streetAddress ? 'border-red-500' : 'border-[#292929] focus:border-[#CEFF00]'
                  } text-sm text-white font-mono focus:outline-none transition-colors`}
                />
                {errors.streetAddress && <p className="text-[11px] font-mono text-red-400">{errors.streetAddress}</p>}
              </div>

              {/* Order Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#aaa] block">
                  {t.checkout.notes}
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder={t.checkout.notesPlaceholder}
                  className="w-full p-3 bg-[#141414] border border-[#292929] focus:border-[#CEFF00] text-sm text-white font-mono focus:outline-none transition-colors resize-none"
                />
              </div>

              {/* Payment Method Notice */}
              <div className="p-4 bg-[#141414] border border-[#2a2a2a] space-y-1">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#CEFF00]">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{t.checkout.paymentCod}</span>
                </div>
                <p className="text-[11px] font-mono text-[#777] leading-relaxed">
                  {t.checkout.paymentCodDesc}
                </p>
              </div>

              {/* Submission Buttons */}
              <div className="pt-2 space-y-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-[#CEFF00] hover:bg-[#b8e600] text-[#090909] text-xs font-mono font-bold tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(206,255,0,0.3)] disabled:opacity-50"
                >
                  {isSubmitting ? t.checkout.submitting : `${t.checkout.placeOrder} • ${formatPrice(grandTotal)}`}
                </button>

                <button
                  type="button"
                  onClick={handleWhatsAppSubmit}
                  className="w-full py-3.5 bg-[#171717] hover:bg-[#202020] border border-[#2e2e2e] hover:border-[#25D366] text-white text-xs font-mono font-medium tracking-wider uppercase transition-all flex items-center justify-center gap-2 text-[#25D366]"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{t.checkout.placeOrderWhatsapp}</span>
                </button>
              </div>
            </form>

            {/* Right Column: Order Summary */}
            <div className="lg:col-span-5 p-6 sm:p-8 bg-[#111111] space-y-6 flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono text-[#CEFF00] tracking-widest uppercase mb-4">
                  // {t.checkout.orderSummary} ({items.length})
                </div>

                {/* Items Mini List */}
                <div className="space-y-3 max-h-56 overflow-y-auto divide-y divide-[#1e1e1e] pr-1">
                  {items.map((item) => (
                    <div key={`${item.product.id}-${item.selectedSize}`} className="pt-3 first:pt-0 flex gap-3">
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-12 h-14 object-cover bg-[#161616] border border-[#262626] shrink-0"
                      />
                      <div className="flex-1 text-xs">
                        <div className="font-bold text-[#F1F0EB] line-clamp-1 uppercase">
                          {language === 'ar' ? item.product.nameAr : item.product.name}
                        </div>
                        <div className="text-[10px] font-mono text-[#777] mt-0.5">
                          {item.selectedSize} / {language === 'ar' ? item.selectedColor.nameAr : item.selectedColor.name} • Qty: {item.quantity}
                        </div>
                        <div className="font-mono text-[#bbb] mt-1">
                          {formatPrice(item.product.price * item.quantity)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2 pt-6 border-t border-[#222] font-mono text-xs">
                  <div className="flex justify-between text-[#888]">
                    <span>{t.checkout.subtotal}:</span>
                    <span className="text-[#ccc]">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[#888]">
                    <span>{t.checkout.shipping} ({language === 'ar' ? currentGov.nameAr : currentGov.nameEn}):</span>
                    <span className={shippingFee === 0 ? 'text-[#CEFF00] font-bold' : 'text-[#ccc]'}>
                      {shippingFee === 0 ? t.checkout.freeShipping : formatPrice(shippingFee)}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-[#F1F0EB] pt-3 border-t border-[#222]">
                    <span>{t.checkout.total}:</span>
                    <span className="text-[#CEFF00]">{formatPrice(grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Guarantees */}
              <div className="p-4 bg-[#141414] border border-[#222] space-y-2 text-[11px] font-mono text-[#777]">
                <div className="flex items-center gap-2 text-white">
                  <Truck className="w-3.5 h-3.5 text-[#CEFF00]" />
                  <span>2-4 Business Days Nationwide Dispatch</span>
                </div>
                <div>No upfront card required. Pay cash to courier only after verifying your items.</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
