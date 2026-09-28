import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Users,
  FileText,
  DollarSign,
  Package,
  Crown,
  Search,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  CheckCircle,
  Plus,
  RefreshCw,
  X,
  Mail,
  Printer,
  ChevronRight,
  Percent,
} from 'lucide-react';
import { AdminProductMetric, AppUser, ElectronicInvoice } from '../types';

interface AdminGestionnaireModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: AppUser | null;
  onViewInvoice?: (invoice: ElectronicInvoice) => void;
}

export const AdminGestionnaireModal: React.FC<AdminGestionnaireModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onViewInvoice,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'most_pay' | 'not_good' | 'users' | 'orders'>('overview');
  const [metricsData, setMetricsData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // New subscriber form state
  const [newSubEmail, setNewSubEmail] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [newSubGov, setNewSubGov] = useState('Tunis');
  const [newSubTier, setNewSubTier] = useState<'vip_club' | 'premium'>('vip_club');

  useEffect(() => {
    if (isOpen) {
      loadMetrics();
    }
  }, [isOpen]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/metrics');
      const data = await res.json();
      setMetricsData(data);
    } catch (err) {
      console.error('Error fetching admin metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSubscription = async (userId: string, currentTier: string) => {
    const nextTier = currentTier === 'vip_club' || currentTier === 'premium' ? 'free' : 'vip_club';
    try {
      const res = await fetch('/api/admin/users/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, subscriptionTier: nextTier }),
      });
      const data = await res.json();
      if (data.success) {
        setActionFeedback(`Statut d'abonnement mis à jour pour ${userId} : ${nextTier === 'vip_club' ? 'Club VIP Activé' : 'Standard'}`);
        loadMetrics();
      }
    } catch (err) {
      console.error('Error toggling subscription:', err);
    }
  };

  const handleAddNewSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubEmail) return;
    try {
      const res = await fetch('/api/admin/users/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: newSubEmail,
          name: newSubName || newSubEmail.split('@')[0],
          subscriptionTier: newSubTier,
          governorate: newSubGov,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionFeedback(`Nouvel abonné VIP ajouté : ${newSubEmail}`);
        setNewSubEmail('');
        setNewSubName('');
        loadMetrics();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyRemedy = async (productId: string, remedyType: string) => {
    try {
      let adjustment: any = {};
      if (remedyType === 'discount') {
        adjustment = { newPrice: 199, statusChange: 'average' };
      } else if (remedyType === 'stock') {
        adjustment = { stockAdjustment: 50 };
      }

      const res = await fetch('/api/admin/products/remedy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, ...adjustment }),
      });
      const data = await res.json();
      if (data.success) {
        setActionFeedback(`Action corrective appliquée avec succès au produit ${productId} !`);
        loadMetrics();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  const summary = metricsData?.summary || {
    totalRevenueDT: 236021,
    totalUnitsSold: 945,
    totalOrders: 423,
    averageOrderValueDT: 250,
    conversionRatePercent: 5.4,
    totalUsers: 1845,
    totalSubscribersVIP: 315,
  };

  const mostPayProducts: AdminProductMetric[] = metricsData?.mostPayProducts || [];
  const notGoodProducts: AdminProductMetric[] = metricsData?.notGoodProducts || [];
  const allUsers: any[] = metricsData?.users || [];
  const allOrders: any[] = metricsData?.recentOrders || [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-6xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center text-slate-950 font-black shadow-md">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900">
                  BIG GESTIONNAIRE KARTAGO · Console Administrateur
                </h2>
                <span className="text-[10px] bg-red-100 text-red-700 font-mono font-bold px-2 py-0.5 rounded-full border border-red-200">
                  SESSION ADMIN ACTIF
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Gestion des abonnés VIP, rentabilité par produit, analyse des anomalies et facturation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadMetrics}
              disabled={loading}
              className="p-2.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Rafraîchir les données"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {actionFeedback && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 flex items-center justify-between text-xs text-emerald-800">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{actionFeedback}</span>
            </div>
            <button
              onClick={() => setActionFeedback(null)}
              className="text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-slate-50/80 border-b border-slate-200 px-6 py-2 flex items-center gap-2 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 rounded-xl transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Vue d'Ensemble</span>
          </button>

          <button
            onClick={() => setActiveTab('most_pay')}
            className={`px-3.5 py-2 rounded-xl transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'most_pay'
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Produits Rentables (Most Pay)</span>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {mostPayProducts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('not_good')}
            className={`px-3.5 py-2 rounded-xl transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'not_good'
                ? 'bg-red-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Produits Sous-performants (Not Good)</span>
            <span className="bg-red-100 text-red-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {notGoodProducts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-2 rounded-xl transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Abonnés & Utilisateurs CRM</span>
            <span className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {allUsers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3.5 py-2 rounded-xl transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-purple-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Factures & Commandes</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-white">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Top Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1 shadow-xs">
                  <span className="text-xs text-slate-500 font-medium">Chiffre d'Affaires Global</span>
                  <div className="text-2xl font-black text-amber-600 font-mono">
                    {summary.totalRevenueDT.toLocaleString()} DT
                  </div>
                  <div className="text-[11px] text-emerald-600 flex items-center gap-1 font-semibold">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>+18.4% ce mois (Tunisie)</span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1 shadow-xs">
                  <span className="text-xs text-slate-500 font-medium">Unités Vendues</span>
                  <div className="text-2xl font-black text-slate-900 font-mono">
                    {summary.totalUnitsSold}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Moyenne: {summary.averageOrderValueDT} DT / commande
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1 shadow-xs">
                  <span className="text-xs text-slate-500 font-medium">Membres Abonnés Club VIP</span>
                  <div className="text-2xl font-black text-blue-600 font-mono">
                    {summary.totalSubscribersVIP}
                  </div>
                  <div className="text-[11px] text-emerald-600 flex items-center gap-1 font-semibold">
                    <Crown className="w-3.5 h-3.5" />
                    <span>Fidélité & Réachat élevé</span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1 shadow-xs">
                  <span className="text-xs text-slate-500 font-medium">Taux de Conversion 3D</span>
                  <div className="text-2xl font-black text-emerald-600 font-mono">
                    {summary.conversionRatePercent}%
                  </div>
                  <div className="text-[11px] text-slate-500">
                    2.8x supérieur aux boutiques standard
                  </div>
                </div>
              </div>

              {/* Quick Split: Most Pay vs Not Good */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 border border-emerald-200 rounded-2xl p-5 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      <span>Ce qui rapporte le plus (Bestsellers)</span>
                    </h3>
                    <button
                      onClick={() => setActiveTab('most_pay')}
                      className="text-xs text-emerald-700 font-bold hover:underline cursor-pointer"
                    >
                      Détails complets →
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {mostPayProducts.slice(0, 3).map((p) => (
                      <div
                        key={p.id}
                        className="bg-white border border-slate-200 p-3 rounded-xl flex items-center justify-between text-xs shadow-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{p.name}</p>
                          <span className="text-slate-500">{p.unitsSold} vendus · {p.rating} ★</span>
                        </div>
                        <span className="font-bold text-emerald-600 font-mono">
                          {p.totalRevenue.toLocaleString()} DT
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50 border border-red-200 rounded-2xl p-5 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span>Produits à corriger (Not Good / Faible rotation)</span>
                    </h3>
                    <button
                      onClick={() => setActiveTab('not_good')}
                      className="text-xs text-red-700 font-bold hover:underline cursor-pointer"
                    >
                      Diagnostiquer →
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {notGoodProducts.map((p) => (
                      <div
                        key={p.id}
                        className="bg-white border border-slate-200 p-3 rounded-xl flex items-center justify-between text-xs shadow-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{p.name}</p>
                          <span className="text-red-600 font-medium">
                            Retours: {p.returnRatePercent}% · Stock: {p.stockLevel} unités
                          </span>
                        </div>
                        <button
                          onClick={() => setActiveTab('not_good')}
                          className="bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 px-2 py-1 rounded font-bold text-[11px] cursor-pointer"
                        >
                          Corriger
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MOST PAY PRODUCTS */}
          {activeTab === 'most_pay' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Produits Bestsellers & Générateurs de Revenus ("Most Pay")
                  </h3>
                  <p className="text-xs text-slate-500">
                    Classement par chiffre d'affaires cumulé, marge et popularité sur le marché tunisien
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {mostPayProducts.map((prod, idx) => (
                  <div
                    key={prod.id}
                    className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center font-mono">
                          #{idx + 1}
                        </span>
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">{prod.name}</h4>
                          <span className="text-xs text-slate-500">
                            {prod.category} · Prix: <strong className="text-amber-600">{prod.price} DT</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <span className="text-xs text-slate-500">Chiffre d'Affaires</span>
                          <p className="text-base font-black text-emerald-600 font-mono">
                            {prod.totalRevenue.toLocaleString()} DT
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-500">Ventes</span>
                          <p className="text-base font-bold text-slate-900 font-mono">
                            {prod.unitsSold} unités
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                      <div>
                        <span className="text-slate-500">Taux de Conversion:</span>
                        <p className="font-bold text-emerald-600 font-mono">{prod.conversionRate}%</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Satisfaction:</span>
                        <p className="font-bold text-amber-600 font-mono">{prod.rating} / 5 ★</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Taux de Retour:</span>
                        <p className="font-bold text-slate-800 font-mono">{prod.returnRatePercent}% (Très bas)</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Stock restant:</span>
                        <p className="font-bold text-slate-800 font-mono">{prod.stockLevel} unités</p>
                      </div>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs space-y-1">
                      <p className="text-emerald-800 font-bold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Diagnostic IA KARTAGO:</span>
                      </p>
                      <p className="text-slate-700">{prod.aiDiagnosis}</p>
                      <p className="text-slate-500 text-[11px] pt-1">
                        <strong>Action recommandée:</strong> {prod.aiRemedyAction}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: NOT GOOD PRODUCTS (ANOMALIES & UNDERPERFORMING) */}
          {activeTab === 'not_good' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span>Produits Sous-performants ("Product Not Good")</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Détection automatique des articles à taux de retour anormal, taillage problématique ou rotation lente
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {notGoodProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="bg-slate-50 border border-red-200 rounded-2xl p-5 space-y-4 shadow-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-base">{prod.name}</h4>
                          <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded border border-red-200">
                            Alerte Performance
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Prix actuel: {prod.price} DT · Ventes: {prod.unitsSold} · Stock dormant: {prod.stockLevel}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-red-600 font-bold">Taux de retours anormal:</span>
                        <p className="text-lg font-black text-red-600 font-mono">
                          {prod.returnRatePercent}% ({prod.returnsCount} retours)
                        </p>
                      </div>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs space-y-1.5">
                      <p className="text-red-800 font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                        <span>Diagnostic IA & Cause Principale:</span>
                      </p>
                      <p className="text-slate-800">{prod.aiDiagnosis}</p>
                      <p className="text-amber-800 font-semibold text-[11px]">
                        💡 Stratégie Corrective IA: {prod.aiRemedyAction}
                      </p>
                    </div>

                    {/* Quick Correction Actions for Admin */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        onClick={() => handleApplyRemedy(prod.id, 'discount')}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <Percent className="w-3.5 h-3.5" />
                        <span>Appliquer Remise Déstockage Flash (199 DT)</span>
                      </button>

                      <button
                        onClick={() => handleApplyRemedy(prod.id, 'stock')}
                        className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Ajuster alerte pointure sur la vue 3D
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: USERS & SUBSCRIPTION MANAGEMENT (CRM) */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Add New Subscriber Form */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-amber-600" />
                  <span>Abonner Manuellement un Utilisateur au Club VIP KARTAGO</span>
                </h4>

                <form onSubmit={handleAddNewSubscriber} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <input
                      type="email"
                      required
                      value={newSubEmail}
                      onChange={(e) => setNewSubEmail(e.target.value)}
                      placeholder="Email de l'utilisateur"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={newSubName}
                      onChange={(e) => setNewSubName(e.target.value)}
                      placeholder="Nom complet"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <select
                      value={newSubTier}
                      onChange={(e: any) => setNewSubTier(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500"
                    >
                      <option value="vip_club">Club VIP (-15% + Livraison Gratuite)</option>
                      <option value="premium">Premium Prestige (Accès 3D Drops)</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Valider l'Abonnement</span>
                  </button>
                </form>
              </div>

              {/* Users List */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center justify-between">
                  <span>Liste des Utilisateurs & Abonnés ({allUsers.length})</span>
                  <span className="text-xs text-slate-500 font-normal">Gestion des rôles et des accès VIP</span>
                </h4>

                <div className="space-y-2.5">
                  {allUsers.map((user) => {
                    const isVip = user.subscriptionTier === 'vip_club' || user.subscriptionTier === 'premium';
                    return (
                      <div
                        key={user.id}
                        className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs shadow-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                              user.role === 'admin'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : isVip
                                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {user.role === 'admin' ? 'ADM' : isVip ? 'VIP' : 'USR'}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">{user.name}</span>
                              {user.role === 'admin' && (
                                <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold border border-amber-200">
                                  Administrateur
                                </span>
                              )}
                              {isVip && (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-emerald-200">
                                  <Crown className="w-3 h-3 text-emerald-600" />
                                  <span>Membre VIP (-15%)</span>
                                </span>
                              )}
                            </div>
                            <p className="text-slate-500 mt-0.5">
                              {user.email} · {user.governorate} · Tél: {user.phone}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 justify-between sm:justify-end">
                          <div className="text-right">
                            <span className="text-slate-500">Total Dépensé:</span>
                            <p className="font-bold text-amber-600 font-mono">
                              {user.totalSpent?.toFixed(3)} DT ({user.orderCount} cmd)
                            </p>
                          </div>

                          <button
                            onClick={() => handleToggleSubscription(user.id, user.subscriptionTier)}
                            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                              isVip
                                ? 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 shadow-xs'
                            }`}
                          >
                            {isVip ? 'Désabonner VIP' : 'Abonner au Club VIP'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ORDERS & INVOICES */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Gestion des Factures Électroniques & Commandes ({allOrders.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Visualisez, réimprimez et envoyez les factures certifiées avec timbre fiscal 1 DT
                </p>
              </div>

              <div className="space-y-3">
                {allOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 font-mono text-sm">{ord.invoiceNumber}</span>
                        <span className="text-[11px] bg-slate-200 text-slate-800 font-mono px-2 py-0.5 rounded">
                          {ord.id}
                        </span>
                        <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                          {ord.status}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-1">
                        Client: <strong>{ord.customerName}</strong> ({ord.customerEmail}) · {ord.governorate}
                      </p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Transporteur: Aramex Suivi <span className="font-mono text-blue-600 font-semibold">{ord.trackingNumber}</span> · Date: {ord.date}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 justify-between sm:justify-end">
                      <span className="text-base font-black text-amber-600 font-mono">
                        {ord.totalTTC?.toFixed(3)} DT
                      </span>

                      {onViewInvoice && (
                        <button
                          onClick={() =>
                            onViewInvoice({
                              invoiceNumber: ord.invoiceNumber,
                              orderId: ord.id,
                              date: ord.date,
                              customerName: ord.customerName,
                              customerEmail: ord.customerEmail,
                              customerPhone: ord.customerPhone,
                              address: ord.address,
                              governorate: ord.governorate,
                              items: ord.items.map((i: any) => ({
                                name: i.name,
                                size: i.size,
                                color: i.color,
                                quantity: i.quantity,
                                priceUnit: i.price,
                                totalLine: i.price * i.quantity,
                              })),
                              subtotalHT: ord.subtotalHT,
                              tvaRate: 19,
                              tvaAmount: ord.tvaAmount,
                              timbreFiscal: ord.timbreFiscal,
                              shippingFee: ord.shippingFee,
                              totalTTC: ord.totalTTC,
                              paymentMethod: ord.paymentMethod,
                              matriculeFiscalCompany: '1849204/B/A/M/000',
                              rcCompany: 'B0194822026',
                              status: ord.status === 'Livrée' ? 'Payée' : 'Contre remboursement',
                              trackingNumber: ord.trackingNumber,
                            })
                          }
                          className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 px-3 py-1.5 rounded-xl font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <FileText className="w-3.5 h-3.5 text-amber-600" />
                          <span>Voir Facture</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
