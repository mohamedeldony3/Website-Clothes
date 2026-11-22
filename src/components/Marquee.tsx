import React from 'react';

export const Marquee: React.FC = () => {
  const items = [
    'MONO / STUDIO',
    'EDITION 04',
    'HEAVYWEIGHT 520 GSM',
    'CAIRO EXPERIMENTAL LAB',
    'ARCHITECTURAL SILHOUETTES',
    'WORLDWIDE DISPATCH',
    'NO RULES JUST IDENTITY',
    'BRUTALIST LUXURY',
    'PURE EGYPTIAN TEXTILES',
  ];

  return (
    <div className="w-full bg-[#111] border-y border-[#222] py-3.5 overflow-hidden select-none">
      <div className="flex whitespace-nowrap animate-marquee">
        {[...items, ...items, ...items].map((text, idx) => (
          <div key={idx} className="flex items-center gap-6 mx-4">
            <span className="text-xs sm:text-sm font-mono font-bold tracking-widest text-[#F1F0EB] uppercase">
              {text}
            </span>
            <span className="w-2 h-2 bg-[#CEFF00] rotate-45 inline-block" />
          </div>
        ))}
      </div>
    </div>
  );
};
