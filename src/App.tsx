/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  User,
  LogOut,
  Sparkles,
  BarChart3,
  FileText,
  Truck,
  RotateCcw,
  Check,
  ChevronRight,
  ShieldCheck,
  Crown,
  HelpCircle,
  Layers,
  ArrowRight,
  Mail,
  Lock,
} from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, testFirestoreConnection, syncUserProfile, fastLoginDemoUser } from './firebase';
import { PRODUCTS } from './data/products';
import { Product, ColorOption, CartItem, AppUser, ElectronicInvoice } from './types';

// Components
import { Product3DViewer } from './components/Product3DViewer';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { ElectronicInvoiceModal } from './components/ElectronicInvoiceModal';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { AuthModal } from './components/AuthModal';
import { AdminGestionnaireModal } from './components/AdminGestionnaireModal';
import { AIPredictivePanel } from './components/AIPredictivePanel';
import { TunisianAIAssistant } from './components/TunisianAIAssistant';
import { CustomerReviewsSection } from './components/CustomerReviewsSection';
import { CinematicIntroAnimation } from './components/CinematicIntroAnimation';

export default function App() {
  // Authentication & user state
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);

  // Active product customization state
  const [activeProduct, setActiveProduct] = useState<Product>(PRODUCTS[0]);
  const [selectedColor, setSelectedColor] = useState<ColorOption>(PRODUCTS[0].defaultColor);
  const [selectedSize, setSelectedSize] = useState<string>(PRODUCTS[0].defaultSize);
  const [quantity, setQuantity] = useState<number>(1);

  // Catalog filters & view mode
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');

  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  // Modals state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState<boolean>(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState<boolean>(false);
  const [activeInvoice, setActiveInvoice] = useState<ElectronicInvoice | null>(null);

  // Cinematic 3D Animation state
  const [isIntroOpen, setIsIntroOpen] = useState<boolean>(false);

  // AI Assistant state
  const [isAIOpen, setIsAIOpen] = useState<boolean>(false);

  // Notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize Firebase Auth listener & test connection
  useEffect(() => {
    testFirestoreConnection();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profile = await syncUserProfile(user);
        setCurrentUser(profile);
      }
    });

    return () => unsubscribe();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Update selected color & size when active product changes
  const handleSelectProduct = (prod: Product) => {
    setActiveProduct(prod);
    setSelectedColor(prod.defaultColor);
    setSelectedSize(prod.defaultSize);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Add to cart handler
  const handleAddToCart = () => {
    if (!currentUser) {
      showToast('Connectez-vous pour profiter des points de fidélité et de l\'accès VIP !');
    }

    const newItemId = `${activeProduct.id}-${selectedSize}-${selectedColor.name}`;
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === newItemId);
      if (existing) {
        return prev.map((item) =>
          item.id === newItemId ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [
        ...prev,
        {
          id: newItemId,
          productId: activeProduct.id,
          name: activeProduct.name,
          price: activeProduct.price,
          size: selectedSize,
          color: selectedColor,
          quantity,
          model3DType: activeProduct.model3DType,
        },
      ];
    });

    showToast(`"${activeProduct.name}" ajouté au panier ! (${selectedSize}, ${selectedColor.name})`);
    setIsCartOpen(true);
  };

  // Add bundle item from AI prediction panel
  const handleAddBundleItem = (bundle: any) => {
    const matchingProduct = PRODUCTS.find((p) => p.id === bundle.productId) || PRODUCTS[4];
    const discountedPrice = Number((bundle.complementaryPrice * 0.9).toFixed(3));
    const newItemId = `${matchingProduct.id}-${matchingProduct.defaultSize}-${matchingProduct.defaultColor.name}`;

    setCartItems((prev) => [
      ...prev,
      {
        id: newItemId,
        productId: matchingProduct.id,
        name: `${matchingProduct.name} (Duo Pack -10%)`,
        price: discountedPrice,
        size: matchingProduct.defaultSize,
        color: matchingProduct.defaultColor,
        quantity: 1,
        model3DType: matchingProduct.model3DType,
      },
    ]);

    showToast(`Duo Pack activé ! "${matchingProduct.name}" ajouté avec 10% de remise !`);
    setIsCartOpen(true);
  };

  const handleUpdateCartQuantity = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveCartItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleOrderSuccess = (invoice: ElectronicInvoice) => {
    setActiveInvoice(invoice);
    setIsCheckoutOpen(false);
    setCartItems([]);
    setIsInvoiceOpen(true);
    showToast(`Commande confirmée ! Facture N° ${invoice.invoiceNumber} générée.`);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    showToast('Déconnexion réussie');
  };

  const handleFastLogin = async (role: 'admin' | 'vip') => {
    const user = await fastLoginDemoUser(role);
    setCurrentUser(user);
    showToast(`Connecté avec succès en tant que ${user.displayName} !`);
  };

  const isVip = currentUser?.subscriptionTier === 'vip_club' || currentUser?.subscriptionTier === 'premium';

  // Filtered products list
  const filteredProducts = PRODUCTS.filter((p) => {
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    return 0;
  });

  const cartTotalCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // BOUTIQUE ACCESSIBLE DIRECTEMENT À TOUS LES CLIENTS & VISITEURS (THÈME BLANC)
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-amber-500 text-slate-950 font-bold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-amber-300 animate-in fade-in slide-in-from-top duration-300 text-xs sm:text-sm">
          <Check className="w-4 h-4 bg-slate-950 text-amber-400 rounded-full p-0.5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner: Tunisia Local Info */}
      <div className="bg-slate-900 text-white text-xs font-semibold py-2 px-4 text-center">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 mx-auto sm:mx-0">
            <span className="text-sm">🇹🇳</span>
            <span>
              <strong>Livraison Express 24h/48h</strong> sur toute la Tunisie · Paiement à la livraison
              (Contre remboursement) · Facture Électronique certifiée
            </span>
          </div>
          <div className="hidden md:flex items-center gap-4 text-[11px] text-slate-300 font-medium">
            <span>Échange de pointure gratuit sous 7 jours</span>
            <span>·</span>
            <span>Support client: +216 71 840 210</span>
          </div>
        </div>
      </div>

      {/* Main Navbar (Clean White Theme, no clutter) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => {
                setSelectedCategory('all');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black text-xl shadow-md group-hover:scale-105 transition-transform">
                K
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight text-slate-900 group-hover:text-amber-600 transition-colors">
                  KARTAGO<span className="text-amber-500">.3D</span>
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
                  Tunisie · Mode & Sneakers
                </span>
              </div>
            </button>

            {/* Navigation Category Links */}
            <nav className="hidden md:flex items-center gap-1">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'text-amber-700 bg-amber-50 border border-amber-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Tout le Catalogue ({PRODUCTS.length})
              </button>
              <button
                onClick={() => setSelectedCategory('shoes')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                  selectedCategory === 'shoes'
                    ? 'text-amber-700 bg-amber-50 border border-amber-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Chaussures & Sneakers 3D
              </button>
              <button
                onClick={() => setSelectedCategory('apparel')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                  selectedCategory === 'apparel'
                    ? 'text-amber-700 bg-amber-50 border border-amber-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Streetwear
              </button>
              <button
                onClick={() => setSelectedCategory('accessories')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                  selectedCategory === 'accessories'
                    ? 'text-amber-700 bg-amber-50 border border-amber-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Maroquinerie & Accessoires
              </button>
            </nav>
          </div>

          {/* Action Buttons: Big Gestionnaire, User, Tracking, Tunisian AI & Cart */}
          <div className="flex items-center gap-2.5">
            {/* Big Gestionnaire Admin Button */}
            <button
              onClick={() => setIsAdminModalOpen(true)}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Ouvrir la session d'administration Big Gestionnaire"
            >
              <BarChart3 className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Big Gestionnaire</span>
              <span className="sm:hidden">Admin</span>
            </button>

            {/* User Profile or Fast Login */}
            {currentUser ? (
              <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-xl p-1 pr-2">
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-800 hover:text-slate-950 cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xs">
                    {currentUser.displayName?.[0] || 'U'}
                  </div>
                  <span className="hidden md:inline max-w-[100px] truncate">
                    {currentUser.displayName}
                  </span>
                  {isVip && (
                    <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded font-bold">
                      VIP
                    </span>
                  )}
                </button>
                <button
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-red-500 p-1 transition-colors cursor-pointer"
                  title="Se déconnecter"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleFastLogin('admin')}
                  className="hidden sm:flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
                  title="Connexion démo 1-clic Super Admin"
                >
                  <Crown className="w-3.5 h-3.5 text-slate-950" />
                  <span>Admin Démo</span>
                </button>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <User className="w-4 h-4 text-amber-600" />
                  <span>Connexion</span>
                </button>
              </div>
            )}

            {/* Factures tracking button */}
            <button
              onClick={() => setIsTrackingOpen(true)}
              className="hidden lg:flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <FileText className="w-4 h-4 text-amber-600" />
              <span>Factures</span>
            </button>

            {/* Conseiller AI */}
            <button
              onClick={() => setIsAIOpen(true)}
              className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <span className="text-sm">🇹🇳</span>
              <span className="hidden sm:inline">Conseiller IA</span>
            </button>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative bg-amber-500 hover:bg-amber-400 text-slate-950 p-2.5 rounded-xl font-bold transition-all shadow-md cursor-pointer"
              title="Ouvrir le panier"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartTotalCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white font-mono text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-white">
                  {cartTotalCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-16">
        {/* HERO SECTION: Interactive 3D Customizer Studio */}
        <section className="relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 7 Columns: The 3D Interactive Model Canvas */}
            <div className="lg:col-span-7 flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="text-amber-600 font-semibold uppercase tracking-wider">
                    Studio 3D Temps Réel
                  </span>
                  <span>/</span>
                  <span className="text-slate-800 font-medium">{activeProduct.name}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>En stock à Tunis</span>
                </div>
              </div>

              {/* 3D Viewer Canvas */}
              <Product3DViewer
                product={activeProduct}
                selectedColor={selectedColor}
                onColorChange={(col) => setSelectedColor(col)}
              />

              {/* 3D Features helper notice */}
              <div className="grid grid-cols-3 gap-3 text-center text-xs text-slate-600 bg-white border border-slate-200 rounded-2xl p-3 shadow-xs">
                <div className="flex flex-col items-center gap-1">
                  <RotateCcw className="w-4 h-4 text-amber-600" />
                  <span className="font-semibold text-slate-900">Rotation 360° Libre</span>
                  <span className="text-[10px] text-slate-500">Glissez à la souris ou au doigt</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-slate-900">Vue Éclatée Anatomie</span>
                  <span className="text-[10px] text-slate-500">Inspectez la semelle & tige</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-slate-900">Nuancier Tunisien</span>
                  <span className="text-[10px] text-slate-500">Teintes Méditerranée & Sahara</span>
                </div>
              </div>

              {/* Sizing Warning for underperforming product as diagnosed by Big Gestionnaire */}
              {activeProduct.id === 'carthage-speed' && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-center gap-3">
                  <HelpCircle className="w-5 h-5 flex-shrink-0 text-amber-600" />
                  <div>
                    <strong>Conseil Pointure IA KARTAGO :</strong> Ce modèle de running technique chausse ajusté. Nous vous recommandons de sélectionner <strong>une pointure au-dessus</strong> de votre pointure habituelle.
                  </div>
                </div>
              )}
            </div>

            {/* Right 5 Columns: Product Customization Panel (White Luxury Theme) */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 flex flex-col space-y-6 shadow-md">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {activeProduct.badges.map((b, i) => (
                    <span
                      key={i}
                      className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg border border-slate-200"
                    >
                      {b}
                    </span>
                  ))}
                  {isVip && (
                    <span className="text-[11px] font-bold bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded-lg border border-amber-200 flex items-center gap-1">
                      <Crown className="w-3 h-3 text-amber-600" />
                      <span>-15% VIP</span>
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {activeProduct.name}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                  {activeProduct.tagline}
                </p>

                <div className="flex items-baseline gap-3 mt-4">
                  <span className="text-3xl font-black text-amber-600 font-mono">
                    {isVip ? (activeProduct.price * 0.85).toFixed(3) : activeProduct.price.toFixed(3)} DT
                  </span>
                  {isVip && (
                    <span className="text-xs text-slate-400 line-through font-mono">
                      {activeProduct.price.toFixed(3)} DT
                    </span>
                  )}
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 ml-auto">
                    TVA 19% Incluse
                  </span>
                </div>
              </div>

              {/* Color Selection with Visual Sync */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between mb-2.5">
                  <span>Coloris Sélectionné: <strong className="text-slate-900">{selectedColor.name}</strong></span>
                  {selectedColor.labelDerja && (
                    <span className="text-amber-700 text-xs font-medium">
                      {selectedColor.labelDerja}
                    </span>
                  )}
                </label>

                <div className="grid grid-cols-2 gap-2.5">
                  {activeProduct.colors.map((c) => {
                    const isSelected = selectedColor.name === c.name;
                    return (
                      <button
                        key={c.name}
                        onClick={() => setSelectedColor(c)}
                        className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50/70 text-slate-900 shadow-xs'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:text-slate-900'
                        }`}
                      >
                        <span
                          className="w-5 h-5 rounded-full border border-slate-300 shadow-xs flex-shrink-0"
                          style={{ backgroundColor: c.hex }}
                        />
                        <div className="truncate">
                          <p className="font-semibold truncate">{c.name}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Size Selection */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {activeProduct.category === 'shoes' ? 'Pointure Tunisienne / EU:' : 'Taille:'}
                  </label>
                  <button
                    onClick={() => setIsAIOpen(true)}
                    className="text-xs text-amber-700 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Guide pointures Sami AI</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {activeProduct.availableSizes.map((sz) => {
                    const isSelected = selectedSize === sz;
                    return (
                      <button
                        key={sz}
                        onClick={() => setSelectedSize(sz)}
                        className={`min-w-[46px] h-11 px-3 rounded-xl font-bold font-mono text-xs flex items-center justify-center border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-amber-500 bg-amber-500 text-slate-950 shadow-xs font-extrabold'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:text-slate-900'
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quantity and Actions */}
              <div className="pt-2 border-t border-slate-200 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-900 rounded-lg transition-colors font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-xs font-mono font-bold text-slate-900">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-900 rounded-lg transition-colors font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold py-3.5 px-6 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Ajouter au Panier</span>
                  </button>
                </div>

                {/* Instant Order with Direct Invoice Generation */}
                <button
                  onClick={() => {
                    handleAddToCart();
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-xs cursor-pointer shadow-xs"
                >
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>Commander immédiatement & Recevoir ma Facture</span>
                </button>
              </div>

              {/* Delivery & Tunisia Policy Badges */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2.5 text-slate-800">
                  <Truck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>
                    Livraison Aramex Express (24-48h): <strong>7 DT</strong> ou <strong>GRATUITE</strong> dès 150 DT {isVip && '(Offerte pour vous VIP)'}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>
                    Paiement à la livraison après inspection du colis ou Carte Bancaire
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-800">
                  <FileText className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>
                    Facture électronique officielle envoyée automatiquement par email
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AI MACHINE LEARNING & NLP PREDICTIVE PANEL SECTION */}
        <section className="space-y-4">
          <AIPredictivePanel
            product={activeProduct}
            selectedColor={selectedColor}
            selectedSize={selectedSize}
            cartItems={cartItems}
            userProfile={currentUser}
            onApplySize={(size) => {
              setSelectedSize(size);
              showToast(`Pointure ajustée à ${size} selon la prédiction Machine Learning !`);
            }}
            onAddBundleItem={handleAddBundleItem}
            onFastCheckout={() => {
              handleAddToCart();
              setIsCartOpen(false);
              setIsCheckoutOpen(true);
            }}
          />
        </section>

        {/* FULL PRODUCT CATALOG WITH 3D PREVIEW & FILTERS (Display every product) */}
        <section className="space-y-8 pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Catalogue KARTAGO Tunisie
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Cliquez sur n'importe quel article pour le charger en 3D interactif et personnaliser ses couleurs
              </p>
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-xs">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tous ({PRODUCTS.length})
                </button>
                <button
                  onClick={() => setSelectedCategory('shoes')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    selectedCategory === 'shoes'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Chaussures 3D
                </button>
                <button
                  onClick={() => setSelectedCategory('apparel')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    selectedCategory === 'apparel'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Streetwear
                </button>
                <button
                  onClick={() => setSelectedCategory('accessories')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    selectedCategory === 'accessories'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Accessoires
                </button>
              </div>

              {/* Sort selector */}
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-amber-500 shadow-xs cursor-pointer"
              >
                <option value="featured">Les plus populaires</option>
                <option value="price-asc">Prix: Moins cher au plus cher</option>
                <option value="price-desc">Prix: Plus cher au moins cher</option>
              </select>
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((prod) => {
              const isCurrentlyActiveIn3D = activeProduct.id === prod.id;
              return (
                <div
                  key={prod.id}
                  className={`group bg-white border rounded-3xl overflow-hidden flex flex-col transition-all duration-200 hover:shadow-lg ${
                    isCurrentlyActiveIn3D ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md' : 'border-slate-200 shadow-xs'
                  }`}
                >
                  {/* Card 3D Preview Box */}
                  <div
                    onClick={() => handleSelectProduct(prod)}
                    className="relative h-56 bg-slate-50 border-b border-slate-100 flex items-center justify-center p-6 cursor-pointer overflow-hidden"
                  >
                    {/* Background color glow matching product default color */}
                    <div
                      className="absolute inset-0 opacity-10 blur-2xl group-hover:opacity-20 transition-opacity"
                      style={{ backgroundColor: prod.defaultColor.hex }}
                    />

                    {/* 3D Indicator Badge */}
                    <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-white/90 backdrop-blur-md border border-slate-200 rounded-lg px-2.5 py-1 text-[10px] font-bold text-slate-800 shadow-xs">
                      <RotateCcw className="w-3 h-3 text-amber-600 animate-spin" style={{ animationDuration: '8s' }} />
                      <span>Modèle 3D Rotatif</span>
                    </div>

                    {isCurrentlyActiveIn3D && (
                      <div className="absolute top-3 right-3 z-10 bg-amber-500 text-slate-950 font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow-xs">
                        En Studio
                      </div>
                    )}

                    {/* Stylized Product Shape Representation */}
                    <div className="relative transform group-hover:scale-110 transition-transform duration-300 flex flex-col items-center">
                      <div
                        className="w-32 h-20 rounded-3xl shadow-md flex items-center justify-center border border-black/10 relative"
                        style={{
                          backgroundColor: prod.defaultColor.hex,
                          boxShadow: `0 15px 25px -5px ${prod.defaultColor.hex}40`,
                        }}
                      >
                        <span className="text-white font-black text-xs uppercase tracking-wider drop-shadow">
                          {prod.name.split(' ')[0]}
                        </span>
                        {/* Sole strip */}
                        <div
                          className="absolute bottom-0 inset-x-0 h-4 rounded-b-3xl border-t border-black/10"
                          style={{ backgroundColor: prod.defaultColor.soleHex || '#ffffff' }}
                        />
                      </div>
                      <span className="mt-3 text-[11px] font-medium text-slate-500 group-hover:text-amber-600 flex items-center gap-1">
                        <span>Ouvrir en 3D</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>

                  {/* Card Info */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span>{prod.category === 'shoes' ? 'Chaussure' : prod.category === 'apparel' ? 'Streetwear' : 'Accessoire'}</span>
                        <span className="text-amber-600 font-semibold font-mono">★ {prod.rating} ({prod.reviewsCount})</span>
                      </div>
                      <h3
                        onClick={() => handleSelectProduct(prod)}
                        className="font-bold text-slate-900 text-base hover:text-amber-600 transition-colors cursor-pointer"
                      >
                        {prod.name}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {prod.description}
                      </p>
                    </div>

                    {/* Color Swatches */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-slate-400 font-medium">Coloris:</span>
                      {prod.colors.map((c) => (
                        <span
                          key={c.name}
                          title={c.name}
                          className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-xs"
                          style={{ backgroundColor: c.hex }}
                        />
                      ))}
                    </div>

                    {/* Card Price & Action Button */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-lg font-black text-amber-600 font-mono">
                        {prod.price.toFixed(3)} DT
                      </span>

                      <button
                        onClick={() => handleSelectProduct(prod)}
                        className="bg-slate-100 hover:bg-amber-500 hover:text-slate-950 text-slate-800 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span>Personnaliser 3D</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* CUSTOMER REVIEWS & FIRESTORE VERIFIED PURCHASES SECTION */}
        <CustomerReviewsSection
          activeProduct={activeProduct}
          currentUser={currentUser}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onShowToast={showToast}
        />

        {/* BIG GESTIONNAIRE BANNER CALLOUT */}
        <section className="bg-white border border-slate-200 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                Espace Gestion Commerciale KARTAGO
              </span>
              <span className="bg-red-600 text-white font-mono text-[10px] px-2 py-0.5 rounded-full font-bold">
                PRO ADMIN
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              Big Gestionnaire · Produits Rentables, Diagnostic & Abonnés VIP
            </h3>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              Supervisez en temps réel le chiffre d'affaires, abonnez des clients au Club VIP, détectez les produits sous-performants grâce au machine learning et gérez l'ensemble des factures électroniques conformes.
            </p>
          </div>

          <button
            onClick={() => setIsAdminModalOpen(true)}
            className="flex-shrink-0 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black px-6 py-3.5 rounded-2xl shadow-md transition-all flex items-center gap-2 text-sm cursor-pointer"
          >
            <BarChart3 className="w-5 h-5 text-slate-950" />
            <span>Ouvrir la Console Big Gestionnaire</span>
          </button>
        </section>

        {/* ELECTRONIC INVOICING & TUNISIAN STANDARDS EXPLAINER SECTION */}
        <section className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-xs">
          <div className="max-w-3xl mb-8">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
              Système de Facturation Électronique & Transparence
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Commande Conforme & Facture Officielle Automatisée
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
              KARTAGO est une entreprise tunisienne certifiée. Chaque commande donne lieu à la génération instantanée
              d'une facture électronique normalisée comportant notre Matricule Fiscal (MF 1849204/B/A/M/000), le droit de timbre fiscal obligatoire (1 DT), la TVA 19% et l'envoi automatique sur votre adresse email.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Facture Électronique Automatisée</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Reçue instantanément par email lors de la validation avec QR code de vérification et détail exhaustif HT/TTC.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Truck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">24 Wilayas de Tunisie</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Partenariat officiel avec Aramex Express Tunisie. Suivi en ligne par SMS et code de tracking direct.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Paiement & Échange Sécurisé</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Payez en espèces au livreur à la réception de votre colis. Échange de pointure gratuit sous 7 jours.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Main Footer (White Theme) */}
      <footer className="bg-white border-t border-slate-200 mt-16 py-12 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black">
                  K
                </div>
                <span className="font-extrabold text-slate-900 text-base">KARTAGO 3D</span>
              </div>
              <p className="text-slate-500 text-xs leading-relaxed">
                Première boutique en ligne en Tunisie combinant rendu 3D haute fidélité, savoir-faire maroquinier tunisien et intelligence artificielle dialectale.
              </p>
              <div className="text-[11px] font-mono text-slate-400">
                Matricule Fiscal: 1849204/B/A/M/000
              </div>
            </div>

            <div>
              <h5 className="font-bold text-slate-900 uppercase tracking-wider mb-3">Produits 3D</h5>
              <ul className="space-y-2">
                <li><button onClick={() => setSelectedCategory('shoes')} className="hover:text-amber-600 cursor-pointer">Sneakers Sidi Bou</button></li>
                <li><button onClick={() => setSelectedCategory('shoes')} className="hover:text-amber-600 cursor-pointer">Bottines Nubuck Sahara</button></li>
                <li><button onClick={() => setSelectedCategory('apparel')} className="hover:text-amber-600 cursor-pointer">Hoodies Djerba 460 GSM</button></li>
                <li><button onClick={() => setSelectedCategory('accessories')} className="hover:text-amber-600 cursor-pointer">Sacs en Cuir de Sfax</button></li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-slate-900 uppercase tracking-wider mb-3">Administration & Services</h5>
              <ul className="space-y-2">
                <li><button onClick={() => setIsAdminModalOpen(true)} className="hover:text-amber-600 font-bold text-amber-700 cursor-pointer">Big Gestionnaire Admin</button></li>
                <li><button onClick={() => setIsTrackingOpen(true)} className="hover:text-amber-600 cursor-pointer">Suivi Colis Aramex</button></li>
                <li><button onClick={() => setIsTrackingOpen(true)} className="hover:text-amber-600 cursor-pointer">Facturation Électronique</button></li>
                <li><button onClick={() => setIsAuthModalOpen(true)} className="hover:text-amber-600 cursor-pointer">Compte & Club VIP</button></li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-slate-900 uppercase tracking-wider mb-3">Contact Tunisie</h5>
              <ul className="space-y-2">
                <li>Zone Industrielle La Charguia II, Tunis</li>
                <li>Tél: +216 71 840 210</li>
                <li>Email: contact@kartago.tn</li>
                <li className="text-amber-700 font-semibold pt-1">
                  🇹🇳 Livraison assurée sur les 24 gouvernorats
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-4">
            <p>© 2026 KARTAGO S.A.R.L - Tous droits réservés. Conforme aux normes tunisiennes de facturation électronique.</p>
            <div className="flex items-center gap-4">
              <span>Aramex Express</span>
              <span>·</span>
              <span>Paiement à la livraison</span>
              <span>·</span>
              <span>ClicToPay</span>
              <span>·</span>
              <span>Flouci & D17</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onOpenCheckout={() => setIsCheckoutOpen(true)}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cartItems}
        currentUser={currentUser}
        onOrderSuccess={handleOrderSuccess}
        defaultEmail={currentUser?.email || 'mekniamir09@gmail.com'}
      />

      {/* Electronic Invoice Modal */}
      {activeInvoice && (
        <ElectronicInvoiceModal
          invoice={activeInvoice}
          isOpen={isInvoiceOpen}
          onClose={() => setIsInvoiceOpen(false)}
          defaultEmail={currentUser?.email || 'mekniamir09@gmail.com'}
        />
      )}

      {/* Order Tracking & Existing Invoices Modal */}
      <OrderTrackingModal
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
        onViewInvoice={(inv) => {
          setActiveInvoice(inv);
          setIsTrackingOpen(false);
          setIsInvoiceOpen(true);
        }}
      />

      {/* Authentication & User Account Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(usr) => {
          setCurrentUser(usr);
          showToast(`Bienvenue ${usr.displayName || usr.email} !`);
        }}
      />

      {/* Big Gestionnaire Admin Modal */}
      <AdminGestionnaireModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        currentUser={currentUser}
        onViewInvoice={(inv) => {
          setActiveInvoice(inv);
          setIsInvoiceOpen(true);
        }}
      />

      {/* Tunisian AI Stylist Chatbot */}
      <TunisianAIAssistant
        isOpen={isAIOpen}
        onToggle={() => setIsAIOpen((prev) => !prev)}
        currentProduct={activeProduct}
        selectedColor={selectedColor.name}
        selectedSize={selectedSize}
        onSelectProduct={handleSelectProduct}
      />
    </div>
  );
}
