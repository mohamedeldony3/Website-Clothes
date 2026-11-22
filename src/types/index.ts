export type Language = 'en' | 'ar';

export type ProductCategory = string;

export interface CategoryItem {
  key: string;       // unique slug, e.g. 'oversized', 'jackets'
  labelEn: string;   // English name
  labelAr: string;   // Arabic name
}

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  { key: 'new-arrivals', labelEn: 'NEW ARRIVALS', labelAr: 'أحدث التشكيلات' },
  { key: 'oversized', labelEn: 'OVERSIZED', labelAr: 'أوفرسايز' },
  { key: 'essentials', labelEn: 'ESSENTIALS', labelAr: 'الأساسيات' },
  { key: 'outerwear', labelEn: 'OUTERWEAR', labelAr: 'ملابس خارجية' },
  { key: 'limited-drops', labelEn: 'LIMITED DROPS', labelAr: 'إصدارات محدودة' },
];

export type HoodieFit = 'boxy' | 'cocoon' | 'cropped';
export type HoodieFinish = 'cotton' | 'nylon' | 'washed';
export type LightingMood = 'cairo' | 'studio' | 'cyber';

export interface ProductColor {
  name: string;
  nameAr: string;
  hex: string;
  threeColor: string;
}

export type ProductSize = 'S' | 'M' | 'L' | 'XL' | 'XXL' | '3XL' | string;

export interface Product {
  id: string;
  name: string;
  nameAr: string;
  category: ProductCategory;
  price: number; // in EGP
  originalPrice?: number;
  description: string;
  descriptionAr: string;
  details: string[];
  detailsAr: string[];
  fabric: string;
  fabricAr: string;
  weightGsm: number;
  fit: string;
  fitAr: string;
  sizes: ProductSize[];
  colors: ProductColor[];
  images: string[];
  graphicUrl?: string;
  frontGraphicUrl?: string;
  backGraphicUrl?: string;
  badge?: string;
  badgeAr?: string;
  has3DModel?: boolean;
  featured?: boolean;
  // 3D Fitting Lab Configurator Controls
  availableFits?: HoodieFit[];
  availableFinishes?: HoodieFinish[];
  availableLighting?: LightingMood[];
  defaultFit?: HoodieFit;
  defaultFinish?: HoodieFinish;
  defaultLighting?: LightingMood;
}

export interface CartItem {
  product: Product;
  selectedColor: ProductColor;
  selectedSize: ProductSize;
  quantity: number;
}

export interface EgyptianGovernorate {
  id: string;
  nameEn: string;
  nameAr: string;
  shippingFee: number; // EGP
}

export interface CheckoutFormData {
  fullName: string;
  phone: string;
  governorate: string;
  city: string;
  streetAddress: string;
  notes: string;
  paymentMethod: 'cod';
}

export type OrderStatus = 'new' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderReceipt {
  orderId: string;
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  customer: CheckoutFormData;
  createdAt: string;
  status?: OrderStatus;
}

export interface StoreSettings {
  whatsappNumber: string;
  freeShippingThreshold: number;
  adminPin?: string; // deprecated legacy fallback
  adminPasswordHash?: string;
  adminPasswordSalt?: string;
}
