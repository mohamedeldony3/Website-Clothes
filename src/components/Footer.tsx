import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { ArrowUpRight, Check, Send, Instagram } from 'lucide-react';

export const Footer: React.FC = () => {
  const { t, language } = useCart();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && email.includes('@')) {
      setSubscribed(true);
      setTimeout(() => {
        setEmail('');
        setSubscribed(false);
      }, 4000);
    }
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const pos = el.getBoundingClientRect().top + window.pageYOffset - 70;
      window.scrollTo({ top: pos, behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-[#070707] text-[#F1F0EB] border-t border-[#1a1a1a] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Top Newsletter Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 border-b border-[#1c1c1c] pb-16 items-center">
          <div className="lg:col-span-6 space-y-2">
            <div className="text-xs font-mono text-[#CEFF00] tracking-widest uppercase">
              // ARCHIVE ADMISSION
            </div>
            <h3 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#F1F0EB]">
              {t.footer.newsletterHeadline}
            </h3>
            <p className="text-xs font-mono text-[#777] max-w-md">
              {t.footer.newsletterSub}
            </p>
          </div>

          <div className="lg:col-span-6">
            {subscribed ? (
              <div className="p-4 bg-[#141414] border border-[#CEFF00] flex items-center gap-3 text-xs font-mono text-[#CEFF00]">
                <Check className="w-4 h-4" />
                <span>{t.footer.subscribed}</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.footer.emailPlaceholder}
                  className="flex-1 p-3.5 bg-[#121212] border border-[#292929] focus:border-[#CEFF00] text-xs font-mono text-white placeholder-[#555] focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-6 py-3.5 bg-[#CEFF00] hover:bg-[#b8e600] text-[#090909] text-xs font-mono font-bold tracking-widest uppercase transition-all flex items-center gap-2"
                >
                  <span>{t.footer.subscribeBtn}</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-16 border-b border-[#1c1c1c] text-xs font-mono">
          {/* Col 1 */}
          <div className="space-y-4">
            <div className="text-[11px] text-[#888] font-bold tracking-widest uppercase">
              {t.footer.shopHeading}
            </div>
            <ul className="space-y-2.5 text-[#aaa]">
              <li>
                <button onClick={() => scrollTo('shop')} className="hover:text-[#CEFF00] transition-colors">
                  {language === 'ar' ? 'أحدث التشكيلات' : 'New Arrivals'}
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('shop')} className="hover:text-[#CEFF00] transition-colors">
                  {language === 'ar' ? 'هوديات ثقيلة' : 'Heavyweight Hoodies'}
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('shop')} className="hover:text-[#CEFF00] transition-colors">
                  {language === 'ar' ? 'تيشيرتات بوكسي 300GSM' : 'Boxy Tees 300GSM'}
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('shop')} className="hover:text-[#CEFF00] transition-colors">
                  {language === 'ar' ? 'ملابس خارجية تكتيكية' : 'Tactical Outerwear'}
                </button>
              </li>
            </ul>
          </div>

          {/* Col 2 */}
          <div className="space-y-4">
            <div className="text-[11px] text-[#888] font-bold tracking-widest uppercase">
              {t.footer.aboutHeading}
            </div>
            <ul className="space-y-2.5 text-[#aaa]">
              <li>
                <button onClick={() => scrollTo('about')} className="hover:text-[#CEFF00] transition-colors">
                  {language === 'ar' ? 'بيان الأتيليه' : 'Atelier Manifesto'}
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('campaign')} className="hover:text-[#CEFF00] transition-colors">
                  {language === 'ar' ? 'سلسلة حملة 04' : 'Campaign Series 04'}
                </button>
              </li>
              <li>
                <span className="text-[#666]">{language === 'ar' ? 'مختبر الملابس القاهرة' : 'Cairo Garment Lab'}</span>
              </li>
              <li>
                <span className="text-[#666]">{language === 'ar' ? 'فلسفة القطن المصري' : 'Egyptian Cotton Ethos'}</span>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-4">
            <div className="text-[11px] text-[#888] font-bold tracking-widest uppercase">
              {t.footer.legalHeading}
            </div>
            <ul className="space-y-2.5 text-[#aaa]">
              <li>{language === 'ar' ? 'سياسة الدفع عند الاستلام' : 'Cash On Delivery Policy'}</li>
              <li>{language === 'ar' ? 'دليل العناية والغسيل' : 'Care & Washing Guide'}</li>
              <li>{language === 'ar' ? 'الإرجاع والتبديل (14 يوم)' : 'Returns & Exchange (14 Days)'}</li>
              <li>{language === 'ar' ? 'شروط الخدمة' : 'Terms of Service'}</li>
            </ul>
          </div>

          {/* Col 4 - Social / Location */}
          <div className="space-y-4">
            <div className="text-[11px] text-[#888] font-bold tracking-widest uppercase">
              {language === 'ar' ? 'تواصل معنا' : 'CONNECT'}
            </div>
            <ul className="space-y-2.5 text-[#aaa]">
              <li>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#CEFF00] flex items-center gap-1.5 transition-colors"
                >
                  <Instagram className="w-3.5 h-3.5" />
                  <span>Instagram</span>
                  <ArrowUpRight className="w-3 h-3 text-[#555]" />
                </a>
              </li>
              <li>
                <a
                  href="https://tiktok.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#CEFF00] flex items-center gap-1.5 transition-colors"
                >
                  <span>TikTok</span>
                  <ArrowUpRight className="w-3 h-3 text-[#555]" />
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/201099998888"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#CEFF00] flex items-center gap-1.5 transition-colors text-[#25D366]"
                >
                  <span>WhatsApp Concierge</span>
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] font-mono text-[#555]">
          <div>{t.footer.copyright}</div>
          <div className="text-[#888]">{t.footer.shippingPolicy}</div>
        </div>
      </div>
    </footer>
  );
};
