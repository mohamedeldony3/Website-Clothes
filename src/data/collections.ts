export interface CollectionItem {
  id: string;
  key: string;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  seasonEn: string;
  seasonAr: string;
  itemCount: number;
  image: string;
  accent: string;
}

export const COLLECTIONS: CollectionItem[] = [
  {
    id: 'new-arrivals',
    key: 'new-arrivals',
    titleEn: 'NEW ARRIVALS',
    titleAr: 'أحدث التشكيلات',
    subtitleEn: 'Series 04 / Nocturnal Heavyweight Armor',
    subtitleAr: 'السلسلة 04 / دروع ليلية من الأقمشة الثقيلة',
    seasonEn: 'WINTER 2026',
    seasonAr: 'شتاء 2026',
    itemCount: 14,
    image: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1200&q=85',
    accent: '#CEFF00'
  },
  {
    id: 'oversized',
    key: 'oversized',
    titleEn: 'OVERSIZED',
    titleAr: 'أوفرسايز معمارى',
    subtitleEn: 'Exaggerated volumes & dropped shoulder geometry',
    subtitleAr: 'أحجام مضخمة وهندسة أكتاف ساقطة جريئة',
    seasonEn: 'PERMANENT DROP',
    seasonAr: 'إصدار دائم',
    itemCount: 18,
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1200&q=85',
    accent: '#FFFFFF'
  },
  {
    id: 'essentials',
    key: 'essentials',
    titleEn: 'ESSENTIALS',
    titleAr: 'القطع الأساسية',
    subtitleEn: 'Pure Egyptian compact combed jersey foundations',
    subtitleAr: 'أساسيات قطنية مصرية مضغوطة فائقة النقاء',
    seasonEn: 'ARCHIVE CORE',
    seasonAr: 'جوهر الأرشيف',
    itemCount: 9,
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=85',
    accent: '#898989'
  },
  {
    id: 'outerwear',
    key: 'outerwear',
    titleEn: 'OUTERWEAR',
    titleAr: 'الملابس الخارجية',
    subtitleEn: 'Technical membranes & water-repellent brutalist shields',
    subtitleAr: 'أغشية تقنية ودروع مقاومة للطقس والرياح',
    seasonEn: 'TECHNICAL SERIES',
    seasonAr: 'السلسلة التقنية',
    itemCount: 8,
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1200&q=85',
    accent: '#FF4800'
  },
  {
    id: 'limited-drops',
    key: 'limited-drops',
    titleEn: 'LIMITED DROPS',
    titleAr: 'إصدارات محدودة',
    subtitleEn: 'Numbered runs of 100 pieces per cut worldwide',
    subtitleAr: 'كميات محدودة مرقمة بـ 100 قطعة فقط لكل تصميم',
    seasonEn: 'VAULT ACCESS',
    seasonAr: 'دخول الخزنة',
    itemCount: 4,
    image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1200&q=85',
    accent: '#CEFF00'
  }
];
