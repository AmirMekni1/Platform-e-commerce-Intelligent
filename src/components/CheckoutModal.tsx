import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  CreditCard,
  Truck,
  ShieldCheck,
  CheckCircle,
  FileText,
  X,
  Lock,
  Loader2,
  Wallet,
  Phone,
  Mail,
  MapPin,
  Building,
  Crown,
  Sparkles,
} from 'lucide-react';
import { CartItem, ElectronicInvoice, AppUser } from '../types';
import { TUNISIAN_GOVERNORATES } from '../data/products';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onOrderSuccess: (invoice: ElectronicInvoice) => void;
  currentUser?: AppUser | null;
  defaultEmail?: string;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  onOrderSuccess,
  currentUser,
  defaultEmail = 'mekniamir09@gmail.com',
}) => {
  const [customerName, setCustomerName] = useState(currentUser?.displayName || '');
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || defaultEmail);
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '');
  const [address, setAddress] = useState('');
  const [governorate, setGovernorate] = useState(currentUser?.governorate || 'Tunis');
  const [postalCode, setPostalCode] = useState('1001');
  const [paymentMethod, setPaymentMethod] = useState<'Paiement à la livraison' | 'Carte Bancaire' | 'Flouci / D17'>('Paiement à la livraison');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.displayName) setCustomerName(currentUser.displayName);
      if (currentUser.email) setCustomerEmail(currentUser.email);
      if (currentUser.phone) setCustomerPhone(currentUser.phone);
      if (currentUser.governorate) setGovernorate(currentUser.governorate);
    }
  }, [currentUser]);

  if (!isOpen) return null;

  const isVip = currentUser?.subscriptionTier === 'vip_club' || currentUser?.subscriptionTier === 'premium';
  const rawSubtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const vipDiscountAmount = isVip ? Number((rawSubtotal * 0.15).toFixed(3)) : 0;
  const discountedSubtotal = rawSubtotal - vipDiscountAmount;

  // Free shipping over 150 DT OR if user is VIP
  const shippingFee = discountedSubtotal >= 150 || isVip ? 0 : 7.0;
  const timbreFiscal = 1.0;
  const subtotalHT = Number((discountedSubtotal / 1.19).toFixed(3));
  const tvaAmount = Number((discountedSubtotal - subtotalHT).toFixed(3));
  const totalTTC = Number((discountedSubtotal + shippingFee + timbreFiscal).toFixed(3));

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerEmail || !customerPhone || !address) {
      alert('Veuillez renseigner tous les champs obligatoires');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderPayload = {
        customerId: currentUser?.uid || 'guest',
        customerName,
        customerEmail,
        customerPhone,
        address: `${address}, ${postalCode}`,
        governorate,
        paymentMethod,
        items: cartItems.map((item) => ({
          id: item.productId,
          name: item.name,
          size: item.size,
          color: item.color.name,
          price: isVip ? Number((item.price * 0.85).toFixed(3)) : item.price,
          quantity: item.quantity,
        })),
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      const data = await response.json();
      const orderData = data.order;

      // Celebrate with confetti
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#dc2626', '#3b82f6', '#10b981'],
      });

      // Construct electronic invoice object
      const invoiceData: ElectronicInvoice = {
        invoiceNumber: orderData.invoiceNumber,
        orderId: orderData.id,
        date: orderData.date,
        customerName,
        customerEmail,
        customerPhone,
        address: `${address}, ${postalCode}`,
        governorate,
        items: cartItems.map((item) => ({
          name: item.name,
          size: item.size,
          color: item.color.name,
          quantity: item.quantity,
          priceUnit: isVip ? Number((item.price * 0.85).toFixed(3)) : item.price,
          totalLine: (isVip ? Number((item.price * 0.85).toFixed(3)) : item.price) * item.quantity,
        })),
        subtotalHT,
        tvaRate: 19,
        tvaAmount,
        timbreFiscal,
        shippingFee,
        totalTTC,
        paymentMethod,
        matriculeFiscalCompany: '1849204/B/A/M/000',
        rcCompany: 'B0194822026',
        status: paymentMethod === 'Paiement à la livraison' ? 'Contre remboursement' : 'Payée',
        trackingNumber: orderData.trackingNumber,
      };

      // Also trigger automatic email send
      fetch('/api/send-facture-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderData.id,
          targetEmail: customerEmail,
        }),
      }).catch((err) => console.log('Auto email trigger:', err));

      onOrderSuccess(invoiceData);
    } catch (error) {
      console.error('Order error:', error);
      alert('Une erreur est survenue lors de la commande.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Finaliser ma Commande</h2>
                {isVip && (
                  <span className="bg-amber-100 text-amber-900 font-bold text-[10px] px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-600" />
                    <span>Avantage Club VIP (-15%)</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">Livraison express partout en Tunisie & Facture certifiée</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmitOrder} className="p-6 overflow-y-auto space-y-6 max-h-[78vh]">
          {/* Cart Summary Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
              <span>Articles sélectionnés ({cartItems.reduce((acc, i) => acc + i.quantity, 0)})</span>
              <span className="text-amber-700 font-bold">{discountedSubtotal.toFixed(3)} DT</span>
            </div>
            <div className="divide-y divide-slate-200 max-h-36 overflow-y-auto">
              {cartItems.map((item) => (
                <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color.hex }}
                    />
                    <span className="text-slate-800 truncate">{item.name}</span>
                    <span className="text-slate-400 font-mono">(Taille {item.size})</span>
                  </div>
                  <span className="text-slate-600 font-mono flex-shrink-0">
                    {item.quantity} × {isVip ? (item.price * 0.85).toFixed(1) : item.price} DT
                  </span>
                </div>
              ))}
            </div>

            {isVip && (
              <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-emerald-700">
                <span className="flex items-center gap-1 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Remise Membre VIP (15%):</span>
                </span>
                <span className="font-mono font-bold">-{vipDiscountAmount.toFixed(3)} DT</span>
              </div>
            )}
          </div>

          {/* Customer Personal Details */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-3 flex items-center gap-2">
              <Building className="w-4 h-4 text-amber-600" />
              <span>1. Informations de Livraison en Tunisie</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Nom complet *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ex: Amir Mekni"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Email (pour la facture) *</label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="nom@exemple.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Numéro de Téléphone *</label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+216 -- --- ---"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Gouvernorat (Wilaya) *</label>
                <select
                  value={governorate}
                  onChange={(e) => setGovernorate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {TUNISIAN_GOVERNORATES.map((gov) => (
                    <option key={gov} value={gov}>
                      {gov}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 mb-1 font-semibold">Adresse exacte (Rue, N°, Bâtiment) *</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ex: 24 Avenue Habib Bourguiba, Appt 4B"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-600" />
              <span>2. Mode de Paiement & Facturation</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <label
                className={`relative flex flex-col p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'Paiement à la livraison'
                    ? 'border-amber-500 bg-amber-50 text-slate-900 shadow-xs'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'Paiement à la livraison'}
                  onChange={() => setPaymentMethod('Paiement à la livraison')}
                  className="sr-only"
                />
                <div className="flex items-center gap-2 font-bold mb-1">
                  <Truck className="w-4 h-4 text-amber-600" />
                  <span>Paiement à la livraison</span>
                </div>
                <span className="text-[11px] text-slate-500">
                  Payez en espèces au livreur Aramex à la réception
                </span>
                <span className="mt-2 text-[10px] text-emerald-700 font-bold">
                  Le plus populaire en Tunisie
                </span>
              </label>

              <label
                className={`relative flex flex-col p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'Carte Bancaire'
                    ? 'border-amber-500 bg-amber-50 text-slate-900 shadow-xs'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'Carte Bancaire'}
                  onChange={() => setPaymentMethod('Carte Bancaire')}
                  className="sr-only"
                />
                <div className="flex items-center gap-2 font-bold mb-1">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span>Carte Bancaire</span>
                </div>
                <span className="text-[11px] text-slate-500">
                  ClicToPay / GIM-TEL / Visa / Mastercard
                </span>
                <span className="mt-2 text-[10px] text-blue-700 font-bold">
                  3D Secure 256-bit
                </span>
              </label>

              <label
                className={`relative flex flex-col p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'Flouci / D17'
                    ? 'border-amber-500 bg-amber-50 text-slate-900 shadow-xs'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'Flouci / D17'}
                  onChange={() => setPaymentMethod('Flouci / D17')}
                  className="sr-only"
                />
                <div className="flex items-center gap-2 font-bold mb-1">
                  <Wallet className="w-4 h-4 text-emerald-600" />
                  <span>Flouci & D17</span>
                </div>
                <span className="text-[11px] text-slate-500">
                  Portefeuille mobile ou La Poste Tunisienne
                </span>
                <span className="mt-2 text-[10px] text-emerald-700 font-bold">
                  Paiement instantané
                </span>
              </label>
            </div>
          </div>

          {/* Pricing & Electronic Invoicing Details */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Sous-total Hors Taxes (HT):</span>
              <span className="font-mono text-slate-800 font-semibold">{subtotalHT.toFixed(3)} DT</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>TVA (19%):</span>
              <span className="font-mono text-slate-800">{tvaAmount.toFixed(3)} DT</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Frais de livraison (Aramex Express):</span>
              <span className="font-mono text-slate-800">
                {shippingFee === 0 ? (
                  <span className="text-emerald-700 font-bold">
                    OFFERT {isVip ? '(Avantage VIP)' : '(Panier ≥ 150 DT)'}
                  </span>
                ) : (
                  `${shippingFee.toFixed(3)} DT`
                )}
              </span>
            </div>
            <div className="flex justify-between text-slate-600 border-b border-slate-200 pb-2">
              <span>Timbre Fiscal légal obligatoire:</span>
              <span className="font-mono text-slate-800">{timbreFiscal.toFixed(3)} DT</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold text-slate-900 pt-1">
              <span>Net à Payer TTC:</span>
              <span className="text-amber-700 font-mono text-lg">{totalTTC.toFixed(3)} DT</span>
            </div>
          </div>

          {/* Submission button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold py-3.5 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Génération de la commande et de la facture...</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                <span>Confirmer la commande & Générer la Facture</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
