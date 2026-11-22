import React from 'react';
import { useCart } from '../context/CartContext';
import { Shield, Sparkles, Feather } from 'lucide-react';

export const BrandStory: React.FC = () => {
  const { t, language } = useCart();

  return (
    <section id="about" className="py-28 bg-[#0c0c0c] text-[#F1F0EB] relative border-y border-[#1c1c1c] overflow-hidden">
      {/* Background Architectural Watermark */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 select-none pointer-events-none opacity-[0.02] text-[18vw] font-black font-sans leading-none">
        MONO
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Visual Diptych */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="relative aspect-[3/4] overflow-hidden bg-[#161616] border border-[#222]">
                <img
                  src="https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=800&q=80"
                  alt="Editorial garment craft"
                  className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition-all duration-700"
                />
                <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/80 text-[9px] font-mono text-[#CEFF00]">
                  520 GSM FABRIC LAB
                </div>
              </div>
              <div className="p-4 bg-[#141414] border border-[#242424] space-y-1">
                <div className="text-2xl font-mono font-bold text-[#CEFF00]">
                  {t.brandStory.stat1Number}
                </div>
                <div className="text-[10px] font-mono text-[#888] uppercase">
                  {t.brandStory.stat1Label}
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-8">
              <div className="p-4 bg-[#141414] border border-[#242424] space-y-1">
                <div className="text-2xl font-mono font-bold text-[#F1F0EB]">
                  {t.brandStory.stat2Number}
                </div>
                <div className="text-[10px] font-mono text-[#888] uppercase">
                  {t.brandStory.stat2Label}
                </div>
              </div>
              <div className="relative aspect-[3/4] overflow-hidden bg-[#161616] border border-[#222]">
                <img
                  src="https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80"
                  alt="Brutalist atelier"
                  className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition-all duration-700"
                />
                <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/80 text-[9px] font-mono text-[#fff]">
                  SERIES 04 / CAIRO
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Editorial Manifesto */}
          <div className="lg:col-span-7 space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#161616] border border-[#2a2a2a] text-xs font-mono tracking-widest text-[#CEFF00]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>// 04. THE ATELIER MANIFESTO</span>
            </div>

            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] uppercase whitespace-pre-line text-[#F1F0EB]">
              {t.brandStory.headline}
            </h2>

            <div className="space-y-5 text-sm sm:text-base text-[#aaaaaa] leading-relaxed font-normal">
              <p>{t.brandStory.paragraph1}</p>
              <p>{t.brandStory.paragraph2}</p>
            </div>

            {/* Core Values / Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#222]">
              <div className="p-3 bg-[#111] border border-[#1f1f1f] space-y-1">
                <Shield className="w-4 h-4 text-[#CEFF00] mb-2" />
                <div className="text-xs font-mono font-bold text-[#F1F0EB]">HEAVYWEIGHT TERRY</div>
                <div className="text-[11px] text-[#777]">Egyptian dense loopback cotton that holds structural shape.</div>
              </div>

              <div className="p-3 bg-[#111] border border-[#1f1f1f] space-y-1">
                <Feather className="w-4 h-4 text-[#CEFF00] mb-2" />
                <div className="text-xs font-mono font-bold text-[#F1F0EB]">ARCHITECTURAL FIT</div>
                <div className="text-[11px] text-[#777]">Exaggerated dropped shoulders with boxy tailoring.</div>
              </div>

              <div className="p-3 bg-[#111] border border-[#1f1f1f] space-y-1">
                <Sparkles className="w-4 h-4 text-[#CEFF00] mb-2" />
                <div className="text-xs font-mono font-bold text-[#F1F0EB]">NUMBERED DROPS</div>
                <div className="text-[11px] text-[#777]">Strictly limited runs. Never re-printed once archived.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
