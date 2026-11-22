import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { Play, X, Film, Volume2, VolumeX } from 'lucide-react';

export const Campaign: React.FC = () => {
  const { t, language } = useCart();
  const [isPlayingCampaign, setIsPlayingCampaign] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  return (
    <section id="campaign" className="relative py-28 bg-[#090909] text-[#F1F0EB] overflow-hidden border-b border-[#1c1c1c]">
      {/* Background Cinematic Visual with Flash & Concrete Mood */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=1800&q=85"
          alt="Night campaign backdrop"
          className="w-full h-full object-cover object-center filter grayscale brightness-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090909] via-[#090909]/70 to-[#090909]/80" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#141414]/90 backdrop-blur-md border border-[#262626] text-xs font-mono tracking-widest text-[#CEFF00]">
            <Film className="w-3.5 h-3.5" />
            <span>{t.campaign.badge}</span>
          </div>

          <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight uppercase leading-[0.95] text-[#F1F0EB]">
            {t.campaign.headline}
          </h2>

          <p className="text-sm sm:text-base text-[#bbb] leading-relaxed max-w-xl">
            {t.campaign.description}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <button
              onClick={() => setIsPlayingCampaign(true)}
              className="group px-8 py-4 bg-[#CEFF00] hover:bg-[#b8e600] text-[#090909] text-xs font-mono font-bold tracking-widest uppercase transition-all flex items-center gap-3 shadow-[0_0_25px_rgba(206,255,0,0.3)]"
            >
              <div className="w-6 h-6 rounded-full bg-[#090909] text-[#CEFF00] flex items-center justify-center">
                <Play className="w-3 h-3 fill-current ml-0.5" />
              </div>
              <span>{t.campaign.discoverBtn}</span>
            </button>

            <div className="text-[11px] font-mono text-[#888] space-y-0.5">
              <div>{t.campaign.director}</div>
              <div>{t.campaign.location}</div>
            </div>
          </div>
        </div>

        {/* Campaign Visual Filmstrip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-16 pt-8 border-t border-[#222]/80">
          {[
            {
              src: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=600&q=80',
              caption: 'FRAME 01 // OVERSIZED DROP'
            },
            {
              src: 'https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=600&q=80',
              caption: 'FRAME 02 // NIGHT ARCHITECTURE'
            },
            {
              src: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80',
              caption: 'FRAME 03 // MATTE MEMBRANE'
            },
            {
              src: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=600&q=80',
              caption: 'FRAME 04 // FLASH CHRONICLES'
            }
          ].map((item, i) => (
            <div
              key={i}
              onClick={() => setIsPlayingCampaign(true)}
              className="group relative aspect-[3/4] overflow-hidden bg-[#141414] border border-[#222] cursor-pointer"
            >
              <img
                src={item.src}
                alt={item.caption}
                className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
              <div className="absolute bottom-2 left-2 right-2 text-[9px] font-mono text-[#ccc] group-hover:text-[#CEFF00] transition-colors">
                {item.caption}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Campaign Cinema Reel Modal */}
      {isPlayingCampaign && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl bg-[#111] border border-[#333] shadow-2xl p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <div className="flex items-center gap-2 text-xs font-mono text-[#CEFF00]">
                <Film className="w-4 h-4" />
                <span>CAMPAIGN 04 // NO RULES NO LIMITS (PREVIEW)</span>
              </div>
              <button
                onClick={() => setIsPlayingCampaign(false)}
                className="p-1.5 text-[#888] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated High-Res Campaign Video Player */}
            <div className="relative aspect-video w-full bg-[#050505] overflow-hidden flex items-center justify-center border border-[#222]">
              <img
                src="https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1400&q=85"
                alt="Campaign reel"
                className="w-full h-full object-cover filter contrast-125"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-4">
                <span className="w-3 h-3 bg-[#CEFF00] rounded-full animate-ping" />
                <h3 className="text-2xl sm:text-4xl font-black uppercase tracking-widest text-[#F1F0EB]">
                  NO RULES. NO LIMITS.
                </h3>
                <p className="text-xs font-mono text-[#aaa] max-w-md">
                  DIRECTED IN CAIRO // DOWNTOWN CONCRETE MONOLITHS // WINTER 2026
                </p>
              </div>

              {/* Player Controls HUD */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs font-mono text-[#888] bg-black/80 px-4 py-2 border border-[#2a2a2a]">
                <span>00:44 / 02:18</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setIsMuted(!isMuted)} className="hover:text-white">
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <span className="text-[#CEFF00]">4K RAW CINEMA</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
