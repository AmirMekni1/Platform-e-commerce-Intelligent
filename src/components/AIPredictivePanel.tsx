import React, { useState, useEffect } from 'react';
import {
  Brain,
  Sparkles,
  Zap,
  TrendingUp,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  Layers,
  HelpCircle,
  Sliders,
  Send,
  Loader2,
  RefreshCw,
  Gift,
} from 'lucide-react';
import { Product, ColorOption, CartItem, AppUser, AIPredictionResult } from '../types';

interface AIPredictivePanelProps {
  product: Product;
  selectedColor: ColorOption;
  selectedSize: string;
  cartItems: CartItem[];
  userProfile?: AppUser | null;
  onApplySize: (size: string) => void;
  onAddBundleItem: (bundle: any) => void;
  onFastCheckout: () => void;
}

export const AIPredictivePanel: React.FC<AIPredictivePanelProps> = ({
  product,
  selectedColor,
  selectedSize,
  cartItems,
  userProfile,
  onApplySize,
  onAddBundleItem,
  onFastCheckout,
}) => {
  const [nlpQuery, setNlpQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<AIPredictionResult | null>(null);
  const [appliedOptionId, setAppliedOptionId] = useState<string | null>(null);

  // Trigger prediction on product change or explicit query
  useEffect(() => {
    runPrediction();
  }, [product.id, selectedColor.name]);

  const runPrediction = async (customQuery?: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/predict-and-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentProduct: {
            name: product.name,
            price: product.price,
            category: product.category,
            selectedColor: selectedColor.name,
            selectedSize,
          },
          browsingHistory: [
            { productId: product.id, viewedColor: selectedColor.name, timestamp: Date.now() },
          ],
          cartItems,
          userQuery: customQuery || nlpQuery || 'Analyse style et recommandation pointure pour usage quotidien',
          userProfile: userProfile ? {
            governorate: userProfile.governorate,
            totalSpent: userProfile.totalSpent,
            subscriptionTier: userProfile.subscriptionTier,
          } : null,
          interactionMetrics: {
            timeSpentSeconds: 35,
            rotationCount: 8,
          },
        }),
      });

      const data = await response.json();
      if (data.predictions) {
        setPrediction(data.predictions);
      }
    } catch (error) {
      console.error('Error running AI prediction:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSmartOptionClick = (option: AIPredictionResult['smartOptions'][0]) => {
    setAppliedOptionId(option.id);
    if (option.actionType === 'apply_size' && prediction?.fitPrediction?.recommendedSize) {
      onApplySize(prediction.fitPrediction.recommendedSize);
    } else if (option.actionType === 'add_bundle' && prediction?.recommendedBundle) {
      onAddBundleItem(prediction.recommendedBundle);
    } else if (option.actionType === 'fast_checkout') {
      onFastCheckout();
    }
    setTimeout(() => setAppliedOptionId(null), 3000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs relative overflow-hidden">
      {/* Decorative gradient glow */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shadow-xs">
            <Brain className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-base tracking-tight">
                Moteur Prédictif & Analyse NLP (Machine Learning)
              </h3>
              <span className="text-[10px] bg-amber-50 text-amber-800 font-mono font-bold px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>Gemini 3.5 AI</span>
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Analyse comportementale en direct de votre navigation 3D & prédictions d'ajustement
            </p>
          </div>
        </div>

        <button
          onClick={() => runPrediction()}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-600' : ''}`} />
          <span>Réanalyser</span>
        </button>
      </div>

      {/* NLP Freeform Query Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          runPrediction(nlpQuery);
        }}
        className="relative"
      >
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={nlpQuery}
            onChange={(e) => setNlpQuery(e.target.value)}
            placeholder="Décrivez votre style ou besoin (ex: Baskets ultra-confort pour marcher à Tunis et le bureau)"
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Analyse NLP</span>
          </button>
        </div>

        {/* NLP suggestion chips */}
        <div className="flex items-center gap-1.5 mt-2 overflow-x-auto text-[11px] text-slate-500">
          <span className="font-semibold text-slate-600 flex-shrink-0">Suggestions:</span>
          <button
            type="button"
            onClick={() => {
              const q = 'Baskets rétro habillées pour le soir à Sidi Bou Saïd';
              setNlpQuery(q);
              runPrediction(q);
            }}
            className="bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 transition-colors whitespace-nowrap cursor-pointer"
          >
            Sidi Bou Soirée
          </button>
          <button
            type="button"
            onClick={() => {
              const q = 'Je marche plus de 10 000 pas par jour, amorti maximal';
              setNlpQuery(q);
              runPrediction(q);
            }}
            className="bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 transition-colors whitespace-nowrap cursor-pointer"
          >
            Marche Intensive (+10k pas)
          </button>
          <button
            type="button"
            onClick={() => {
              const q = 'Look streetwear oversize automne avec hoodie';
              setNlpQuery(q);
              runPrediction(q);
            }}
            className="bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 transition-colors whitespace-nowrap cursor-pointer"
          >
            Streetwear Outfit
          </button>
        </div>
      </form>

      {/* Main Prediction Results Grid */}
      {prediction && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Fit & Size Prediction ML */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-500 font-semibold uppercase tracking-wider">
                  Prédiction Pointure ML
                </span>
                <span className="text-emerald-700 font-mono font-bold">
                  {prediction.fitPrediction.fitCertaintyPercent}% certitude
                </span>
              </div>

              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-amber-600 font-mono">
                  Pointure {prediction.fitPrediction.recommendedSize}
                </span>
                <span className="text-xs text-slate-400">
                  (actuellement: {selectedSize})
                </span>
              </div>

              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {prediction.fitPrediction.advice}
              </p>
            </div>

            {selectedSize !== prediction.fitPrediction.recommendedSize && (
              <button
                onClick={() => onApplySize(prediction.fitPrediction.recommendedSize)}
                className="w-full bg-white hover:bg-amber-500 hover:text-slate-950 text-slate-800 border border-slate-300 font-bold py-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>Ajuster à la pointure {prediction.fitPrediction.recommendedSize}</span>
                <CheckCircle className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Card 2: Style Persona & Propensity */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-500 font-semibold uppercase tracking-wider">
                  Profil Stylistique Détecté
                </span>
                <span className="text-amber-700 font-mono font-bold">
                  {prediction.styleConfidencePercent}% match
                </span>
              </div>

              <div className="text-lg font-black text-slate-900 mt-2">
                {prediction.stylePersona}
              </div>

              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {prediction.reasoning}
              </p>
            </div>

            <div className="bg-white border border-slate-200 p-2.5 rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-500">Score d'intention d'achat:</span>
              <span className="text-emerald-700 font-mono font-bold">
                {prediction.purchasePropensityScore} / 100
              </span>
            </div>
          </div>

          {/* Card 3: AI Bundle & Cross-Sell Opportunity */}
          <div className="bg-slate-50 border border-amber-200 rounded-2xl p-5 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-amber-700 font-semibold uppercase tracking-wider flex items-center gap-1">
                  <Gift className="w-3.5 h-3.5 text-amber-600" />
                  <span>Duo Complémentaire IA</span>
                </span>
                <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-1.5 py-0.2 rounded">
                  -{prediction.recommendedBundle.bundleDiscountPercent}% Pack
                </span>
              </div>

              <div className="text-sm font-bold text-slate-900 mt-2">
                {prediction.recommendedBundle.name}
              </div>

              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {prediction.recommendedBundle.benefit}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-amber-700">
                +{prediction.recommendedBundle.complementaryPrice} DT
              </span>
              <button
                onClick={() => onAddBundleItem(prediction.recommendedBundle)}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <span>Ajouter au Panier</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Smart Action Options Row */}
      {prediction?.smartOptions && (
        <div className="space-y-2 pt-2 border-t border-slate-200">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Recommandations Stratégiques Personnalisées (3 Options d'Aide à la Décision):
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {prediction.smartOptions.map((opt) => {
              const isApplied = appliedOptionId === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => handleSmartOptionClick(opt)}
                  className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isApplied
                      ? 'border-emerald-500 bg-emerald-50 text-slate-900'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="text-amber-700">{opt.title}</span>
                    {isApplied ? (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">{opt.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
