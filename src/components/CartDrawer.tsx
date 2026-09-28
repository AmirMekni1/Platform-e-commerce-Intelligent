import React from 'react';
import { ShoppingBag, X, Trash2, Plus, Minus, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { CartItem } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onOpenCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onOpenCheckout,
}) => {
  if (!isOpen) return null;

  const rawSubtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const freeShippingThreshold = 150;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - rawSubtotal);
  const progressPercent = Math.min(100, (rawSubtotal / freeShippingThreshold) * 100);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/50 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">Mon Panier</h2>
              <p className="text-xs text-slate-500">
                {cartItems.reduce((a, b) => a + b.quantity, 0)} article(s)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free shipping progress bar */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 text-xs">
          <div className="flex items-center justify-between mb-1.5 font-medium">
            {remainingForFreeShipping > 0 ? (
              <span className="text-slate-600">
                Plus que <strong className="text-amber-700">{remainingForFreeShipping.toFixed(1)} DT</strong> pour la livraison gratuite !
              </span>
            ) : (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Félicitations ! Livraison gratuite offerte
              </span>
            )}
            <span className="text-slate-500 font-mono">{progressPercent.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-amber-400 h-full transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <p className="font-bold text-slate-800">Votre panier est vide</p>
              <p className="text-xs text-slate-500 max-w-xs">
                Explorez nos modèles de chaussures en 3D, choisissez votre couleur et votre pointure pour commencer !
              </p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.id}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex gap-4 items-center"
              >
                {/* Visual Color Pill & Badge */}
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 border border-slate-300 shadow-xs relative"
                  style={{ backgroundColor: item.color.hex }}
                >
                  <span className="text-[10px] font-bold text-white uppercase bg-black/50 px-1.5 py-0.5 rounded">
                    3D
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 truncate">{item.name}</h4>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                    <span>Pointure: <strong className="text-slate-800">{item.size}</strong></span>
                    <span>·</span>
                    <span className="truncate">{item.color.name}</span>
                  </div>
                  <div className="text-sm font-black text-amber-700 mt-1 font-mono">
                    {(item.price * item.quantity).toFixed(3)} DT
                  </div>
                </div>

                {/* Quantity Controls & Delete */}
                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                    title="Supprimer l'article"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-xs">
                    <button
                      onClick={() => onUpdateQuantity(item.id, -1)}
                      className="p-1 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-2 text-xs font-mono font-bold text-slate-800">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(item.id, 1)}
                      className="p-1 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with totals and checkout trigger */}
        {cartItems.length > 0 && (
          <div className="p-5 bg-slate-50 border-t border-slate-200 space-y-3">
            <div className="space-y-1.5 text-xs text-slate-500">
              <div className="flex justify-between">
                <span>Sous-total:</span>
                <span className="font-mono text-slate-800 font-semibold">{rawSubtotal.toFixed(3)} DT</span>
              </div>
              <div className="flex justify-between">
                <span>Livraison estimée (Tunisie):</span>
                <span className="font-mono text-slate-800">
                  {rawSubtotal >= 150 ? <span className="text-emerald-700 font-bold">Gratuite</span> : '7.000 DT'}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="font-bold text-slate-900 text-sm">Total Estimé TTC:</span>
              <span className="font-black text-amber-700 font-mono text-lg">
                {(rawSubtotal + (rawSubtotal >= 150 ? 0 : 7) + 1).toFixed(3)} DT
              </span>
            </div>

            <button
              onClick={() => {
                onClose();
                onOpenCheckout();
              }}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <span>Passer la commande & Facture</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-[10px] text-center text-slate-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Paiement à la livraison · Échange sous 7 jours</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
