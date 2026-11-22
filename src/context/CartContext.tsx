import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, ProductColor, ProductSize, Language, ProductCategory, OrderReceipt, OrderStatus, StoreSettings, CategoryItem, DEFAULT_CATEGORIES } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { PRODUCTS } from '../data/products';
import { INITIAL_SAMPLE_ORDERS } from '../data/initialOrders';
import { CollectionItem, COLLECTIONS } from '../data/collections';

interface CartContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: typeof TRANSLATIONS.en;
  items: CartItem[];
  addToCart: (product: Product, selectedColor: ProductColor, selectedSize: ProductSize, quantity?: number) => void;
  removeFromCart: (productId: string, size: string, colorHex: string) => void;
  updateQuantity: (productId: string, size: string, colorHex: string, newQty: number) => void;
  clearCart: () => void;
  subtotal: number;
  totalItemCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  selectedProduct: Product | null;
  setSelectedProduct: (product: Product | null) => void;
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  activeCategory: ProductCategory;
  setActiveCategory: (cat: ProductCategory) => void;
  formatPrice: (amount: number) => string;

  // Admin & Storefront Reactive Management
  products: Product[];
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  resetProductsToDefault: () => void;

  collections: CollectionItem[];
  addCollection: (collection: CollectionItem) => void;
  updateCollection: (collection: CollectionItem) => void;
  deleteCollection: (id: string) => void;
  resetCollectionsToDefault: () => void;

  orders: OrderReceipt[];
  addOrder: (order: OrderReceipt) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  deleteOrder: (orderId: string) => void;

  // Categories Dynamic Management
  categories: CategoryItem[];
  addCategory: (category: CategoryItem) => void;
  updateCategory: (key: string, updated: Partial<CategoryItem>) => void;
  deleteCategory: (key: string) => boolean;
  resetCategoriesToDefault: () => void;

  storeSettings: StoreSettings;
  updateStoreSettings: (newSettings: Partial<StoreSettings>) => void;

  isAdminOpen: boolean;
  setIsAdminOpen: (open: boolean) => void;
  isAdminAuthenticated: boolean;
  setIsAdminAuthenticated: (auth: boolean) => void;
}

const DEFAULT_SALT = 'mono_default_salt_2026';
const DEFAULT_PASSWORD_HASH = 'd857c98350b81da76d18255d7cad63086b4293dd9ffed688f3f8ba55182a75cc'; // SHA-256 for PIN "1337"

