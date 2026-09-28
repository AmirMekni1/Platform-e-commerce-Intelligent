import React, { useEffect, useState } from 'react';
import {
  Package,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  FileText,
  X,
  Phone,
  Mail,
  ExternalLink,
  MapPin,
} from 'lucide-react';
import { ElectronicInvoice } from '../types';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewInvoice: (invoice: ElectronicInvoice) => void;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  isOpen,
  onClose,
  onViewInvoice,
}) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchOrders();
    }
  }, [isOpen]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase();
    return (
      o.id?.toLowerCase().includes(q) ||
      o.invoiceNumber?.toLowerCase().includes(q) ||
      o.customerName?.toLowerCase().includes(q) ||
      o.trackingNumber?.toLowerCase().includes(q) ||
      o.customerPhone?.includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Suivi des Commandes & Factures</h2>
              <p className="text-xs text-slate-500">
                Suivez votre colis Aramex en temps réel et téléchargez vos factures électroniques
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

        {/* Search bar */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-200">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par N° commande, N° facture, N° suivi ou nom..."
              className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-xs"
            />
          </div>
        </div>

        {/* Content list */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4 bg-white">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500">
              Chargement des commandes en cours...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Package className="w-8 h-8 mx-auto text-slate-400" />
              <p className="font-semibold text-slate-700">Aucune commande trouvée</p>
              <p className="text-xs text-slate-500">
                Passez votre première commande pour générer une facture électronique instantanée !
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{order.invoiceNumber}</span>
                      <span className="text-[11px] bg-amber-50 text-amber-800 font-mono px-2 py-0.5 rounded border border-amber-200 font-semibold">
                        {order.id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Client: <strong className="text-slate-800">{order.customerName}</strong> · {order.date}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-amber-600 font-mono">
                      {order.totalTTC?.toFixed(3)} DT
                    </span>
                    <button
                      onClick={() =>
                        onViewInvoice({
                          invoiceNumber: order.invoiceNumber,
                          orderId: order.id,
                          date: order.date,
                          customerName: order.customerName,
                          customerEmail: order.customerEmail,
                          customerPhone: order.customerPhone,
                          address: order.address,
                          governorate: order.governorate,
                          items: order.items.map((i: any) => ({
                            name: i.name,
                            size: i.size,
                            color: i.color,
                            quantity: i.quantity,
                            priceUnit: i.price,
                            totalLine: i.price * i.quantity,
                          })),
                          subtotalHT: order.subtotalHT,
                          tvaRate: 19,
                          tvaAmount: order.tvaAmount,
                          timbreFiscal: order.timbreFiscal,
                          shippingFee: order.shippingFee,
                          totalTTC: order.totalTTC,
                          paymentMethod: order.paymentMethod,
                          matriculeFiscalCompany: '1849204/B/A/M/000',
                          rcCompany: 'B0194822026',
                          status: 'Contre remboursement',
                          trackingNumber: order.trackingNumber,
                        })
                      }
                      className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-600" />
                      <span>Voir Facture</span>
                    </button>
                  </div>
                </div>

                {/* Progress Steps */}
                <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                  <div className="flex flex-col items-center gap-1 text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-semibold">Confirmée</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-semibold">Facturée</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 text-amber-600">
                    <Clock className="w-4 h-4 animate-pulse" />
                    <span className="font-semibold">Aramex Transit</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 text-slate-400">
                    <Truck className="w-4 h-4" />
                    <span>Livrée</span>
                  </div>
                </div>

                {/* Tracking info footer */}
                <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-600 gap-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>Destination: <strong className="text-slate-800">{order.governorate}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>N° Suivi Aramex:</span>
                    <span className="font-mono font-semibold text-slate-900">{order.trackingNumber}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
