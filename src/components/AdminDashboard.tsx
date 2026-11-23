import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { Product, OrderReceipt, OrderStatus, ProductCategory, ProductColor, ProductSize, HoodieFit, HoodieFinish, LightingMood, CategoryItem, StoreSettings } from '../types';
import { CollectionItem } from '../data/collections';
import {
  hashPasswordWithSalt,
  generateCryptographicSalt,
  getPersistentRateLimit,
  recordFailedAttempt,
  resetRateLimit,
} from '../utils/security';
import {
  X,
  Lock,
  Unlock,
  Package,
  ShoppingCart,
  TrendingUp,
  Settings,
  Plus,
  Edit2,
  Trash2,
  Phone,
  CheckCircle2,
  Clock,
  Truck,
  RotateCcw,
  Search,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Save,
  MessageSquare,
  LogOut,
  ChevronRight,
  Filter,
  Upload,
  Image as ImageIcon,
  Palette,
  Check,
  Eye,
  Layers,
  Sparkles,
  Ruler,
  Box,
  ArrowUpRight,
  Tag,
  KeyRound
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const {
    isAdminOpen,
    setIsAdminOpen,
    isAdminAuthenticated,
    setIsAdminAuthenticated,
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
    updateOrderStatus,
    deleteOrder,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    resetCategoriesToDefault,
    storeSettings,
    updateStoreSettings,
    formatPrice,
    language,
  } = useCart();

  // Authentication & Persistent Rate-Limiting State
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState(getPersistentRateLimit);

  // Live countdown timer for brute-force lockouts
  useEffect(() => {
    const timer = setInterval(() => {
      const info = getPersistentRateLimit();
      setRateLimitInfo(info);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Dashboard Tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'categories' | 'collections' | 'orders' | 'settings'>('overview');

  // Product Editing / Creation State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');

  // Categories Editing / Creation State
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ key: '', labelEn: '', labelAr: '' });
  const [categoryError, setCategoryError] = useState('');

  // Collections Editing / Creation State
  const [editingCollection, setEditingCollection] = useState<CollectionItem | null>(null);
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [collectionSearch, setCollectionSearch] = useState('');

  // Order Filtering State
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState('');

  // Settings Form State
  const [settingsForm, setSettingsForm] = useState({
    whatsappNumber: storeSettings.whatsappNumber,
    freeShippingThreshold: storeSettings.freeShippingThreshold,
    newPin: '',
    confirmPin: '',
  });
  const [settingsSavedMessage, setSettingsSavedMessage] = useState(false);

  // Handle Cryptographically Secure PIN Submission with Brute-Force Rate Limiting
  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const currentLimit = getPersistentRateLimit();
    if (currentLimit.isLocked || currentLimit.isCooldown || isSubmittingAuth) {
      setRateLimitInfo(currentLimit);
      return;
    }

    setIsSubmittingAuth(true);
    try {
      const salt = storeSettings.adminPasswordSalt || 'mono_default_salt_2026';
      const targetHash = storeSettings.adminPasswordHash || 'd857c98350b81da76d18255d7cad63086b4293dd9ffed688f3f8ba55182a75cc';
      const inputHash = await hashPasswordWithSalt(pinInput, salt);

      // Legacy fallback check (migrates old plaintext PIN on successful login)
      const isLegacyPinMatch = storeSettings.adminPin && pinInput === storeSettings.adminPin;

      if (inputHash === targetHash || isLegacyPinMatch) {
        resetRateLimit();
        setRateLimitInfo({ isLocked: false, remainingSeconds: 0, failedAttempts: 0, isCooldown: false });
        setIsAdminAuthenticated(true);
        setPinInput('');
        setPinError(false);

        // Auto-upgrade legacy PIN to cryptographic hash and salt
        if (isLegacyPinMatch && (!storeSettings.adminPasswordHash || storeSettings.adminPin)) {
          const freshSalt = generateCryptographicSalt();
          const freshHash = await hashPasswordWithSalt(pinInput, freshSalt);
          updateStoreSettings({
            adminPasswordHash: freshHash,
            adminPasswordSalt: freshSalt,
            adminPin: undefined,
          });
        }
      } else {
        const updated = recordFailedAttempt();
        setRateLimitInfo(updated);
        setPinError(true);
        setPinInput('');
      }
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleLogout = () => {
    setIsAdminAuthenticated(false);
    setPinInput('');
  };

  // Analytics Calculations
  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => (o.status !== 'cancelled' ? sum + o.total : sum), 0);
    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === 'delivered').length;
    const pendingOrders = orders.filter(o => o.status === 'new' || o.status === 'processing').length;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    return {
      totalRevenue,
      totalOrders,
      completedOrders,
      pendingOrders,
      avgOrderValue,
    };
  }, [orders]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch =
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.nameAr.includes(productSearch) ||
        p.id.toLowerCase().includes(productSearch.toLowerCase());
      const matchesCat = productCategoryFilter === 'all' || p.category === productCategoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [products, productSearch, productCategoryFilter]);

  // Filtered Collections
  const filteredCollections = useMemo(() => {
    return collections.filter(c => {
      const q = collectionSearch.toLowerCase();
      return (
        c.titleEn.toLowerCase().includes(q) ||
        c.titleAr.includes(collectionSearch) ||
        c.subtitleEn.toLowerCase().includes(q) ||
        c.subtitleAr.includes(collectionSearch) ||
        c.seasonEn.toLowerCase().includes(q) ||
        c.seasonAr.includes(collectionSearch) ||
        c.key.toLowerCase().includes(q)
      );
    });
  }, [collections, collectionSearch]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
      const matchesSearch =
        o.orderId.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.customer.fullName.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.customer.phone.includes(orderSearch);
      return matchesStatus && matchesSearch;
    });
  }, [orders, orderStatusFilter, orderSearch]);

  if (!isAdminOpen) return null;

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const updates: Partial<StoreSettings> = {
      whatsappNumber: settingsForm.whatsappNumber.replace(/[^0-9]/g, ''),
      freeShippingThreshold: Number(settingsForm.freeShippingThreshold) || 2500,
    };

    if (settingsForm.newPin && settingsForm.newPin === settingsForm.confirmPin && settingsForm.newPin.length >= 4) {
      const salt = generateCryptographicSalt();
      const hash = await hashPasswordWithSalt(settingsForm.newPin, salt);
      updates.adminPasswordHash = hash;
      updates.adminPasswordSalt = salt;
      updates.adminPin = undefined; // purge plaintext from storage
      setSettingsForm(prev => ({ ...prev, newPin: '', confirmPin: '' }));
    }

    updateStoreSettings(updates);
    setSettingsSavedMessage(true);
    setTimeout(() => setSettingsSavedMessage(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/95 backdrop-blur-2xl flex items-center justify-center p-2 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-7xl bg-[#090909] border border-[#262626] shadow-2xl min-h-[85vh] sm:min-h-[750px] max-h-[96vh] flex flex-col overflow-hidden my-auto">
        {/* Top Command Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 bg-[#111] border-b border-[#222]">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 bg-[#CEFF00] rounded-none animate-pulse" />
            <span className="font-mono font-bold text-xs sm:text-sm tracking-widest text-[#F1F0EB] uppercase">
              MONO / STUDIO • COMMAND CENTER
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 border border-[#333] text-[#777] uppercase hidden sm:inline-block">
              INTERNAL ARCHIVE
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isAdminAuthenticated && (
              <button
                onClick={handleLogout}
                title="Lock Terminal"
                className="px-3 py-1.5 text-xs font-mono text-[#888] hover:text-[#CEFF00] border border-[#262626] hover:border-[#CEFF00] transition-colors flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">LOGOUT</span>
              </button>
            )}

            <button
              onClick={() => setIsAdminOpen(false)}
              className="p-1.5 text-[#777] hover:text-white border border-transparent hover:border-[#333] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Auth Gate: Cryptographic Password & Brute-Force Rate Limiting */}
        {!isAdminAuthenticated ? (
          <div className="flex-1 flex items-center justify-center p-6 bg-[#0a0a0a]">
            <div className="w-full max-w-sm p-8 bg-[#111] border border-[#242424] text-center space-y-6">
              <div className="w-12 h-12 mx-auto bg-[#1a1a1a] border border-[#333] flex items-center justify-center text-[#CEFF00]">
                {rateLimitInfo.isLocked ? (
                  <AlertTriangle className="w-6 h-6 text-red-500 animate-pulse" />
                ) : (
                  <Lock className="w-6 h-6" />
                )}
              </div>

              <div>
                <h3 className="text-lg font-mono font-bold uppercase tracking-wider text-white">
                  RESTRICTED PORTAL
                </h3>
                <p className="text-xs font-mono text-[#777] mt-1">
                  {language === 'ar'
                    ? 'أدخل رمز الحماية المشفر للوصول إلى لوحة التحكم'
                    : 'Enter Master Security PIN to access Studio Management.'}
                </p>
              </div>

              <form onSubmit={handlePinSubmit} className="space-y-4">
                <div>
                  <input
                    type="password"
                    maxLength={16}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="••••"
                    autoFocus
                    disabled={rateLimitInfo.isLocked || isSubmittingAuth}
                    className="w-full text-center text-2xl font-mono tracking-[0.4em] bg-[#090909] border border-[#333] focus:border-[#CEFF00] text-[#CEFF00] py-3 outline-none transition-colors disabled:opacity-30 disabled:border-red-900"
                  />

                  {rateLimitInfo.isLocked ? (
                    <div className="p-3 bg-red-950/60 border border-red-500/80 text-red-400 font-mono text-xs mt-3 flex items-center justify-center gap-1.5 animate-pulse">
                      <Clock className="w-4 h-4 shrink-0" />
                      <span>
                        {language === 'ar'
                          ? `المحاولات محظورة مؤقتاً! متبقي ${rateLimitInfo.remainingSeconds} ثانية`
                          : `Rate limit active! Lockout: ${rateLimitInfo.remainingSeconds}s remaining`}
                      </span>
                    </div>
                  ) : pinError ? (
                    <p className="text-[11px] font-mono text-red-500 mt-2 flex items-center justify-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {language === 'ar'
                        ? `رمز الحماية غير صحيح. محاولة ${rateLimitInfo.failedAttempts}/3`
                        : `Invalid Security PIN. Attempt ${rateLimitInfo.failedAttempts}/3`}
                    </p>
                  ) : null}
                </div>

                <button
                  type="submit"
                  disabled={pinInput.length < 4 || rateLimitInfo.isLocked || isSubmittingAuth}
                  className="w-full py-3 bg-[#CEFF00] hover:bg-[#b8e600] disabled:opacity-40 disabled:hover:bg-[#CEFF00] text-black font-mono font-bold text-xs tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(206,255,0,0.2)] flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {isSubmittingAuth
                      ? (language === 'ar' ? 'جارٍ التحقق المشفر...' : 'VERIFYING...')
                      : (language === 'ar' ? 'تأكيد تسجيل الدخول' : 'AUTHENTICATE TERMINAL')}
                  </span>
                </button>
              </form>

              <div className="pt-2 text-[10px] font-mono text-[#555] border-t border-[#1a1a1a] flex items-center justify-between">
                <span>SHA-256 + SALT ENCRYPTION</span>
                <span className="text-[#888]">DEFAULT: 1337</span>
              </div>
            </div>
          </div>
        ) : (
          /* Main Authenticated Dashboard */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Navigation Tabs Bar */}
            <div className="flex items-center gap-1 px-6 bg-[#0c0c0c] border-b border-[#1e1e1e] overflow-x-auto scrollbar-none">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-3.5 px-4 text-xs font-mono tracking-wider uppercase transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'border-[#CEFF00] text-[#CEFF00] font-bold bg-[#141414]'
                    : 'border-transparent text-[#777] hover:text-[#ccc]'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>ANALYTICS & OVERVIEW</span>
              </button>

              <button
                onClick={() => setActiveTab('products')}
                className={`py-3.5 px-4 text-xs font-mono tracking-wider uppercase transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'products'
                    ? 'border-[#CEFF00] text-[#CEFF00] font-bold bg-[#141414]'
                    : 'border-transparent text-[#777] hover:text-[#ccc]'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>PRODUCTS VAULT</span>
                <span className="px-1.5 py-0.2 bg-[#222] text-[10px] rounded-none text-[#aaa]">
                  {products.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('categories')}
                className={`py-3.5 px-4 text-xs font-mono tracking-wider uppercase transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'categories'
                    ? 'border-[#CEFF00] text-[#CEFF00] font-bold bg-[#141414]'
                    : 'border-transparent text-[#777] hover:text-[#ccc]'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>CATEGORIES (الأقسام)</span>
                <span className="px-1.5 py-0.2 bg-[#222] text-[10px] rounded-none text-[#aaa]">
                  {categories.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('collections')}
                className={`py-3.5 px-4 text-xs font-mono tracking-wider uppercase transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'collections'
                    ? 'border-[#CEFF00] text-[#CEFF00] font-bold bg-[#141414]'
                    : 'border-transparent text-[#777] hover:text-[#ccc]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>COLLECTIONS (التشكيلات)</span>
                <span className="px-1.5 py-0.2 bg-[#222] text-[10px] rounded-none text-[#aaa]">
                  {collections.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('orders')}
                className={`py-3.5 px-4 text-xs font-mono tracking-wider uppercase transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'orders'
                    ? 'border-[#CEFF00] text-[#CEFF00] font-bold bg-[#141414]'
                    : 'border-transparent text-[#777] hover:text-[#ccc]'
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>CUSTOMER ORDERS</span>
                {stats.pendingOrders > 0 && (
                  <span className="px-1.5 py-0.2 bg-[#CEFF00] text-[10px] font-bold text-black">
                    {stats.pendingOrders} NEW
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`py-3.5 px-4 text-xs font-mono tracking-wider uppercase transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'settings'
                    ? 'border-[#CEFF00] text-[#CEFF00] font-bold bg-[#141414]'
                    : 'border-transparent text-[#777] hover:text-[#ccc]'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>STORE SETTINGS</span>
              </button>
            </div>

            {/* Dashboard Content Container */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#090909]">
              {/* ================= TAB 1: OVERVIEW & ANALYTICS ================= */}
              {activeTab === 'overview' && (
                <div className="space-y-8 animate-in fade-in duration-150">
                  {/* KPI Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 bg-[#111] border border-[#222] relative overflow-hidden">
                      <div className="text-[10px] font-mono text-[#777] uppercase tracking-wider">
                        TOTAL RECORDED REVENUE
                      </div>
                      <div className="text-2xl sm:text-3xl font-mono font-black text-[#CEFF00] mt-2">
                        {formatPrice(stats.totalRevenue)}
                      </div>
                      <div className="text-[11px] font-mono text-[#888] mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#CEFF00]" />
                        <span>Active Orders in Pipeline</span>
                      </div>
                    </div>

                    <div className="p-5 bg-[#111] border border-[#222] relative overflow-hidden">
                      <div className="text-[10px] font-mono text-[#777] uppercase tracking-wider">
                        TOTAL ORDERS
                      </div>
                      <div className="text-2xl sm:text-3xl font-mono font-black text-white mt-2">
                        {stats.totalOrders}
                      </div>
                      <div className="text-[11px] font-mono text-[#888] mt-1 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>{stats.pendingOrders} Processing / Awaiting Dispatch</span>
                      </div>
                    </div>

                    <div className="p-5 bg-[#111] border border-[#222] relative overflow-hidden">
                      <div className="text-[10px] font-mono text-[#777] uppercase tracking-wider">
                        AVERAGE ORDER VALUE
                      </div>
                      <div className="text-2xl sm:text-3xl font-mono font-black text-white mt-2">
                        {formatPrice(stats.avgOrderValue)}
                      </div>
                      <div className="text-[11px] font-mono text-[#888] mt-1 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-[#90b8ff]" />
                        <span>Egyptian Luxury Segment</span>
                      </div>
                    </div>

                    <div className="p-5 bg-[#111] border border-[#222] relative overflow-hidden">
                      <div className="text-[10px] font-mono text-[#777] uppercase tracking-wider">
                        ACTIVE 3D DESIGNS
                      </div>
                      <div className="text-2xl sm:text-3xl font-mono font-black text-white mt-2">
                        {products.length} PIECES
                      </div>
                      <div className="text-[11px] font-mono text-[#888] mt-1 flex items-center gap-1">
                        <Package className="w-3.5 h-3.5 text-[#CEFF00]" />
                        <span>Cloth PBR Ready</span>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity & Pipeline Feed */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Recent Orders List */}
                    <div className="lg:col-span-8 bg-[#111] border border-[#222] p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-mono font-bold tracking-widest text-[#F1F0EB] uppercase">
                          RECENT CUSTOMER TRANSACTIONS
                        </h4>
                        <button
                          onClick={() => setActiveTab('orders')}
                          className="text-[10px] font-mono text-[#CEFF00] hover:underline flex items-center gap-1"
                        >
                          VIEW ALL ({orders.length}) <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>

                      {orders.length === 0 ? (
                        <div className="text-center py-10 text-xs font-mono text-[#666]">
                          NO TRANSACTIONS RECORDED YET
                        </div>
                      ) : (
                        <div className="divide-y divide-[#1e1e1e]">
                          {orders.slice(0, 5).map((order) => (
                            <div key={order.orderId} className="py-3.5 flex items-center justify-between gap-4">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-xs text-white">
                                    #{order.orderId}
                                  </span>
                                  <span
                                    className={`text-[9px] font-mono px-2 py-0.5 uppercase ${
                                      order.status === 'delivered'
                                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                        : order.status === 'shipped'
                                        ? 'bg-blue-950 text-blue-400 border border-blue-800'
                                        : order.status === 'cancelled'
                                        ? 'bg-red-950 text-red-400 border border-red-800'
                                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                                    }`}
                                  >
                                    {order.status || 'new'}
                                  </span>
                                </div>
                                <div className="text-[11px] font-mono text-[#888] mt-1">
                                  {order.customer.fullName} • {order.customer.city}, {order.customer.governorate}
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="font-mono font-bold text-xs text-[#CEFF00]">
                                  {formatPrice(order.total)}
                                </div>
                                <div className="text-[10px] font-mono text-[#666]">
                                  {new Date(order.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Quick Store Summary */}
                    <div className="lg:col-span-4 bg-[#111] border border-[#222] p-5 space-y-4">
                      <h4 className="text-xs font-mono font-bold tracking-widest text-[#F1F0EB] uppercase">
                        BUSINESS DISPATCH HUD
                      </h4>

                      <div className="p-3 bg-[#0a0a0a] border border-[#1e1e1e] space-y-2 text-xs font-mono">
                        <div className="flex justify-between text-[#888]">
                          <span>WhatsApp Dispatch:</span>
                          <span className="text-[#CEFF00]">+{storeSettings.whatsappNumber}</span>
                        </div>
                        <div className="flex justify-between text-[#888]">
                          <span>Free Shipping:</span>
                          <span className="text-white">Over {formatPrice(storeSettings.freeShippingThreshold)}</span>
                        </div>
                        <div className="flex justify-between text-[#888]">
                          <span>Currency:</span>
                          <span className="text-white">Egyptian Pounds (EGP)</span>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={() => setIsCreatingProduct(true)}
                          className="w-full py-3 bg-[#181818] hover:bg-[#222] border border-[#333] hover:border-[#CEFF00] text-xs font-mono text-white transition-all flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4 text-[#CEFF00]" />
                          <span>ADD NEW HOODIE TO VAULT</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= TAB 2: PRODUCTS MANAGEMENT ================= */}
              {activeTab === 'products' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  {/* Top Product Controls Bar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#111] p-4 border border-[#222]">
                    <div className="flex items-center gap-3 flex-1 max-w-md bg-[#090909] border border-[#2c2c2c] px-3 py-2">
                      <Search className="w-4 h-4 text-[#666]" />
                      <input
                        type="text"
                        placeholder="Search by product name, ID, or Arabic title..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="bg-transparent text-xs font-mono text-white outline-none w-full placeholder-[#555]"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={productCategoryFilter}
                        onChange={(e) => setProductCategoryFilter(e.target.value)}
                        className="bg-[#090909] border border-[#2c2c2c] text-xs font-mono text-[#aaa] px-3 py-2 outline-none focus:border-[#CEFF00] cursor-pointer"
                      >
                        <option value="all" className="bg-[#141414] text-white">ALL CATEGORIES ({products.length})</option>
                        {categories
                          .filter((c, idx, arr) => arr.findIndex((x) => x.key.toLowerCase() === c.key.toLowerCase()) === idx)
                          .map((c) => (
                            <option key={c.key} value={c.key} className="bg-[#141414] text-white">
                              {c.labelEn} ({c.labelAr})
                            </option>
                          ))}
                      </select>

                      <button
                        onClick={() => setIsCreatingProduct(true)}
                        className="px-4 py-2 bg-[#CEFF00] hover:bg-[#b8e600] text-black font-mono font-bold text-xs tracking-wider uppercase transition-all flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>NEW PIECE</span>
                      </button>

                      <button
                        onClick={resetProductsToDefault}
                        title="Reset Catalog to 8 Original Factory Drops"
                        className="px-3 py-2 bg-[#181818] hover:bg-[#222] border border-[#333] text-xs font-mono text-[#888] hover:text-white transition-all flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">RESET</span>
                      </button>
                    </div>
                  </div>

                  {/* Products Grid / Table */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {filteredProducts.map((prod) => (
                      <div key={prod.id} className="bg-[#111] border border-[#222] p-4 flex flex-col justify-between group hover:border-[#444] transition-all">
                        <div>
                          {/* Image & Badges */}
                          <div className="relative aspect-[4/5] bg-[#0c0c0c] border border-[#1e1e1e] overflow-hidden mb-3">
                            <img
                              src={prod.images[0]}
                              alt={prod.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            {prod.badge && (
                              <span className="absolute top-2 left-2 px-2 py-0.5 text-[9px] font-mono tracking-wider bg-[#CEFF00] text-black font-bold uppercase">
                                {prod.badge}
                              </span>
                            )}
                            {prod.has3DModel && (
                              <span className="absolute top-2 right-2 px-1.5 py-0.5 text-[9px] font-mono tracking-wider bg-black/80 border border-[#333] text-[#CEFF00] uppercase">
                                3D PBR
                              </span>
                            )}
                          </div>

                          <h5 className="font-mono font-bold text-xs uppercase text-white line-clamp-1">
                            {prod.name}
                          </h5>
                          <p className="text-[11px] font-mono text-[#888] mt-0.5 line-clamp-1">
                            {prod.nameAr}
                          </p>

                          <div className="flex items-baseline gap-2 mt-2 font-mono">
                            <span className="text-sm font-bold text-[#CEFF00]">
                              {formatPrice(prod.price)}
                            </span>
                            {prod.originalPrice && (
                              <span className="text-[11px] text-[#555] line-through">
                                {formatPrice(prod.originalPrice)}
                              </span>
                            )}
                          </div>

                          <div className="text-[10px] font-mono text-[#666] mt-2 flex items-center gap-2">
                            <span>GSM: {prod.weightGsm || 500}</span>
                            <span>•</span>
                            <span>{prod.sizes.join(', ')}</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pt-4 mt-4 border-t border-[#1a1a1a]">
                          <button
                            onClick={() => setEditingProduct(prod)}
                            className="flex-1 py-1.5 bg-[#181818] hover:bg-[#252525] border border-[#333] hover:border-[#CEFF00] text-[11px] font-mono text-[#ccc] hover:text-[#CEFF00] transition-colors flex items-center justify-center gap-1.5"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>EDIT</span>
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Archive and remove "${prod.name}" from public vault?`)) {
                                deleteProduct(prod.id);
                              }
                            }}
                            className="p-1.5 bg-[#181818] hover:bg-red-950/60 border border-[#333] hover:border-red-600 text-[#777] hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ================= TAB: EDITORIAL COLLECTIONS ================= */}
              {activeTab === 'collections' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  {/* Top Collections Controls Bar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#111] p-4 border border-[#222]">
                    <div className="flex items-center gap-3 flex-1 max-w-md bg-[#090909] border border-[#2c2c2c] px-3 py-2">
                      <Search className="w-4 h-4 text-[#666]" />
                      <input
                        type="text"
                        placeholder="Search collections by title, season, or slug..."
                        value={collectionSearch}
                        onChange={(e) => setCollectionSearch(e.target.value)}
                        className="bg-transparent text-xs font-mono text-white outline-none w-full placeholder-[#555]"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsCreatingCollection(true)}
                        className="px-4 py-2 bg-[#CEFF00] hover:bg-[#b8e600] text-black font-mono font-bold text-xs tracking-wider uppercase transition-all flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>NEW COLLECTION // إضافة تشكيلة</span>
                      </button>

                      <button
                        onClick={resetCollectionsToDefault}
                        title="Reset Collections to 5 Factory Presets"
                        className="px-3 py-2 bg-[#181818] hover:bg-[#222] border border-[#333] text-xs font-mono text-[#888] hover:text-white transition-all flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">RESET</span>
                      </button>
                    </div>
                  </div>

                  {/* Collections Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredCollections.map((col, idx) => (
                      <div
                        key={col.id}
                        className="bg-[#111] border border-[#222] p-4 flex flex-col justify-between group hover:border-[#444] transition-all relative overflow-hidden"
                      >
                        <div>
                          {/* Accent Line */}
                          <div
                            className="h-1 -mt-4 -mx-4 mb-3"
                            style={{ backgroundColor: col.accent || '#CEFF00' }}
                          />

                          {/* Image & Badges */}
                          <div className="relative aspect-[16/10] bg-[#0c0c0c] border border-[#1e1e1e] overflow-hidden mb-3">
                            <img
                              src={col.image}
                              alt={col.titleEn}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-2 start-2 flex items-center gap-1.5">
                              <span className="px-2 py-0.5 text-[9px] font-mono tracking-wider bg-[#CEFF00] text-black font-bold uppercase shadow-sm">
                                {col.seasonAr || col.seasonEn}
                              </span>
                              <span className="px-1.5 py-0.5 text-[9px] font-mono tracking-wider bg-black/80 border border-[#333] text-white">
                                {col.itemCount} قطع
                              </span>
                            </div>
                            <div className="absolute bottom-2 start-2 text-[9px] font-mono text-[#aaa] bg-black/75 px-1.5 py-0.5 border border-[#222]">
                              #{idx + 1} • key: {col.key}
                            </div>
                          </div>

                          <h5 className="font-mono font-black text-sm uppercase text-white line-clamp-1">
                            {col.titleEn}
                          </h5>
                          <h6 className="text-xs font-bold text-[#CEFF00] mt-0.5 line-clamp-1">
                            {col.titleAr}
                          </h6>

                          <p className="text-[11px] font-mono text-[#aaa] mt-1.5 line-clamp-2">
                            {col.subtitleAr}
                          </p>
                          <p className="text-[10px] font-mono text-[#666] mt-0.5 line-clamp-1">
                            {col.subtitleEn}
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pt-4 mt-4 border-t border-[#1a1a1a]">
                          <button
                            onClick={() => setEditingCollection(col)}
                            className="flex-1 py-1.5 bg-[#181818] hover:bg-[#252525] border border-[#333] hover:border-[#CEFF00] text-[11px] font-mono text-[#ccc] hover:text-[#CEFF00] transition-colors flex items-center justify-center gap-1.5"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>تعديل (EDIT)</span>
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete collection "${col.titleEn}" / "${col.titleAr}"?`)) {
                                deleteCollection(col.id);
                              }
                            }}
                            className="p-1.5 bg-[#181818] hover:bg-red-950/60 border border-[#333] hover:border-red-600 text-[#777] hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ================= TAB 3: CUSTOMER ORDERS ================= */}
              {activeTab === 'orders' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  {/* Top Order Filters */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#111] p-4 border border-[#222]">
                    <div className="flex items-center gap-3 flex-1 max-w-md bg-[#090909] border border-[#2c2c2c] px-3 py-2">
                      <Search className="w-4 h-4 text-[#666]" />
                      <input
                        type="text"
                        placeholder="Search by Order ID, customer name, or phone number..."
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        className="bg-transparent text-xs font-mono text-white outline-none w-full placeholder-[#555]"
                      />
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto">
                      {(['all', 'new', 'processing', 'shipped', 'delivered', 'cancelled'] as (string)[]).map((st) => (
                        <button
                          key={st}
                          onClick={() => setOrderStatusFilter(st)}
                          className={`px-3 py-1.5 text-xs font-mono tracking-wider uppercase border transition-all ${
                            orderStatusFilter === st
                              ? 'bg-[#CEFF00] text-black border-[#CEFF00] font-bold'
                              : 'bg-[#141414] text-[#888] border-[#2c2c2c] hover:text-white'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Orders Cards List */}
                  {filteredOrders.length === 0 ? (
                    <div className="text-center py-16 bg-[#111] border border-[#222] space-y-2">
                      <ShoppingCart className="w-8 h-8 text-[#555] mx-auto" />
                      <p className="text-xs font-mono text-[#888]">NO MATCHING ORDERS FOUND</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredOrders.map((order) => (
                        <div key={order.orderId} className="bg-[#111] border border-[#222] p-5 space-y-4">
                          {/* Order Header */}
                          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1c1c1c] pb-3">
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold text-sm text-white">
                                #{order.orderId}
                              </span>
                              <span className="text-[11px] font-mono text-[#777]">
                                {new Date(order.createdAt).toLocaleString()}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              {/* Change Status Dropdown */}
                              <select
                                value={order.status || 'new'}
                                onChange={(e) => updateOrderStatus(order.orderId, e.target.value as OrderStatus)}
                                className={`text-xs font-mono uppercase px-2.5 py-1 border outline-none font-bold ${
                                  order.status === 'delivered'
                                    ? 'bg-emerald-950 text-emerald-400 border-emerald-700'
                                    : order.status === 'shipped'
                                    ? 'bg-blue-950 text-blue-400 border-blue-700'
                                    : order.status === 'cancelled'
                                    ? 'bg-red-950 text-red-400 border-red-700'
                                    : 'bg-amber-950 text-amber-400 border-amber-700'
                                }`}
                              >
                                <option value="new">NEW ORDER</option>
                                <option value="processing">PROCESSING</option>
                                <option value="shipped">SHIPPED</option>
                                <option value="delivered">DELIVERED</option>
                                <option value="cancelled">CANCELLED</option>
                              </select>

                              {/* WhatsApp Direct Action */}
                              <a
                                href={`https://wa.me/2${order.customer.phone.replace(/^0/, '')}?text=${encodeURIComponent(
                                  `مرحباً ${order.customer.fullName}، بخصوص طلبك #${order.orderId} من متجر MONO / STUDIO...`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-black font-mono font-bold text-xs uppercase flex items-center gap-1.5 transition-colors"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>WHATSAPP</span>
                              </a>

                              <button
                                onClick={() => {
                                  if (confirm(`Delete order #${order.orderId}?`)) {
                                    deleteOrder(order.orderId);
                                  }
                                }}
                                className="p-1 text-[#666] hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Customer & Address Details */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono bg-[#0c0c0c] p-3 border border-[#1a1a1a]">
                            <div>
                              <span className="text-[#666] block text-[10px] uppercase">CUSTOMER:</span>
                              <span className="text-white font-bold">{order.customer.fullName}</span>
                              <span className="text-[#90b8ff] block mt-0.5">{order.customer.phone}</span>
                            </div>

                            <div>
                              <span className="text-[#666] block text-[10px] uppercase">DELIVERY ADDRESS:</span>
                              <span className="text-white">
                                {order.customer.governorate.toUpperCase()} • {order.customer.city}
                              </span>
                              <span className="text-[#aaa] block mt-0.5 line-clamp-1">
                                {order.customer.streetAddress}
                              </span>
                            </div>

                            <div>
                              <span className="text-[#666] block text-[10px] uppercase">FINANCIAL SUMMARY:</span>
                              <span className="text-white">
                                Items Subtotal: {formatPrice(order.subtotal)}
                              </span>
                              <span className="text-[#CEFF00] font-bold block mt-0.5">
                                Grand Total (COD): {formatPrice(order.total)}
                              </span>
                            </div>
                          </div>

                          {/* Order Items Breakdown */}
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-mono text-[#666] uppercase">ORDERED PIECES:</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-2 bg-[#141414] border border-[#222]">
                                  <img
                                    src={item.product.images[0]}
                                    alt={item.product.name}
                                    className="w-10 h-12 object-cover bg-[#090909]"
                                  />
                                  <div className="text-xs font-mono">
                                    <div className="text-white font-bold line-clamp-1">{item.product.name}</div>
                                    <div className="text-[#888] text-[10px]">
                                      Size: <strong className="text-white">{item.selectedSize}</strong> • Color: {item.selectedColor.name} • Qty: {item.quantity}
                                    </div>
                                    <div className="text-[#CEFF00] font-bold text-[11px]">
                                      {formatPrice(item.product.price * item.quantity)}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ================= TAB: CATEGORIES MANAGEMENT ================= */}
              {activeTab === 'categories' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  {/* Top Header & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#202020]">
                    <div>
                      <h3 className="text-base font-mono font-bold tracking-widest uppercase text-white flex items-center gap-2">
                        <Tag className="w-4 h-4 text-[#CEFF00]" />
                        <span>{language === 'ar' ? 'إدارة أقسام وتصنيفات المتجر' : 'CATEGORIES & SECTIONS VAULT'}</span>
                      </h3>
                      <p className="text-xs font-mono text-[#777] mt-1">
                        {language === 'ar'
                          ? 'التحكم الكامل في الأقسام المعروضة في المتجر، قائمة المنتجات، والتشكيلات.'
                          : 'Manage active catalog categories, storefront filter tabs, and collections linking.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (confirm(language === 'ar' ? 'هل أنت متأكد من استعادة الأقسام الافتراضية؟' : 'Reset all categories to factory defaults?')) {
                            resetCategoriesToDefault();
                          }
                        }}
                        className="px-3 py-2 bg-[#141414] hover:bg-[#222] border border-[#333] text-xs font-mono text-[#aaa] hover:text-white uppercase transition-colors"
                      >
                        {language === 'ar' ? 'استعادة الافتراضي' : 'RESET DEFAULTS'}
                      </button>

                      <button
                        onClick={() => {
                          setEditingCategory(null);
                          setCategoryForm({ key: '', labelEn: '', labelAr: '' });
                          setCategoryError('');
                          setIsCreatingCategory(true);
                        }}
                        className="px-4 py-2 bg-[#CEFF00] hover:bg-[#b8e600] text-black font-mono font-bold text-xs tracking-wider uppercase transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(206,255,0,0.25)]"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{language === 'ar' ? 'إضافة قسم جديد' : 'NEW CATEGORY'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Categories Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((cat) => {
                      const count = products.filter((p) => p.category === cat.key).length;
                      return (
                        <div
                          key={cat.key}
                          className="bg-[#111] border border-[#242424] hover:border-[#383838] p-5 flex flex-col justify-between space-y-4 transition-all group"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono px-2 py-0.5 bg-[#181818] border border-[#333] text-[#CEFF00] tracking-widest uppercase">
                                SLUG: {cat.key}
                              </span>
                              <span className="text-xs font-mono text-[#777]">
                                {count} {language === 'ar' ? 'قطع' : 'pieces'}
                              </span>
                            </div>

                            <div>
                              <h4 className="text-base font-bold font-mono text-white tracking-wide uppercase">
                                {cat.labelEn}
                              </h4>
                              <p className="text-sm font-bold text-[#CEFF00] mt-0.5">
                                {cat.labelAr}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1c1c1c]">
                            <button
                              onClick={() => {
                                setEditingCategory(cat);
                                setCategoryForm({ key: cat.key, labelEn: cat.labelEn, labelAr: cat.labelAr });
                                setCategoryError('');
                                setIsCreatingCategory(true);
                              }}
                              className="px-3 py-1.5 bg-[#181818] hover:bg-[#252525] text-xs font-mono text-white border border-[#333] flex items-center gap-1.5 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-[#CEFF00]" />
                              <span>{language === 'ar' ? 'تعديل' : 'EDIT'}</span>
                            </button>

                            <button
                              onClick={() => {
                                if (categories.length <= 1) {
                                  alert(language === 'ar' ? 'لا يمكن حذف القسم الوحيد المتبقي.' : 'Cannot delete the only remaining category.');
                                  return;
                                }
                                if (confirm(language === 'ar' ? `هل أنت متأكد من حذف قسم "${cat.labelAr}"؟` : `Delete category "${cat.labelEn}"?`)) {
                                  deleteCategory(cat.key);
                                }
                              }}
                              className="p-1.5 text-[#666] hover:text-red-400 hover:bg-[#201010] border border-transparent hover:border-red-900/50 transition-colors"
                              title="Delete category"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ================= TAB 4: STORE SETTINGS ================= */}
              {activeTab === 'settings' && (
                <div className="max-w-2xl bg-[#111] border border-[#222] p-6 space-y-6 animate-in fade-in duration-150">
                  <div>
                    <h4 className="text-sm font-mono font-bold tracking-widest text-[#F1F0EB] uppercase">
                      DISPATCH & SECURITY CONFIGURATION
                    </h4>
                    <p className="text-xs font-mono text-[#777] mt-1">
                      Configure store business phone, free delivery threshold, and Master PIN.
                    </p>
                  </div>

                  {settingsSavedMessage && (
                    <div className="p-3 bg-emerald-950 border border-emerald-600 text-emerald-300 font-mono text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Configuration settings saved successfully.</span>
                    </div>
                  )}

                  <form onSubmit={handleSaveSettings} className="space-y-4">
                    <div>
                      <label className="block text-xs font-mono text-[#aaa] uppercase mb-1">
                        Official WhatsApp Business Number (e.g. 201099998888)
                      </label>
                      <input
                        type="text"
                        value={settingsForm.whatsappNumber}
                        onChange={(e) => setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })}
                        className="w-full bg-[#0a0a0a] border border-[#333] text-white font-mono text-xs p-3 outline-none focus:border-[#CEFF00]"
                      />
                      <p className="text-[10px] font-mono text-[#666] mt-1">
                        Customer orders via WhatsApp will be sent directly to this phone number.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-[#aaa] uppercase mb-1">
                        Free Shipping Threshold (EGP)
                      </label>
                      <input
                        type="number"
                        value={settingsForm.freeShippingThreshold}
                        onChange={(e) => setSettingsForm({ ...settingsForm, freeShippingThreshold: Number(e.target.value) })}
                        className="w-full bg-[#0a0a0a] border border-[#333] text-white font-mono text-xs p-3 outline-none focus:border-[#CEFF00]"
                      />
                    </div>

                    <div className="pt-4 border-t border-[#222] space-y-4">
                      <h5 className="text-xs font-mono font-bold uppercase text-white">
                        UPDATE MASTER SECURITY PIN
                      </h5>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-mono text-[#888] uppercase mb-1">
                            New Security PIN
                          </label>
                          <input
                            type="password"
                            placeholder="••••"
                            value={settingsForm.newPin}
                            onChange={(e) => setSettingsForm({ ...settingsForm, newPin: e.target.value })}
                            className="w-full bg-[#0a0a0a] border border-[#333] text-white font-mono text-xs p-3 outline-none focus:border-[#CEFF00]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-mono text-[#888] uppercase mb-1">
                            Confirm New PIN
                          </label>
                          <input
                            type="password"
                            placeholder="••••"
                            value={settingsForm.confirmPin}
                            onChange={(e) => setSettingsForm({ ...settingsForm, confirmPin: e.target.value })}
                            className="w-full bg-[#0a0a0a] border border-[#333] text-white font-mono text-xs p-3 outline-none focus:border-[#CEFF00]"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        className="px-6 py-3 bg-[#CEFF00] hover:bg-[#b8e600] text-black font-mono font-bold text-xs tracking-wider uppercase transition-all flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        <span>SAVE CONFIGURATION</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= UNIFIED MODAL: EDIT & CREATE PRODUCT ================= */}
        {(editingProduct || isCreatingProduct) && (
          <ProductEditorModal
            initialProduct={editingProduct}
            onClose={() => {
              setEditingProduct(null);
              setIsCreatingProduct(false);
            }}
            onSave={(savedProduct) => {
              if (editingProduct) {
                updateProduct(savedProduct);
              } else {
                addProduct(savedProduct);
              }
              setEditingProduct(null);
              setIsCreatingProduct(false);
            }}
          />
        )}

        {/* ================= UNIFIED MODAL: EDIT & CREATE COLLECTION ================= */}
        {(editingCollection || isCreatingCollection) && (
          <CollectionEditorModal
            initialCollection={editingCollection}
            onClose={() => {
              setEditingCollection(null);
              setIsCreatingCollection(false);
            }}
            onSave={(savedCollection) => {
              if (editingCollection) {
                updateCollection(savedCollection);
              } else {
                addCollection(savedCollection);
              }
              setEditingCollection(null);
              setIsCreatingCollection(false);
            }}
          />
        )}

        {/* ================= MODAL: ADD / EDIT CATEGORY ================= */}
        {isCreatingCategory && (
          <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#111] border border-[#333] w-full max-w-md p-6 space-y-5 animate-in fade-in duration-150 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#222] pb-3">
                <h4 className="text-sm font-mono font-bold uppercase text-white flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#CEFF00]" />
                  <span>
                    {editingCategory
                      ? (language === 'ar' ? 'تعديل بيانات القسم' : 'EDIT CATEGORY')
                      : (language === 'ar' ? 'إضافة قسم جديد للمتجر' : 'ADD NEW CATEGORY')}
                  </span>
                </h4>
                <button
                  onClick={() => {
                    setIsCreatingCategory(false);
                    setEditingCategory(null);
                  }}
                  className="p-1 text-[#777] hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {categoryError && (
                <div className="p-2.5 bg-red-950/70 border border-red-500 text-red-300 font-mono text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{categoryError}</span>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const slug = categoryForm.key.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '-');
                  if (!slug) {
                    setCategoryError(language === 'ar' ? 'يرجى إدخال اسم المعرف (Slug).' : 'Category Slug is required.');
                    return;
                  }
                  if (!categoryForm.labelEn.trim() || !categoryForm.labelAr.trim()) {
                    setCategoryError(language === 'ar' ? 'يرجى إدخال الاسم بالإنجليزي والعربي.' : 'Both English and Arabic labels are required.');
                    return;
                  }
                  if (!editingCategory && categories.some((c) => c.key === slug)) {
                    setCategoryError(language === 'ar' ? 'هذا المعرف مستخدم بالفعل!' : 'Category with this slug already exists.');
                    return;
                  }

                  if (editingCategory) {
                    updateCategory(editingCategory.key, {
                      labelEn: categoryForm.labelEn.trim().toUpperCase(),
                      labelAr: categoryForm.labelAr.trim(),
                    });
                  } else {
                    addCategory({
                      key: slug,
                      labelEn: categoryForm.labelEn.trim().toUpperCase(),
                      labelAr: categoryForm.labelAr.trim(),
                    });
                  }

                  setIsCreatingCategory(false);
                  setEditingCategory(null);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-mono text-[#888] uppercase mb-1">
                    Category Slug / Key (معرف الرابط)
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingCategory}
                    placeholder="e.g. vintage-drops, tracksuits"
                    value={categoryForm.key}
                    onChange={(e) => setCategoryForm({ ...categoryForm, key: e.target.value })}
                    className="w-full bg-[#0a0a0a] border border-[#333] text-white font-mono text-xs p-3 outline-none focus:border-[#CEFF00] disabled:opacity-50"
                  />
                  <p className="text-[10px] font-mono text-[#666] mt-1">
                    {language === 'ar' ? 'حروف إنجليزية صغيرة وأرقام وفواصل - بدون مسافات' : 'Lowercase letters, numbers, and hyphens only.'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#888] uppercase mb-1">
                    English Label (الاسم بالإنجليزية)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TRACKSUITS & SETS"
                    value={categoryForm.labelEn}
                    onChange={(e) => setCategoryForm({ ...categoryForm, labelEn: e.target.value })}
                    className="w-full bg-[#0a0a0a] border border-[#333] text-white font-mono text-xs p-3 outline-none focus:border-[#CEFF00]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#888] uppercase mb-1">
                    Arabic Label (الاسم بالعربية)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: أطقم وتراكسوت"
                    value={categoryForm.labelAr}
                    onChange={(e) => setCategoryForm({ ...categoryForm, labelAr: e.target.value })}
                    className="w-full bg-[#0a0a0a] border border-[#333] text-white font-mono text-xs p-3 outline-none focus:border-[#CEFF00]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingCategory(false);
                      setEditingCategory(null);
                    }}
                    className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#222] text-[#888] hover:text-white font-mono text-xs uppercase"
                  >
                    {language === 'ar' ? 'إلغاء' : 'CANCEL'}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#CEFF00] hover:bg-[#b8e600] text-black font-mono font-bold text-xs uppercase transition-all shadow-md"
                  >
                    {language === 'ar' ? 'حفظ القسم' : 'SAVE CATEGORY'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// =====================================================================
// COMPREHENSIVE PRODUCT EDITOR & CREATOR MODAL
// Full control over Images, 3D Decal, Colorways, Sizes, Pricing, Specs
// =====================================================================

const COLOR_PRESETS: ProductColor[] = [
  { name: 'Onyx Black', nameAr: 'أسود أونيكس', hex: '#111111', threeColor: '#151515' },
  { name: 'Washed Charcoal', nameAr: 'فحمي مغسول', hex: '#2C2C2C', threeColor: '#353535' },
  { name: 'Raw Bone', nameAr: 'عاجي خام', hex: '#DCD7CD', threeColor: '#DAD4C8' },
  { name: 'Dark Chocolate', nameAr: 'بني شوكولاتة داكن', hex: '#3D261C', threeColor: '#5E3925' },
  { name: 'Warm Mocha', nameAr: 'بني موكا دافئ', hex: '#5E4230', threeColor: '#725039' },
  { name: 'Forest Pine', nameAr: 'أخضر غابات زمردي', hex: '#1D4A38', threeColor: '#26634C' },
  { name: 'Acid Moss', nameAr: 'زيتي حمضي معتق', hex: '#4A5636', threeColor: '#586B3E' },
  { name: 'Oxblood Burgundy', nameAr: 'عنابي نبيتي داكن', hex: '#521422', threeColor: '#72192E' },
  { name: 'Midnight Navy', nameAr: 'كحلي داكن', hex: '#162438', threeColor: '#243B5E' },
];

const GRAPHIC_PRESETS = [
  { name: 'Liquid Chrome Spider', url: '/graphics/chrome-spider.png' },
  { name: 'Savage Gothic Metal', url: '/graphics/savage.png' },
  { name: 'Revelation 12:9 Angel', url: '/graphics/revelation.png' },
  { name: 'Bare Tree Winter', url: '/graphics/bare-tree.png' },
  { name: 'Tokyo Wave Woodcut', url: '/graphics/tokyo-wave.png' },
  { name: 'Are You OK Street Art', url: '/graphics/are-you-ok.png' },
  { name: 'One Piece Sanji Vintage', url: '/graphics/one-piece.png' },
  { name: 'Merry Christmas Y2K', url: '/graphics/merry-christmas.png' },
];

const ALL_SIZES: ProductSize[] = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];

const ALL_FITS: { id: HoodieFit; labelEn: string; labelAr: string; descEn: string; descAr: string }[] = [
  { id: 'boxy', labelEn: 'BOXY', labelAr: 'بوكسي', descEn: 'OVERSIZED BOXY', descAr: 'أوفرسايز بوكسي عريض' },
  { id: 'cocoon', labelEn: 'COCOON', labelAr: 'كوكون', descEn: 'ARCHITECTURAL COCOON', descAr: 'كوكون معماري انسيابي' },
  { id: 'cropped', labelEn: 'CROPPED', labelAr: 'كروب', descEn: 'HEAVY CROPPED', descAr: 'كروب ثقيل عصري' },
];

const ALL_FINISHES: { id: HoodieFinish; labelEn: string; labelAr: string; descEn: string; descAr: string }[] = [
  { id: 'cotton', labelEn: 'COTTON', labelAr: 'قطن', descEn: '520 GSM LOOPBACK TERRY', descAr: 'قطن مصري ثقيل 520 جرام' },
  { id: 'nylon', labelEn: 'NYLON', labelAr: 'نايلون', descEn: 'MATTE TECH WAXED NYLON', descAr: 'نايلون تقني معالج شمعي' },
  { id: 'washed', labelEn: 'WASHED', labelAr: 'مغسول', descEn: 'ACID DISTRESSED WASH', descAr: 'غسيل حمضي معتق' },
];

const ALL_LIGHTING: { id: LightingMood; labelEn: string; labelAr: string; descEn: string; descAr: string }[] = [
  { id: 'cairo', labelEn: 'CAIRO', labelAr: 'القاهرة', descEn: 'MIDNIGHT FLASH', descAr: 'فلاش القاهرة الليلي' },
  { id: 'studio', labelEn: 'STUDIO', labelAr: 'استوديو', descEn: 'MONOCHROME STUDIO', descAr: 'استوديو أحادي اللون' },
  { id: 'cyber', labelEn: 'CYBER', labelAr: 'سايبر', descEn: 'ACID NEON CYBER', descAr: 'نيون إلكتروني مشع' },
];

interface ProductEditorModalProps {
  initialProduct: Product | null;
  onClose: () => void;
  onSave: (product: Product) => void;
}

const ProductEditorModal: React.FC<ProductEditorModalProps> = ({
  initialProduct,
  onClose,
  onSave,
}) => {
  const { formatPrice, language, categories } = useCart();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const frontFileInputRef = useRef<HTMLInputElement>(null);
  const backFileInputRef = useRef<HTMLInputElement>(null);

  // Active Navigation Tab inside Editor
  const [activeTab, setActiveTab] = useState<'info' | 'media' | 'colors' | 'sizes' | 'configurator'>('info');
  const [newImageTarget, setNewImageTarget] = useState<'gallery' | 'front3d' | 'back3d'>('gallery');

  // 3D Fitting Lab Configurator Controls
  const [availableFits, setAvailableFits] = useState<HoodieFit[]>(
    initialProduct?.availableFits && initialProduct.availableFits.length > 0
      ? initialProduct.availableFits
      : ['boxy', 'cocoon', 'cropped']
  );
  const [defaultFit, setDefaultFit] = useState<HoodieFit>(
    initialProduct?.defaultFit || 'boxy'
  );

  const [availableFinishes, setAvailableFinishes] = useState<HoodieFinish[]>(
    initialProduct?.availableFinishes && initialProduct.availableFinishes.length > 0
      ? initialProduct.availableFinishes
      : ['cotton', 'nylon', 'washed']
  );
  const [defaultFinish, setDefaultFinish] = useState<HoodieFinish>(
    initialProduct?.defaultFinish || 'cotton'
  );

  const [availableLighting, setAvailableLighting] = useState<LightingMood[]>(
    initialProduct?.availableLighting && initialProduct.availableLighting.length > 0
      ? initialProduct.availableLighting
      : ['cairo', 'studio', 'cyber']
  );
  const [defaultLighting, setDefaultLighting] = useState<LightingMood>(
    initialProduct?.defaultLighting || 'cairo'
  );

  // Form State
  const [name, setName] = useState(initialProduct?.name || '');
  const [nameAr, setNameAr] = useState(initialProduct?.nameAr || '');
  const [price, setPrice] = useState<number>(initialProduct?.price || 1750);
  const [originalPrice, setOriginalPrice] = useState<number | ''>(
    initialProduct?.originalPrice ? initialProduct.originalPrice : ''
  );
  const [category, setCategory] = useState<ProductCategory>(
    initialProduct?.category || 'new-arrivals'
  );
  const [badge, setBadge] = useState<string>(initialProduct?.badge || 'NEW DROP');
  const [badgeAr, setBadgeAr] = useState<string>(initialProduct?.badgeAr || 'إصدار جديد');
  const [description, setDescription] = useState(
    initialProduct?.description || 'Constructed from ultra-dense 520 GSM Egyptian organic cotton.'
  );
  const [descriptionAr, setDescriptionAr] = useState(
    initialProduct?.descriptionAr || 'مصنوع من قطن مصري عضوي ثقيل للغاية بوزن 520 جرام لكل متر مربع.'
  );

  // Media & 3D
  const [images, setImages] = useState<string[]>(
    initialProduct?.images && initialProduct.images.length > 0
      ? initialProduct.images
      : ['/products/chrome-spider-black.webp']
  );
  const [newImageUrl, setNewImageUrl] = useState('');
  const [has3DModel, setHas3DModel] = useState<boolean>(initialProduct?.has3DModel ?? true);
  const [frontGraphicUrl, setFrontGraphicUrl] = useState<string>(
    initialProduct?.frontGraphicUrl || ''
  );
  const [backGraphicUrl, setBackGraphicUrl] = useState<string>(
    initialProduct?.backGraphicUrl || initialProduct?.graphicUrl || '/graphics/chrome-spider.png'
  );
  const [graphicUrl, setGraphicUrl] = useState<string>(
    initialProduct?.graphicUrl || initialProduct?.backGraphicUrl || '/graphics/chrome-spider.png'
  );

  // Colors
  const [colors, setColors] = useState<ProductColor[]>(
    initialProduct?.colors && initialProduct.colors.length > 0
      ? initialProduct.colors
      : [{ name: 'Onyx Black', nameAr: 'أسود أونيكس', hex: '#0F0F0F', threeColor: '#0c0c0c' }]
  );
  const [customColorHex, setCustomColorHex] = useState('#262626');
  const [customColorName, setCustomColorName] = useState('');
  const [customColorNameAr, setCustomColorNameAr] = useState('');

  // Sizes & Specs
  const [sizes, setSizes] = useState<ProductSize[]>(
    initialProduct?.sizes && initialProduct.sizes.length > 0
      ? initialProduct.sizes
      : ['S', 'M', 'L', 'XL', 'XXL']
  );
  const [weightGsm, setWeightGsm] = useState<number>(initialProduct?.weightGsm || 520);
  const [fabric, setFabric] = useState(
    initialProduct?.fabric || '100% Ultra-Heavy Egyptian Combed Cotton'
  );
  const [fabricAr, setFabricAr] = useState(
    initialProduct?.fabricAr || '100% قطن مصري ممشط ثقيل فائق الجودة'
  );
  const [fit, setFit] = useState(initialProduct?.fit || 'Exaggerated Boxy Fit');
  const [fitAr, setFitAr] = useState(initialProduct?.fitAr || 'قصة واسعة بوكسي عريضة');

  // Validation feedback
  const [errorMessage, setErrorMessage] = useState('');

  // Handle Local File Upload with explicit target destination
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    destination: 'gallery' | 'front3d' | 'back3d' = newImageTarget
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const dataUrl = event.target.result as string;
        if (destination === 'front3d') {
          setFrontGraphicUrl(dataUrl);
          setErrorMessage('');
        } else if (destination === 'back3d') {
          setBackGraphicUrl(dataUrl);
          setGraphicUrl(dataUrl);
          setErrorMessage('');
        } else {
          setImages([dataUrl, ...images]);
          setErrorMessage('');
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Add Image URL with destination
  const handleAddImageUrl = () => {
    if (!newImageUrl.trim()) return;
    const url = newImageUrl.trim();
    if (newImageTarget === 'front3d') {
      setFrontGraphicUrl(url);
    } else if (newImageTarget === 'back3d') {
      setBackGraphicUrl(url);
      setGraphicUrl(url);
    } else {
      setImages([...images, url]);
    }
    setNewImageUrl('');
  };

  // Remove Image
  const handleRemoveImage = (index: number) => {
    if (images.length === 1) {
      setErrorMessage('Product must have at least one image.');
      return;
    }
    setImages(images.filter((_, idx) => idx !== index));
  };

  // Toggle Size
  const handleToggleSize = (sizeOption: ProductSize) => {
    if (sizes.includes(sizeOption)) {
      if (sizes.length === 1) {
        setErrorMessage('Garment must have at least one available size.');
        return;
      }
      setSizes(sizes.filter((s) => s !== sizeOption));
    } else {
      setSizes([...sizes, sizeOption]);
      setErrorMessage('');
    }
  };

  // Add Color Preset
  const handleAddPresetColor = (preset: ProductColor) => {
    if (colors.some((c) => c.hex.toLowerCase() === preset.hex.toLowerCase())) return;
    setColors([...colors, preset]);
  };

  // Add Custom Color
  const handleAddCustomColor = () => {
    if (!customColorName.trim()) {
      setErrorMessage('Please enter color name in English.');
      return;
    }
    const newColor: ProductColor = {
      name: customColorName.trim(),
      nameAr: customColorNameAr.trim() || customColorName.trim(),
      hex: customColorHex,
      threeColor: customColorHex,
    };
    setColors([...colors, newColor]);
    setCustomColorName('');
    setCustomColorNameAr('');
    setErrorMessage('');
  };

  // Remove Color
  const handleRemoveColor = (hex: string) => {
    if (colors.length === 1) {
      setErrorMessage('Garment must have at least one colorway.');
      return;
    }
    setColors(colors.filter((c) => c.hex !== hex));
  };

  // Toggle 3D Fits
  const handleToggleFit = (fitId: HoodieFit) => {
    if (availableFits.includes(fitId)) {
      if (availableFits.length === 1) {
        setErrorMessage('يجب الإبقاء على قصة واحدة على الأقل للهودي في معمل القياس 3D.');
        return;
      }
      const remaining = availableFits.filter((f) => f !== fitId);
      setAvailableFits(remaining);
      if (defaultFit === fitId) {
        setDefaultFit(remaining[0]);
      }
      setErrorMessage('');
    } else {
      setAvailableFits([...availableFits, fitId]);
      setErrorMessage('');
    }
  };

  // Toggle 3D Fabric Finishes
  const handleToggleFinish = (finishId: HoodieFinish) => {
    if (availableFinishes.includes(finishId)) {
      if (availableFinishes.length === 1) {
        setErrorMessage('يجب الإبقاء على خامة نسيج واحدة على الأقل للهودي في معمل القياس 3D.');
        return;
      }
      const remaining = availableFinishes.filter((f) => f !== finishId);
      setAvailableFinishes(remaining);
      if (defaultFinish === finishId) {
        setDefaultFinish(remaining[0]);
      }
      setErrorMessage('');
    } else {
      setAvailableFinishes([...availableFinishes, finishId]);
      setErrorMessage('');
    }
  };

  // Toggle 3D Studio Lighting
  const handleToggleLighting = (lightingId: LightingMood) => {
    if (availableLighting.includes(lightingId)) {
      if (availableLighting.length === 1) {
        setErrorMessage('يجب الإبقاء على وضع إضاءة واحد على الأقل للهودي في معمل القياس 3D.');
        return;
      }
      const remaining = availableLighting.filter((l) => l !== lightingId);
      setAvailableLighting(remaining);
      if (defaultLighting === lightingId) {
        setDefaultLighting(remaining[0]);
      }
      setErrorMessage('');
    } else {
      setAvailableLighting([...availableLighting, lightingId]);
      setErrorMessage('');
    }
  };

  // Submit Handler with Validation
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Please enter product title in English.');
      setActiveTab('info');
      return;
    }
    if (!nameAr.trim()) {
      setErrorMessage('Please enter product title in Arabic.');
      setActiveTab('info');
      return;
    }
    if (!price || price <= 0) {
      setErrorMessage('Please enter a valid price in EGP (> 0).');
      setActiveTab('info');
      return;
    }
    if (images.length === 0 || !images[0]) {
      setErrorMessage('Please provide at least one product image.');
      setActiveTab('media');
      return;
    }
    if (colors.length === 0) {
      setErrorMessage('Please add at least one colorway.');
      setActiveTab('colors');
      return;
    }
    if (sizes.length === 0) {
      setErrorMessage('Please select at least one available size.');
      setActiveTab('sizes');
      return;
    }

    const id = initialProduct
      ? initialProduct.id
      : name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4);

    const productPayload: Product = {
      id,
      name: name.trim().toUpperCase(),
      nameAr: nameAr.trim(),
      category,
      price: Number(price),
      originalPrice: originalPrice && Number(originalPrice) > Number(price) ? Number(originalPrice) : undefined,
      description: description.trim(),
      descriptionAr: descriptionAr.trim(),
      details: [
        `${weightGsm} GSM Heavyweight Egyptian Cotton`,
        'High-density screenprint on back',
        'Architectural structured double hood',
        'Reinforced bar-tack rivets',
      ],
      detailsAr: [
        `قطن مصري ثقيل ${weightGsm} جرام/م²`,
        'طباعة عالية الكثافة على الظهر',
        'قلنسوة مزدوجة معمارية تظل منتصبة',
        'خياطة متينة معززة',
      ],
      fabric: fabric.trim(),
      fabricAr: fabricAr.trim(),
      weightGsm: Number(weightGsm) || 520,
      fit: fit.trim(),
      fitAr: fitAr.trim(),
      sizes,
      colors,
      images,
      graphicUrl: (backGraphicUrl || graphicUrl).trim() || undefined,
      backGraphicUrl: (backGraphicUrl || graphicUrl).trim() || undefined,
      frontGraphicUrl: frontGraphicUrl.trim() || undefined,
      badge: badge.trim() || undefined,
      badgeAr: badgeAr.trim() || undefined,
      has3DModel,
      featured: initialProduct?.featured ?? true,
      availableFits,
      defaultFit,
      availableFinishes,
      defaultFinish,
      availableLighting,
      defaultLighting,
    };

    onSave(productPayload);
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-[#0d0d0d] border border-[#2b2b2b] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#141414] border-b border-[#222]">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-[#CEFF00]" />
            <h3 className="font-mono font-bold text-sm text-white uppercase tracking-wider">
              {initialProduct ? `EDIT PIECE // ${initialProduct.name}` : 'CREATE NEW ATELIER PIECE // إضافة قطعة جديدة'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#777] hover:text-white border border-transparent hover:border-[#333] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-[#222] bg-[#111] overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`px-5 py-3 text-xs font-mono tracking-wider flex items-center gap-2 border-b-2 transition-all shrink-0 ${
              activeTab === 'info'
                ? 'border-[#CEFF00] text-[#CEFF00] font-bold bg-[#171717]'
                : 'border-transparent text-[#777] hover:text-[#ccc]'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>1. INFO & PRICING</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('media')}
            className={`px-5 py-3 text-xs font-mono tracking-wider flex items-center gap-2 border-b-2 transition-all shrink-0 ${
              activeTab === 'media'
                ? 'border-[#CEFF00] text-[#CEFF00] font-bold bg-[#171717]'
                : 'border-transparent text-[#777] hover:text-[#ccc]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>2. IMAGES & 3D ART</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('colors')}
            className={`px-5 py-3 text-xs font-mono tracking-wider flex items-center gap-2 border-b-2 transition-all shrink-0 ${
              activeTab === 'colors'
                ? 'border-[#CEFF00] text-[#CEFF00] font-bold bg-[#171717]'
                : 'border-transparent text-[#777] hover:text-[#ccc]'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>3. COLORS ({colors.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sizes')}
            className={`px-5 py-3 text-xs font-mono tracking-wider flex items-center gap-2 border-b-2 transition-all shrink-0 ${
              activeTab === 'sizes'
                ? 'border-[#CEFF00] text-[#CEFF00] font-bold bg-[#171717]'
                : 'border-transparent text-[#777] hover:text-[#ccc]'
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>4. SIZES ({sizes.length}) & SPECS</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('configurator')}
            className={`px-5 py-3 text-xs font-mono tracking-wider flex items-center gap-2 border-b-2 transition-all shrink-0 ${
              activeTab === 'configurator'
                ? 'border-[#CEFF00] text-[#CEFF00] font-bold bg-[#171717]'
                : 'border-transparent text-[#777] hover:text-[#ccc]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>5. 3D CONFIGURATOR (خيارات معمل 3D)</span>
          </button>
        </div>

        {/* Modal Body: Two Columns (Form Controls + Live Preview) */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Form Controls */}
          <div className="lg:col-span-8 space-y-6">
            {errorMessage && (
              <div className="p-3 bg-red-950/40 border border-red-500/50 flex items-center gap-2 text-xs font-mono text-red-400 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form id="product-editor-form" onSubmit={handleSubmit} className="space-y-5 text-xs font-mono">
              {/* ================= TAB 1: INFO & PRICING ================= */}
              {activeTab === 'info' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#888] mb-1 uppercase font-bold">
                        Title in English <span className="text-[#CEFF00]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. LIQUID CHROME TECH HOODIE"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-[#141414] border border-[#333] text-white p-3 outline-none focus:border-[#CEFF00] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[#888] mb-1 uppercase font-bold">
                        اسم القطعة بالعربي <span className="text-[#CEFF00]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        dir="rtl"
                        placeholder="مثال: هودي العنكبوت الكرومي أسود"
                        value={nameAr}
                        onChange={(e) => setNameAr(e.target.value)}
                        className="w-full bg-[#141414] border border-[#333] text-white p-3 outline-none focus:border-[#CEFF00] transition-colors font-sans"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[#888] mb-1 uppercase font-bold">
                        Price (EGP) <span className="text-[#CEFF00]">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={price}
                        onChange={(e) => setPrice(Number(e.target.value))}
                        className="w-full bg-[#141414] border border-[#333] text-white p-3 outline-none focus:border-[#CEFF00]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#888] mb-1 uppercase">Original Price (Discount)</label>
                      <input
                        type="number"
                        placeholder="e.g. 2300"
                        value={originalPrice}
                        onChange={(e) => setOriginalPrice(e.target.value ? Number(e.target.value) : '')}
                        className="w-full bg-[#141414] border border-[#333] text-white p-3 outline-none focus:border-[#CEFF00]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#888] mb-1 uppercase font-mono text-xs">Category (القسم)</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as ProductCategory)}
                        className="w-full bg-[#141414] border border-[#333] text-white p-3 font-mono text-xs outline-none focus:border-[#CEFF00] cursor-pointer"
                      >
                        {categories
                          .filter((c, idx, arr) => arr.findIndex((x) => x.key.toLowerCase() === c.key.toLowerCase()) === idx)
                          .map((c) => (
                            <option key={c.key} value={c.key} className="bg-[#141414] text-white py-1">
                              {c.labelEn} • {c.labelAr}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#888] mb-1 uppercase">Drop Badge (English)</label>
                      <input
                        type="text"
                        placeholder="e.g. NEW DROP, LIMITED EDITION"
                        value={badge}
                        onChange={(e) => setBadge(e.target.value)}
                        className="w-full bg-[#141414] border border-[#333] text-white p-3 outline-none focus:border-[#CEFF00]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#888] mb-1 uppercase">شارة الإصدار (بالعربي)</label>
                      <input
                        type="text"
                        dir="rtl"
                        placeholder="مثال: إصدار جديد، كمية محدودة"
                        value={badgeAr}
                        onChange={(e) => setBadgeAr(e.target.value)}
                        className="w-full bg-[#141414] border border-[#333] text-white p-3 outline-none focus:border-[#CEFF00] font-sans"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#888] mb-1 uppercase">Description (English)</label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-[#141414] border border-[#333] text-white p-3 outline-none focus:border-[#CEFF00]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#888] mb-1 uppercase">الوصف بالعربي</label>
                    <textarea
                      rows={2}
                      dir="rtl"
                      value={descriptionAr}
                      onChange={(e) => setDescriptionAr(e.target.value)}
                      className="w-full bg-[#141414] border border-[#333] text-white p-3 outline-none focus:border-[#CEFF00] font-sans"
                    />
                  </div>
                </div>
              )}

              {/* ================= TAB 2: IMAGES & 3D ================= */}
              {activeTab === 'media' && (
                <div className="space-y-6">
                  {/* Image Destination Selector Bar */}
                  <div className="p-3 bg-[#161616] border border-[#2a2a2a] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs font-mono text-white font-bold uppercase flex items-center gap-2">
                      <Upload className="w-4 h-4 text-[#CEFF00]" />
                      <span>إضافة صورة للمنتج (حدد موضع الصورة):</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-[#0a0a0a] p-1 border border-[#333]">
                      <button
                        type="button"
                        onClick={() => setNewImageTarget('gallery')}
                        className={`px-3 py-1 text-[11px] font-mono transition-all ${
                          newImageTarget === 'gallery'
                            ? 'bg-[#CEFF00] text-black font-bold shadow-[0_0_8px_rgba(206,255,0,0.3)]'
                            : 'text-[#888] hover:text-white'
                        }`}
                      >
                        معرض المتجر
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewImageTarget('front3d')}
                        className={`px-3 py-1 text-[11px] font-mono transition-all ${
                          newImageTarget === 'front3d'
                            ? 'bg-[#CEFF00] text-black font-bold shadow-[0_0_8px_rgba(206,255,0,0.3)]'
                            : 'text-[#888] hover:text-white'
                        }`}
                      >
                        صورة أمامية للمجسم (Front 3D)
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewImageTarget('back3d')}
                        className={`px-3 py-1 text-[11px] font-mono transition-all ${
                          newImageTarget === 'back3d'
                            ? 'bg-[#CEFF00] text-black font-bold shadow-[0_0_8px_rgba(206,255,0,0.3)]'
                            : 'text-[#888] hover:text-white'
                        }`}
                      >
                        صورة خلفية للمجسم (Back 3D)
                      </button>
                    </div>
                  </div>

                  {/* Add Image by URL or Device */}
                  <div className="p-4 bg-[#141414] border border-[#242424] space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-white font-bold uppercase flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-[#CEFF00]" />
                        <span>
                          {newImageTarget === 'gallery'
                            ? 'إضافة صورة لمعرض المتجر (Gallery Photo)'
                            : newImageTarget === 'front3d'
                            ? 'إضافة صورة أمامية لمجسم الـ 3D (Front Chest Print)'
                            : 'إضافة صورة خلفية لمجسم الـ 3D (Back Print)'}
                        </span>
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (newImageTarget === 'front3d') frontFileInputRef.current?.click();
                            else if (newImageTarget === 'back3d') backFileInputRef.current?.click();
                            else fileInputRef.current?.click();
                          }}
                          className="px-3 py-1.5 bg-[#222] hover:bg-[#CEFF00] hover:text-black border border-[#444] text-[11px] font-mono transition-colors flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>رفع من الجهاز ({newImageTarget === 'gallery' ? 'للمعرض' : newImageTarget === 'front3d' ? 'واجهة أمامية 3D' : 'واجهة خلفية 3D'})</span>
                        </button>
                      </div>

                      {/* Hidden File Inputs */}
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'gallery')}
                        className="hidden"
                      />
                      <input
                        type="file"
                        ref={frontFileInputRef}
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'front3d')}
                        className="hidden"
                      />
                      <input
                        type="file"
                        ref={backFileInputRef}
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'back3d')}
                        className="hidden"
                      />
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder={
                          newImageTarget === 'gallery'
                            ? 'Enter photo URL or upload file for store gallery...'
                            : newImageTarget === 'front3d'
                            ? 'Enter front transparent PNG graphic URL or upload...'
                            : 'Enter back transparent PNG graphic URL or upload...'
                        }
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        className="flex-1 bg-[#0a0a0a] border border-[#333] text-white p-3 outline-none focus:border-[#CEFF00]"
                      />
                      <button
                        type="button"
                        onClick={handleAddImageUrl}
                        className="px-5 py-3 bg-[#CEFF00] text-black font-bold border border-[#CEFF00] text-xs font-mono uppercase hover:bg-[#b8e600] transition-colors"
                      >
                        + ADD
                      </button>
                    </div>
                  </div>

                  {/* 1. Store Gallery Images Card */}
                  <div className="p-4 bg-[#141414] border border-[#242424] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-[#aaa] font-bold uppercase">
                        1. صور معرض المتجر ({images.length} صور)
                      </div>
                      <span className="text-[10px] text-[#777]">الصورة الأولى هي صورة الغلاف الأساسية للمنتج</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                      {images.map((img, idx) => (
                        <div key={idx} className="relative group border border-[#333] aspect-square overflow-hidden bg-[#0c0c0c]">
                          <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                          <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/80 text-[9px] font-mono text-[#CEFF00]">
                            {idx === 0 ? 'COVER' : `#${idx + 1}`}
                          </div>
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="absolute top-1 right-1 p-1 bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 2. Front 3D Model Graphic Print Card */}
                  <div className="p-4 bg-[#141414] border border-[#242424] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-white font-bold uppercase flex items-center gap-2">
                          <Box className="w-4 h-4 text-[#CEFF00]" />
                          <span>2. صورة أمامية لمجسم الـ 3D (Front Chest Graphic)</span>
                        </div>
                        <div className="text-[11px] text-[#777]">
                          تطبع على صدر الهودي ثلاثي الأبعاد من الأمام (يفضل PNG مفرغ بدون خلفية)
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => frontFileInputRef.current?.click()}
                        className="px-3 py-1 bg-[#222] hover:bg-[#CEFF00] hover:text-black border border-[#444] text-[11px] font-mono transition-colors flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>رفع صورة أمامية</span>
                      </button>
                    </div>

                    {frontGraphicUrl ? (
                      <div className="flex items-center gap-4 p-3 bg-[#0a0a0a] border border-[#2a2a2a]">
                        <div className="w-16 h-16 border border-[#333] bg-[#141414] p-1 flex items-center justify-center shrink-0">
                          <img src={frontGraphicUrl} alt="Front Graphic" className="max-w-full max-h-full object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-white font-bold uppercase truncate">{frontGraphicUrl}</div>
                          <div className="text-[10px] text-[#CEFF00]">✓ طباعة الصدر نشطة على مجسم الـ 3D</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFrontGraphicUrl('')}
                          className="p-1.5 text-[#777] hover:text-red-400 border border-transparent hover:border-[#333] transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 bg-[#0a0a0a] border border-dashed border-[#333] text-center text-xs text-[#666]">
                        لا توجد صورة أمامية حالياً (الصدر سادة). اضغط "رفع صورة أمامية" أو أضف رابط بالأعلى لإضافتها.
                      </div>
                    )}
                  </div>

                  {/* 3. Back 3D Model Graphic Print Card */}
                  <div className="p-4 bg-[#141414] border border-[#242424] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-white font-bold uppercase flex items-center gap-2">
                          <Box className="w-4 h-4 text-[#CEFF00]" />
                          <span>3. صورة خلفية لمجسم الـ 3D (Back Graphic Decal)</span>
                        </div>
                        <div className="text-[11px] text-[#777]">
                          تطبع على كامل ظهر الهودي ثلاثي الأبعاد مع محاكاة لمعان وخشونة القماش
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => backFileInputRef.current?.click()}
                        className="px-3 py-1 bg-[#222] hover:bg-[#CEFF00] hover:text-black border border-[#444] text-[11px] font-mono transition-colors flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>رفع صورة خلفية</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[#888] text-[11px] uppercase">اختيار من التصاميم الجاهزة أو مخصص:</label>
                      <select
                        value={backGraphicUrl}
                        onChange={(e) => {
                          setBackGraphicUrl(e.target.value);
                          setGraphicUrl(e.target.value);
                        }}
                        className="w-full bg-[#0a0a0a] border border-[#333] text-white p-3 outline-none focus:border-[#CEFF00]"
                      >
                        {GRAPHIC_PRESETS.map((gp) => (
                          <option key={gp.url} value={gp.url}>
                            {gp.name} ({gp.url})
                          </option>
                        ))}
                      </select>
                    </div>

                    {backGraphicUrl && (
                      <div className="flex items-center gap-4 p-3 bg-[#0a0a0a] border border-[#2a2a2a]">
                        <div className="w-16 h-16 border border-[#333] bg-[#141414] p-1 flex items-center justify-center shrink-0">
                          <img src={backGraphicUrl} alt="Back Graphic" className="max-w-full max-h-full object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-white font-bold uppercase truncate">{backGraphicUrl}</div>
                          <div className="text-[10px] text-[#CEFF00]">✓ طباعة الظهر نشطة على مجسم الـ 3D</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setBackGraphicUrl('');
                            setGraphicUrl('');
                          }}
                          className="p-1.5 text-[#777] hover:text-red-400 border border-transparent hover:border-[#333] transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ================= TAB 3: COLORS & PALETTES ================= */}
              {activeTab === 'colors' && (
                <div className="space-y-5">
                  {/* Current Colors List */}
                  <div className="space-y-3">
                    <div className="text-xs text-[#888] font-bold uppercase">
                      Current Colorways ({colors.length}) • الألوان الحالية للمنتج
                    </div>
                    <div className="space-y-2">
                      {colors.map((c, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-[#141414] border border-[#242424]">
                          <div className="flex items-center gap-3">
                            <input
                              type="color"
                              value={c.hex}
                              onChange={(e) => {
                                const updated = [...colors];
                                updated[idx].hex = e.target.value;
                                updated[idx].threeColor = e.target.value;
                                setColors(updated);
                              }}
                              className="w-8 h-8 rounded-none border border-[#444] cursor-pointer bg-transparent"
                            />
                            <div>
                              <div className="text-white font-bold">{c.name}</div>
                              <div className="text-[#888] text-[11px] font-sans">{c.nameAr} • {c.hex}</div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveColor(c.hex)}
                            disabled={colors.length <= 1}
                            className="p-2 text-[#777] hover:text-red-400 disabled:opacity-30 disabled:hover:text-[#777] transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Color Presets */}
                  <div className="space-y-2 pt-3 border-t border-[#222]">
                    <div className="text-xs text-[#888] font-bold uppercase">Quick Add Egyptian Luxury Streetwear Palettes:</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {COLOR_PRESETS.map((preset) => {
                        const exists = colors.some((c) => c.hex.toLowerCase() === preset.hex.toLowerCase());
                        return (
                          <button
                            key={preset.hex}
                            type="button"
                            onClick={() => handleAddPresetColor(preset)}
                            disabled={exists}
                            className={`p-2.5 border text-left flex items-center gap-2.5 transition-all ${
                              exists
                                ? 'border-[#333] opacity-40 cursor-not-allowed bg-[#0a0a0a]'
                                : 'border-[#292929] hover:border-[#CEFF00] bg-[#141414]'
                            }`}
                          >
                            <span className="w-4 h-4 rounded-full border border-black/50 shrink-0" style={{ backgroundColor: preset.hex }} />
                            <div className="overflow-hidden">
                              <div className="text-[11px] text-white truncate font-bold">{preset.name}</div>
                              <div className="text-[10px] text-[#777] truncate font-sans">{preset.nameAr}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Add Custom Color */}
                  <div className="p-4 bg-[#141414] border border-[#242424] space-y-3">
                    <div className="text-xs text-white font-bold uppercase">Add Custom Colorway // إضافة لون مخصص</div>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                      <div className="sm:col-span-2">
                        <label className="block text-[#888] mb-1">Pick Color</label>
                        <input
                          type="color"
                          value={customColorHex}
                          onChange={(e) => setCustomColorHex(e.target.value)}
                          className="w-full h-10 border border-[#333] cursor-pointer bg-transparent"
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <label className="block text-[#888] mb-1">Color Name (EN)</label>
                        <input
                          type="text"
                          placeholder="e.g. Acid Violet"
                          value={customColorName}
                          onChange={(e) => setCustomColorName(e.target.value)}
                          className="w-full bg-[#0a0a0a] border border-[#333] text-white p-2.5 outline-none focus:border-[#CEFF00]"
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <label className="block text-[#888] mb-1">اسم اللون بالعربي</label>
                        <input
                          type="text"
                          dir="rtl"
                          placeholder="مثال: بنفسجي حمضي"
                          value={customColorNameAr}
                          onChange={(e) => setCustomColorNameAr(e.target.value)}
                          className="w-full bg-[#0a0a0a] border border-[#333] text-white p-2.5 outline-none focus:border-[#CEFF00] font-sans"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <button
                          type="button"
                          onClick={handleAddCustomColor}
                          className="w-full py-2.5 bg-[#CEFF00] hover:bg-[#b8e600] text-black font-bold uppercase text-xs transition-colors"
                        >
                          + ADD
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= TAB 4: SIZES & SPECS ================= */}
              {activeTab === 'sizes' && (
                <div className="space-y-5">
                  {/* Sizes Toggle Chips */}
                  <div className="p-4 bg-[#141414] border border-[#242424] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-white font-bold uppercase flex items-center gap-2">
                        <Ruler className="w-4 h-4 text-[#CEFF00]" />
                        <span>Available Garment Sizes ({sizes.length} active)</span>
                      </div>
                      <span className="text-[10px] text-[#777]">Click to toggle on/off</span>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2">
                      {ALL_SIZES.map((s) => {
                        const active = sizes.includes(s);
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => handleToggleSize(s)}
                            className={`py-3 text-center border font-mono text-xs font-bold transition-all ${
                              active
                                ? 'bg-[#CEFF00] text-black border-[#CEFF00] shadow-[0_0_12px_rgba(206,255,0,0.3)]'
                                : 'bg-[#0a0a0a] text-[#555] border-[#292929] hover:border-[#666]'
                            }`}
                          >
                            <span>{s}</span>
                            <span className="block text-[9px] font-normal opacity-80 mt-0.5">
                              {active ? 'IN STOCK' : 'OFF'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Weight GSM & Fabric Composition */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[#888] mb-1 uppercase font-bold">Fabric Weight (GSM)</label>
                      <input
                        type="number"
                        min="200"
                        max="800"
                        value={weightGsm}
                        onChange={(e) => setWeightGsm(Number(e.target.value))}
                        className="w-full bg-[#141414] border border-[#333] text-white p-3 outline-none focus:border-[#CEFF00]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[#888] mb-1 uppercase font-bold">Fabric Details (English)</label>
                      <input
                        type="text"
                        value={fabric}
                        onChange={(e) => setFabric(e.target.value)}
                        className="w-full bg-[#141414] border border-[#333] text-white p-3 outline-none focus:border-[#CEFF00]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#888] mb-1 uppercase font-bold">تفاصيل النسيج (بالعربي)</label>
                      <input
                        type="text"
                        dir="rtl"
                        value={fabricAr}
                        onChange={(e) => setFabricAr(e.target.value)}
                        className="w-full bg-[#141414] border border-[#333] text-white p-3 outline-none focus:border-[#CEFF00] font-sans"
                      />
                    </div>
                    <div>
                      <label className="block text-[#888] mb-1 uppercase font-bold">قصة الهودي (بالعربي)</label>
                      <input
                        type="text"
                        dir="rtl"
                        value={fitAr}
                        onChange={(e) => setFitAr(e.target.value)}
                        className="w-full bg-[#141414] border border-[#333] text-white p-3 outline-none focus:border-[#CEFF00] font-sans"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ================= TAB 5: 3D FITTING LAB CONFIG ================= */}
              {activeTab === 'configurator' && (
                <div className="space-y-6">
                  {/* Banner */}
                  <div className="p-4 bg-[#161616] border border-[#2a2a2a] flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-white font-bold uppercase flex items-center gap-2">
                        <Layers className="w-4 h-4 text-[#CEFF00]" />
                        <span>التحكم في خيارات معمل القياس 3D (FITTING LAB SPECS)</span>
                      </div>
                      <div className="text-[11px] text-[#888]">
                        حدد القصات، الخامات، وأوضاع الإضاءة المسموح للزبون بالاختيار بينها في الـ 3D مع تحديد الإعداد الافتراضي
                      </div>
                    </div>
                    <div className="hidden sm:block">
                      <span className="px-2.5 py-1 bg-[#0a0a0a] border border-[#CEFF00]/40 text-[#CEFF00] text-[10px] font-mono uppercase">
                        3D ATELIER ENGINE
                      </span>
                    </div>
                  </div>

                  {/* 1. Silhouette / Fit (القصة والقوام) */}
                  <div className="p-4 bg-[#141414] border border-[#242424] space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-bold uppercase flex items-center gap-2">
                          <span className="w-2 h-2 bg-[#CEFF00]" />
                          <span>1. القصة والقوام المتاحة (Allowed Fits)</span>
                        </div>
                        <div className="text-[11px] text-[#777]">
                          القصات المسموح بطلبها في مجسم الـ 3D (اضغط لتفعيل أو تعطيل أي قصة)
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-[#CEFF00]">
                        {availableFits.length} قصات مفعّلة
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {ALL_FITS.map((item) => {
                        const isEnabled = availableFits.includes(item.id);
                        const isDefault = defaultFit === item.id;
                        return (
                          <div
                            key={item.id}
                            className={`p-3.5 border transition-all ${
                              isEnabled
                                ? 'bg-[#181818] border-[#CEFF00]/60 shadow-[0_0_10px_rgba(206,255,0,0.1)]'
                                : 'bg-[#0c0c0c] border-[#222] opacity-50'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-mono font-bold text-xs text-white uppercase">{item.labelEn}</span>
                              <button
                                type="button"
                                onClick={() => handleToggleFit(item.id)}
                                className={`px-2 py-0.5 text-[9px] font-mono uppercase transition-colors ${
                                  isEnabled
                                    ? 'bg-[#CEFF00] text-black font-bold'
                                    : 'bg-[#222] text-[#777] hover:text-white'
                                }`}
                              >
                                {isEnabled ? 'مفعّل ✓' : 'معطّل ✕'}
                              </button>
                            </div>
                            <div className="text-xs text-[#aaa] font-sans font-medium mb-1">{item.descAr}</div>
                            <div className="text-[10px] font-mono text-[#666]">{item.descEn}</div>

                            {isEnabled && (
                              <div className="mt-3 pt-2 border-t border-[#2a2a2a] flex items-center justify-between">
                                <span className="text-[10px] text-[#888]">الافتراضي:</span>
                                <button
                                  type="button"
                                  onClick={() => setDefaultFit(item.id)}
                                  className={`text-[10px] font-mono px-2 py-0.5 border transition-all ${
                                    isDefault
                                      ? 'bg-[#CEFF00]/20 border-[#CEFF00] text-[#CEFF00] font-bold'
                                      : 'border-[#333] text-[#777] hover:text-white hover:border-[#555]'
                                  }`}
                                >
                                  {isDefault ? 'الافتراضي الحالي ★' : 'تعيين كافتراضي'}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Fabric Finish (خامة النسيج) */}
                  <div className="p-4 bg-[#141414] border border-[#242424] space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-bold uppercase flex items-center gap-2">
                          <span className="w-2 h-2 bg-[#CEFF00]" />
                          <span>2. خامات النسيج المتاحة (Allowed Fabric Finishes)</span>
                        </div>
                        <div className="text-[11px] text-[#777]">
                          الخامات المتاحة للمعاينة بـ PBR Shaders ولمعان النسيج الواقعي
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-[#CEFF00]">
                        {availableFinishes.length} خامات مفعّلة
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {ALL_FINISHES.map((item) => {
                        const isEnabled = availableFinishes.includes(item.id);
                        const isDefault = defaultFinish === item.id;
                        return (
                          <div
                            key={item.id}
                            className={`p-3.5 border transition-all ${
                              isEnabled
                                ? 'bg-[#181818] border-[#CEFF00]/60 shadow-[0_0_10px_rgba(206,255,0,0.1)]'
                                : 'bg-[#0c0c0c] border-[#222] opacity-50'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-mono font-bold text-xs text-white uppercase">{item.labelEn}</span>
                              <button
                                type="button"
                                onClick={() => handleToggleFinish(item.id)}
                                className={`px-2 py-0.5 text-[9px] font-mono uppercase transition-colors ${
                                  isEnabled
                                    ? 'bg-[#CEFF00] text-black font-bold'
                                    : 'bg-[#222] text-[#777] hover:text-white'
                                }`}
                              >
                                {isEnabled ? 'مفعّل ✓' : 'معطّل ✕'}
                              </button>
                            </div>
                            <div className="text-xs text-[#aaa] font-sans font-medium mb-1">{item.descAr}</div>
                            <div className="text-[10px] font-mono text-[#666]">{item.descEn}</div>

                            {isEnabled && (
                              <div className="mt-3 pt-2 border-t border-[#2a2a2a] flex items-center justify-between">
                                <span className="text-[10px] text-[#888]">الافتراضي:</span>
                                <button
                                  type="button"
                                  onClick={() => setDefaultFinish(item.id)}
                                  className={`text-[10px] font-mono px-2 py-0.5 border transition-all ${
                                    isDefault
                                      ? 'bg-[#CEFF00]/20 border-[#CEFF00] text-[#CEFF00] font-bold'
                                      : 'border-[#333] text-[#777] hover:text-white hover:border-[#555]'
                                  }`}
                                >
                                  {isDefault ? 'الافتراضي الحالي ★' : 'تعيين كافتراضي'}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Studio Lighting (إضاءة الاستوديو) */}
                  <div className="p-4 bg-[#141414] border border-[#242424] space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-bold uppercase flex items-center gap-2">
                          <span className="w-2 h-2 bg-[#CEFF00]" />
                          <span>3. أوضاع إضاءة الاستوديو (Studio Lighting Moods)</span>
                        </div>
                        <div className="text-[11px] text-[#777]">
                          بيئات الإضاءة ثلاثية الأبعاد لمحاكاة الهودي في مختلف الأجواء
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-[#CEFF00]">
                        {availableLighting.length} إضاءات مفعّلة
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {ALL_LIGHTING.map((item) => {
                        const isEnabled = availableLighting.includes(item.id);
                        const isDefault = defaultLighting === item.id;
                        return (
                          <div
                            key={item.id}
                            className={`p-3.5 border transition-all ${
                              isEnabled
                                ? 'bg-[#181818] border-[#CEFF00]/60 shadow-[0_0_10px_rgba(206,255,0,0.1)]'
                                : 'bg-[#0c0c0c] border-[#222] opacity-50'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-mono font-bold text-xs text-white uppercase">{item.labelEn}</span>
                              <button
                                type="button"
                                onClick={() => handleToggleLighting(item.id)}
                                className={`px-2 py-0.5 text-[9px] font-mono uppercase transition-colors ${
                                  isEnabled
                                    ? 'bg-[#CEFF00] text-black font-bold'
                                    : 'bg-[#222] text-[#777] hover:text-white'
                                }`}
                              >
                                {isEnabled ? 'مفعّل ✓' : 'معطّل ✕'}
                              </button>
                            </div>
                            <div className="text-xs text-[#aaa] font-sans font-medium mb-1">{item.descAr}</div>
                            <div className="text-[10px] font-mono text-[#666]">{item.descEn}</div>

                            {isEnabled && (
                              <div className="mt-3 pt-2 border-t border-[#2a2a2a] flex items-center justify-between">
                                <span className="text-[10px] text-[#888]">الافتراضي:</span>
                                <button
                                  type="button"
                                  onClick={() => setDefaultLighting(item.id)}
                                  className={`text-[10px] font-mono px-2 py-0.5 border transition-all ${
                                    isDefault
                                      ? 'bg-[#CEFF00]/20 border-[#CEFF00] text-[#CEFF00] font-bold'
                                      : 'border-[#333] text-[#777] hover:text-white hover:border-[#555]'
                                  }`}
                                >
                                  {isDefault ? 'الافتراضي الحالي ★' : 'تعيين كافتراضي'}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Right Column: Live Brutalist Card Preview */}
          <div className="lg:col-span-4 bg-[#111] border border-[#242424] p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-[#222] pb-2 mb-3">
                <span className="text-[10px] font-mono text-[#CEFF00] tracking-widest uppercase flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  <span>LIVE STORE PREVIEW</span>
                </span>
                <span className="text-[10px] font-mono text-[#666]">{weightGsm} GSM</span>
              </div>

              {/* Product Card Preview */}
              <div className="border border-[#292929] bg-[#0c0c0c] overflow-hidden">
                <div className="relative aspect-[3/4] bg-[#161616] overflow-hidden">
                  <img
                    src={images[0] || '/products/chrome-spider-black.webp'}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  {badge && (
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-0.5 bg-black/90 text-[#CEFF00] border border-[#333] text-[9px] font-mono font-bold tracking-widest uppercase">
                        {badge}
                      </span>
                    </div>
                  )}
                  {has3DModel && (
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-0.5 bg-[#CEFF00] text-black text-[9px] font-mono font-bold tracking-wider uppercase">
                        3D READY
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-3 space-y-2 font-mono">
                  <div className="text-xs font-bold text-white uppercase truncate">
                    {name || 'UNTITLED GARMENT'}
                  </div>
                  <div className="text-[11px] text-[#888] font-sans truncate">
                    {nameAr || 'قطعة بدون اسم'}
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-bold text-[#CEFF00]">
                      {formatPrice(price || 0)}
                    </span>
                    {originalPrice && Number(originalPrice) > Number(price) && (
                      <span className="text-[11px] text-[#555] line-through">
                        {formatPrice(Number(originalPrice))}
                      </span>
                    )}
                  </div>

                  {/* Color dots preview */}
                  <div className="flex items-center gap-1.5 pt-1 border-t border-[#1a1a1a]">
                    {colors.map((c, i) => (
                      <span
                        key={i}
                        title={c.name}
                        className="w-3 h-3 rounded-full border border-[#444]"
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>

                  {/* Size pills preview */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {sizes.map((s) => (
                      <span key={s} className="px-1.5 py-0.5 bg-[#181818] border border-[#333] text-[9px] text-[#aaa]">
                        {s}
                      </span>
                    ))}
                  </div>

                  {/* 3D Configurator Badges in Preview */}
                  <div className="pt-2 border-t border-[#1a1a1a] space-y-1 text-[9px] font-mono text-[#888]">
                    <div className="text-[#CEFF00] font-bold uppercase flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      <span>3D LAB OPTIONS:</span>
                    </div>
                    <div className="truncate">FITS: {availableFits.map((f) => f.toUpperCase()).join(' • ')}</div>
                    <div className="truncate">FINISHES: {availableFinishes.map((f) => f.toUpperCase()).join(' • ')}</div>
                    <div className="truncate">LIGHTS: {availableLighting.map((l) => l.toUpperCase()).join(' • ')}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Form Actions */}
            <div className="pt-4 border-t border-[#222] space-y-2">
              <button
                type="submit"
                form="product-editor-form"
                className="w-full py-3.5 bg-[#CEFF00] hover:bg-[#b8e600] text-black font-mono font-bold text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(206,255,0,0.2)]"
              >
                <Save className="w-4 h-4" />
                <span>{initialProduct ? 'SAVE CHANGES (حفظ التعديلات)' : 'PUBLISH TO STORE (نشر في المتجر)'}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 bg-[#181818] hover:bg-[#222] text-[#888] hover:text-white font-mono text-xs uppercase transition-colors"
              >
                CANCEL (إلغاء)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// =====================================================================
// EDITORIAL COLLECTION EDITOR & CREATOR MODAL
// Full control over Title, Subtitle, Season Badge, Image & Linking
// =====================================================================

interface CollectionEditorModalProps {
  initialCollection: CollectionItem | null;
  onClose: () => void;
  onSave: (collection: CollectionItem) => void;
}

const COLLECTION_KEY_PRESETS = [
  { key: 'new-arrivals', labelEn: 'NEW ARRIVALS', labelAr: 'أحدث التشكيلات' },
  { key: 'oversized', labelEn: 'OVERSIZED', labelAr: 'أوفرسايز معمارى' },
  { key: 'essentials', labelEn: 'ESSENTIALS', labelAr: 'القطع الأساسية' },
  { key: 'outerwear', labelEn: 'OUTERWEAR', labelAr: 'الملابس الخارجية' },
  { key: 'limited-drops', labelEn: 'LIMITED DROPS', labelAr: 'إصدارات محدودة' },
];

const ACCENT_COLOR_PRESETS = [
  '#CEFF00',
  '#FFFFFF',
  '#898989',
  '#FF4800',
  '#00E5FF',
  '#FF0055',
  '#DCD7CE',
];

const SAMPLE_IMAGE_PRESETS = [
  'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1200&q=85',
];

const CollectionEditorModal: React.FC<CollectionEditorModalProps> = ({
  initialCollection,
  onClose,
  onSave,
}) => {
  const { categories } = useCart();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [titleEn, setTitleEn] = useState(initialCollection?.titleEn || '');
  const [titleAr, setTitleAr] = useState(initialCollection?.titleAr || '');
  const [subtitleEn, setSubtitleEn] = useState(initialCollection?.subtitleEn || '');
  const [subtitleAr, setSubtitleAr] = useState(initialCollection?.subtitleAr || '');
  const [seasonEn, setSeasonEn] = useState(initialCollection?.seasonEn || 'WINTER 2026');
  const [seasonAr, setSeasonAr] = useState(initialCollection?.seasonAr || 'شتاء 2026');
  const [itemCount, setItemCount] = useState<number>(initialCollection?.itemCount ?? 12);
  const [key, setKey] = useState<string>(initialCollection?.key || 'new-arrivals');
  const [accent, setAccent] = useState<string>(initialCollection?.accent || '#CEFF00');
  const [image, setImage] = useState<string>(
    initialCollection?.image || SAMPLE_IMAGE_PRESETS[0]
  );
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image size should be under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImage(event.target.result as string);
        setErrorMessage('');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleApplyCustomUrl = () => {
    if (!customImageUrl.trim()) return;
    setImage(customImageUrl.trim());
    setCustomImageUrl('');
    setErrorMessage('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!titleEn.trim()) {
      setErrorMessage('Please enter collection title in English.');
      return;
    }
    if (!titleAr.trim()) {
      setErrorMessage('Please enter collection title in Arabic.');
      return;
    }
    if (!subtitleEn.trim()) {
      setErrorMessage('Please enter English subtitle / description.');
      return;
    }
    if (!subtitleAr.trim()) {
      setErrorMessage('Please enter Arabic subtitle / description.');
      return;
    }
    if (!image.trim()) {
      setErrorMessage('Please provide a banner image.');
      return;
    }

    const id = initialCollection
      ? initialCollection.id
      : (key || titleEn.toLowerCase().replace(/[^a-z0-9]+/g, '-')) + '-' + Date.now().toString().slice(-4);

    const payload: CollectionItem = {
      id,
      key: key.trim().toLowerCase() || 'all',
      titleEn: titleEn.trim().toUpperCase(),
      titleAr: titleAr.trim(),
      subtitleEn: subtitleEn.trim(),
      subtitleAr: subtitleAr.trim(),
      seasonEn: seasonEn.trim().toUpperCase(),
      seasonAr: seasonAr.trim(),
      itemCount: Number(itemCount) || 0,
      image: image.trim(),
      accent: accent.trim() || '#CEFF00',
    };

    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#0d0d0d] border border-[#2b2b2b] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#141414] border-b border-[#222]">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-[#CEFF00]" />
            <h3 className="font-mono font-bold text-sm text-white uppercase tracking-wider">
              {initialCollection
                ? `EDIT EDITORIAL COLLECTION // ${initialCollection.titleEn}`
                : 'CREATE NEW EDITORIAL COLLECTION // إضافة تشكيلة جديدة'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#777] hover:text-white border border-transparent hover:border-[#333] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body: Form + Preview */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form */}
          <div className="lg:col-span-7 space-y-5">
            {errorMessage && (
              <div className="p-3 bg-red-950/40 border border-red-500/50 flex items-center gap-2 text-xs font-mono text-red-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form id="collection-editor-form" onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
              {/* Titles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#888] mb-1 uppercase font-bold">
                    Title in English <span className="text-[#CEFF00]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NEW ARRIVALS"
                    value={titleEn}
                    onChange={(e) => setTitleEn(e.target.value)}
                    className="w-full bg-[#141414] border border-[#333] text-white p-3 outline-none focus:border-[#CEFF00]"
                  />
                </div>
                <div>
                  <label className="block text-[#888] mb-1 uppercase font-bold">
                    عنوان التشكيلة بالعربي <span className="text-[#CEFF00]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    dir="rtl"
                    placeholder="مثال: أحدث التشكيلات"
                    value={titleAr}
                    onChange={(e) => setTitleAr(e.target.value)}
                    className="w-full bg-[#141414] border border-[#333] text-white p-3 outline-none focus:border-[#CEFF00] font-sans"
                  />
                </div>
              </div>

              {/* Subtitles */}
              <div>
                <label className="block text-[#888] mb-1 uppercase font-bold">
                  Subtitle in English <span className="text-[#CEFF00]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Series 04 / Nocturnal Heavyweight Armor"
                  value={subtitleEn}
                  onChange={(e) => setSubtitleEn(e.target.value)}
                  className="w-full bg-[#141414] border border-[#333] text-white p-3 outline-none focus:border-[#CEFF00]"
                />
              </div>

              <div>
                <label className="block text-[#888] mb-1 uppercase font-bold">
                  الوصف / العنوان الفرعي بالعربي <span className="text-[#CEFF00]">*</span>
                </label>
                <input
                  type="text"
                  required
                  dir="rtl"
                  placeholder="مثال: السلسلة 04 / دروع ليلية من الأقمشة الثقيلة"
                  value={subtitleAr}
                  onChange={(e) => setSubtitleAr(e.target.value)}
                  className="w-full bg-[#141414] border border-[#333] text-white p-3 outline-none focus:border-[#CEFF00] font-sans"
                />
              </div>

              {/* Season & Item Count */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[#888] mb-1 uppercase">Season Badge (EN)</label>
                  <input
                    type="text"
                    placeholder="e.g. WINTER 2026"
                    value={seasonEn}
                    onChange={(e) => setSeasonEn(e.target.value)}
                    className="w-full bg-[#141414] border border-[#333] text-white p-3 outline-none focus:border-[#CEFF00]"
                  />
                </div>
                <div>
                  <label className="block text-[#888] mb-1 uppercase">شارة الموسم (بالعربي)</label>
                  <input
                    type="text"
                    dir="rtl"
                    placeholder="مثال: شتاء 2026"
                    value={seasonAr}
                    onChange={(e) => setSeasonAr(e.target.value)}
                    className="w-full bg-[#141414] border border-[#333] text-white p-3 outline-none focus:border-[#CEFF00] font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[#888] mb-1 uppercase">Number of Pieces (قطع)</label>
                  <input
                    type="number"
                    min="1"
                    value={itemCount}
                    onChange={(e) => setItemCount(Number(e.target.value))}
                    className="w-full bg-[#141414] border border-[#333] text-white p-3 outline-none focus:border-[#CEFF00]"
                  />
                </div>
              </div>

              {/* Target Key & Accent Color */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#888] mb-1 uppercase">Target Category Slug (Link to Shop)</label>
                  <select
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    className="w-full bg-[#141414] border border-[#333] text-white p-3 font-mono text-xs outline-none focus:border-[#CEFF00] cursor-pointer"
                  >
                    {categories
                      .filter((c, idx, arr) => arr.findIndex((x) => x.key.toLowerCase() === c.key.toLowerCase()) === idx)
                      .map((p) => (
                        <option key={p.key} value={p.key} className="bg-[#141414] text-white">
                          {p.labelEn} ({p.labelAr}) - {p.key}
                        </option>
                      ))}
                    <option value="custom" className="bg-[#141414] text-[#CEFF00]">CUSTOM SLUG</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#888] mb-1 uppercase">Accent Color (لون التمييز)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={accent}
                      onChange={(e) => setAccent(e.target.value)}
                      className="w-10 h-10 border border-[#333] cursor-pointer bg-transparent"
                    />
                    <div className="flex flex-wrap gap-1">
                      {ACCENT_COLOR_PRESETS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setAccent(color)}
                          className={`w-6 h-6 border ${accent === color ? 'border-white scale-110' : 'border-[#333]'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Banner Image Selection & Upload */}
              <div className="p-4 bg-[#141414] border border-[#242424] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-white font-bold uppercase flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#CEFF00]" />
                    <span>صورة التشكيلة (Editorial Banner Image)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-[#222] hover:bg-[#CEFF00] hover:text-black border border-[#444] text-[11px] font-mono transition-colors flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>رفع من الجهاز</span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter image URL or select from presets below..."
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    className="flex-1 bg-[#0a0a0a] border border-[#333] text-white p-2.5 outline-none focus:border-[#CEFF00]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCustomUrl}
                    className="px-4 py-2.5 bg-[#CEFF00] text-black font-bold border border-[#CEFF00] uppercase hover:bg-[#b8e600]"
                  >
                    SET URL
                  </button>
                </div>

                {/* Presets */}
                <div className="pt-2">
                  <span className="text-[10px] text-[#777] block mb-1">EDITORIAL PRESETS (صور استوديو جاهزة):</span>
                  <div className="grid grid-cols-7 gap-1.5">
                    {SAMPLE_IMAGE_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setImage(preset)}
                        className={`aspect-video overflow-hidden border ${image === preset ? 'border-[#CEFF00] ring-1 ring-[#CEFF00]' : 'border-[#333] opacity-70 hover:opacity-100'}`}
                      >
                        <img src={preset} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Live Preview Card */}
          <div className="lg:col-span-5 bg-[#111] border border-[#242424] p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-[#222] pb-2 mb-3">
                <span className="text-[10px] font-mono text-[#CEFF00] tracking-widest uppercase flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  <span>EDITORIAL PREVIEW</span>
                </span>
                <span className="text-[10px] font-mono text-[#666]">{itemCount} PIECES</span>
              </div>

              {/* Magazine Card Miniature */}
              <div className="relative h-[280px] overflow-hidden bg-[#141414] border border-[#292929]">
                <img
                  src={image || SAMPLE_IMAGE_PRESETS[0]}
                  alt="Preview"
                  className="w-full h-full object-cover filter grayscale-0 sm:grayscale hover:grayscale-0 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#090909] via-[#090909]/45 to-transparent opacity-95" />

                {/* Badges */}
                <div className="absolute top-3 start-3 flex items-center gap-2 z-10">
                  <span
                    className="px-2.5 py-1 text-[#090909] text-[9px] font-mono font-bold tracking-widest uppercase shadow-sm"
                    style={{ backgroundColor: accent || '#CEFF00' }}
                  >
                    {seasonAr || seasonEn}
                  </span>
                  <span className="text-[9px] font-mono text-[#ccc] bg-[#111]/85 backdrop-blur-md px-2 py-1 border border-[#333]">
                    {itemCount} قطع
                  </span>
                </div>

                {/* Floating Info */}
                <div className="absolute bottom-3 start-3 end-3 flex items-end justify-between gap-2 z-10 text-start">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl font-black tracking-tight uppercase text-white truncate">
                      {titleAr || titleEn || 'UNTITLED COLLECTION'}
                    </h3>
                    <p className="text-[11px] font-mono text-[#aaa] mt-0.5 line-clamp-2">
                      {subtitleAr || subtitleEn || 'Collection subtitle description here.'}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-[#171717]/90 border border-[#333] flex items-center justify-center shrink-0">
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#CEFF00]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-[#222] space-y-2">
              <button
                type="submit"
                form="collection-editor-form"
                className="w-full py-3.5 bg-[#CEFF00] hover:bg-[#b8e600] text-black font-mono font-bold text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(206,255,0,0.2)]"
              >
                <Save className="w-4 h-4" />
                <span>{initialCollection ? 'SAVE COLLECTION (حفظ التعديلات)' : 'PUBLISH COLLECTION (نشر التشكيلة)'}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 bg-[#181818] hover:bg-[#222] text-[#888] hover:text-white font-mono text-xs uppercase transition-colors"
              >
                CANCEL (إلغاء)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