const DEFAULT_SETTINGS: StoreSettings = {
  whatsappNumber: '201099998888',
  freeShippingThreshold: 2500,
  adminPasswordHash: DEFAULT_PASSWORD_HASH,
  adminPasswordSalt: DEFAULT_SALT,
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Check if user has explicitly chosen a language in v2
    const savedV2 = localStorage.getItem('mono_lang_v2');
    if (savedV2 === 'en' || savedV2 === 'ar') return savedV2;
    // Default language is Arabic (العربية)
    return 'ar';
  });

  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('mono_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('mono_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Dynamic Categories Vault (persisted to localStorage)
  const [categories, setCategories] = useState<CategoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('mono_categories_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_CATEGORIES;
  });

  // Dynamic Products Vault (persisted to localStorage)
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('mono_products');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Hydrate code defaults (graphicUrl, frontGraphicUrl, backGraphicUrl, has3DModel, expanded colors) for existing items
          return parsed.map((p: Product) => {
            const defaultProd = PRODUCTS.find((dp) => dp.id === p.id);
            return {
              ...p,
              colors: (p.colors && p.colors.length > 0) ? p.colors : (defaultProd ? defaultProd.colors : []),
              graphicUrl: p.graphicUrl || defaultProd?.graphicUrl,
              frontGraphicUrl: p.frontGraphicUrl || defaultProd?.frontGraphicUrl,
              backGraphicUrl: p.backGraphicUrl || defaultProd?.backGraphicUrl || p.graphicUrl || defaultProd?.graphicUrl,
              has3DModel: p.has3DModel ?? defaultProd?.has3DModel ?? true,
              availableFits: p.availableFits || defaultProd?.availableFits || ['boxy', 'cocoon', 'cropped'],
              availableFinishes: p.availableFinishes || defaultProd?.availableFinishes || ['cotton', 'nylon', 'washed'],
              availableLighting: p.availableLighting || defaultProd?.availableLighting || ['cairo', 'studio', 'cyber'],
              defaultFit: p.defaultFit || defaultProd?.defaultFit || 'boxy',
              defaultFinish: p.defaultFinish || defaultProd?.defaultFinish || 'cotton',
              defaultLighting: p.defaultLighting || defaultProd?.defaultLighting || 'cairo',
            };
          });
        }
      }
    } catch {}
    return PRODUCTS;
  });

  // Dynamic Collections Vault (persisted to localStorage)
  const [collections, setCollections] = useState<CollectionItem[]>(() => {
    try {
      const saved = localStorage.getItem('mono_collections');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return COLLECTIONS;
  });

  // Dynamic Orders Database (persisted to localStorage)
  const [orders, setOrders] = useState<OrderReceipt[]>(() => {
    try {
      const saved = localStorage.getItem('mono_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return INITIAL_SAMPLE_ORDERS;
  });

  // Store Settings (WhatsApp, Shipping, PIN)
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem('mono_settings');
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_SETTINGS;
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return sessionStorage.getItem('mono_admin_auth') === 'true';
  });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeCategory, setActiveCategory] = useState<ProductCategory>('all');

  useEffect(() => {
    localStorage.setItem('mono_cart', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('mono_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('mono_categories_v2', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('mono_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('mono_collections', JSON.stringify(collections));
  }, [collections]);

  useEffect(() => {
    localStorage.setItem('mono_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('mono_settings', JSON.stringify(storeSettings));
  }, [storeSettings]);

  useEffect(() => {
    sessionStorage.setItem('mono_admin_auth', isAdminAuthenticated ? 'true' : 'false');
  }, [isAdminAuthenticated]);

  useEffect(() => {
    localStorage.setItem('mono_lang_v2', language);
    localStorage.setItem('mono_lang', language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const toggleLanguage = () => {
    setLanguageState(prev => prev === 'en' ? 'ar' : 'en');
  };

  const t = TRANSLATIONS[language];

  const addToCart = (
    product: Product,
    selectedColor: ProductColor,
    selectedSize: ProductSize,
    quantity = 1
  ) => {
    setItems(prevItems => {
      const existingIndex = prevItems.findIndex(
        item =>
          item.product.id === product.id &&
          item.selectedSize === selectedSize &&
          item.selectedColor.hex === selectedColor.hex
      );

      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        return [...prevItems, { product, selectedColor, selectedSize, quantity }];
      }
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string, size: string, colorHex: string) => {
    setItems(prev =>
      prev.filter(
        item =>
          !(item.product.id === productId &&
            item.selectedSize === size &&
            item.selectedColor.hex === colorHex)
      )
    );
  };

  const updateQuantity = (productId: string, size: string, colorHex: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(productId, size, colorHex);
      return;
    }
    setItems(prev =>
      prev.map(item => {
        if (
          item.product.id === productId &&
          item.selectedSize === size &&
          item.selectedColor.hex === colorHex
        ) {
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const toggleWishlist = (productId: string) => {
    setWishlist(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalItemCount = items.reduce((count, item) => count + item.quantity, 0);

  const formatPrice = (amount: number): string => {
    const formattedNum = new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-EG', {
      style: 'decimal',
      maximumFractionDigits: 0
    }).format(amount);

    if (language === 'ar') {
      return `${formattedNum} ج.م`;
    }
    return `EGP ${formattedNum}`;
  };

  // Product Management Handlers
  const addProduct = (newProduct: Product) => {
    setProducts(prev => [newProduct, ...prev]);
  };

  const updateProduct = (updated: Product) => {
    setProducts(prev => prev.map(p => (p.id === updated.id ? updated : p)));
    // If currently selected product was edited, update selectedProduct as well
    if (selectedProduct && selectedProduct.id === updated.id) {
      setSelectedProduct(updated);
    }
  };

  const deleteProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

  const resetProductsToDefault = () => {
    setProducts(PRODUCTS);
    localStorage.setItem('mono_products', JSON.stringify(PRODUCTS));
  };

  // Collection Management Handlers
  const addCollection = (newCol: CollectionItem) => {
    setCollections(prev => [...prev, newCol]);
  };

  const updateCollection = (updated: CollectionItem) => {
    setCollections(prev => prev.map(c => (c.id === updated.id ? updated : c)));
  };

  const deleteCollection = (id: string) => {
    setCollections(prev => prev.filter(c => c.id !== id));
  };

  const resetCollectionsToDefault = () => {
    setCollections(COLLECTIONS);
    localStorage.setItem('mono_collections', JSON.stringify(COLLECTIONS));
  };

  // Order Management Handlers
  const addOrder = (newOrder: OrderReceipt) => {
    const stampedOrder: OrderReceipt = {
      ...newOrder,
      status: newOrder.status || 'new',
    };
    setOrders(prev => [stampedOrder, ...prev]);
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prev =>
      prev.map(order => (order.orderId === orderId ? { ...order, status } : order))
    );
  };

  const deleteOrder = (orderId: string) => {
    setOrders(prev => prev.filter(order => order.orderId !== orderId));
  };

  const addCategory = (category: CategoryItem) => {
    setCategories(prev => {
      const slug = category.key.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '-');
      if (prev.some(c => c.key === slug)) return prev;
      return [...prev, { ...category, key: slug }];
    });
  };

  const updateCategory = (key: string, updated: Partial<CategoryItem>) => {
    setCategories(prev =>
      prev.map(c => (c.key === key ? { ...c, ...updated } : c))
    );
  };

  const deleteCategory = (key: string): boolean => {
    // Prevent deletion if only 1 category remains
    if (categories.length <= 1) return false;
    setCategories(prev => prev.filter(c => c.key !== key));
    // If active category was deleted, fallback to 'all'
    if (activeCategory === key) {
      setActiveCategory('all');
    }
    return true;
  };

  const resetCategoriesToDefault = () => {
    setCategories(DEFAULT_CATEGORIES);
    localStorage.removeItem('mono_categories_v2');
  };

  const updateStoreSettings = (newSettings: Partial<StoreSettings>) => {
    setStoreSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <CartContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        totalItemCount,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        isSearchOpen,
        setIsSearchOpen,
        selectedProduct,
        setSelectedProduct,
        wishlist,
        toggleWishlist,
        isInWishlist,
        activeCategory,
        setActiveCategory,
        formatPrice,

        products,
        addProduct,
        updateProduct,
        deleteProduct,
        resetProductsToDefault,

        collections,
        addCollection,
        updateCollection,
        deleteCollection,
        resetCollectionsToDefault,

        orders,
        addOrder,
        updateOrderStatus,
        deleteOrder,

        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        resetCategoriesToDefault,

        storeSettings,
        updateStoreSettings,

        isAdminOpen,
        setIsAdminOpen,
        isAdminAuthenticated,
        setIsAdminAuthenticated,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
