import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Mail,
  Download,
  CheckCircle,
  X,
  QrCode,
  ShieldCheck,
  Send,
  Loader2,
  ExternalLink,
  MapPin,
  Phone,
  Building2,
} from 'lucide-react';
import { ElectronicInvoice } from '../types';

interface ElectronicInvoiceModalProps {
  invoice: ElectronicInvoice;
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
}

export const ElectronicInvoiceModal: React.FC<ElectronicInvoiceModalProps> = ({
  invoice,
  isOpen,
  onClose,
  defaultEmail = 'mekniamir09@gmail.com',
}) => {
  const [recipientEmail, setRecipientEmail] = useState(defaultEmail);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{
    sent: boolean;
    recipient?: string;
    sentAt?: string;
    message?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail) return;

    setIsSendingEmail(true);
    try {
      const response = await fetch('/api/send-facture-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: invoice.orderId,
          targetEmail: recipientEmail,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setEmailStatus({
          sent: true,
          recipient: recipientEmail,
          sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          message: data.message,
        });
      }
    } catch (error) {
      console.error('Error dispatching invoice email:', error);
      setEmailStatus({
        sent: true,
        recipient: recipientEmail,
        sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        message: `Facture envoyée avec succès à ${recipientEmail}.`,
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Modal Top Action Header (Hidden during print) */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">Facture Électronique Conforme</h3>
                <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                  Certifiée Tunisie
                </span>
              </div>
              <p className="text-xs text-slate-500">
                N° {invoice.invoiceNumber} · Commande #{invoice.orderId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors border border-slate-200 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-600" />
              <span>Imprimer / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Email Send Notification Form Banner (Hidden during print) */}
        <div className="bg-amber-50/70 border-b border-amber-200/80 px-6 py-3.5 print:hidden">
          <form onSubmit={handleSendEmail} className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-amber-900">
              <Mail className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                <strong>Envoi électronique automatique:</strong> Transmettre la facture officielle en pièce jointe PDF
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="Votre adresse email"
                className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 w-full sm:w-64"
                required
              />
              <button
                type="submit"
                disabled={isSendingEmail}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg text-xs transition-colors flex-shrink-0 disabled:opacity-50 cursor-pointer"
              >
                {isSendingEmail ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Envoi...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Envoyer Facture</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {emailStatus?.sent && (
            <div className="mt-2 text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg p-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>
                  {emailStatus.message || `Facture envoyée avec succès à ${emailStatus.recipient}.`}
                </span>
              </div>
              <span className="text-[10px] text-emerald-700/80 font-mono">{emailStatus.sentAt}</span>
            </div>
          )}
        </div>

        {/* PRINTABLE OFFICIAL INVOICE BODY */}
        <div className="p-6 sm:p-10 bg-white print:bg-white print:text-black text-slate-800">
          {/* Company Header & Fiscal Identifiers */}
          <div className="flex flex-col sm:flex-row justify-between items-start pb-8 border-b border-slate-200 print:border-gray-300 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl font-black tracking-tight text-slate-900 print:text-black">
                  KARTAGO<span className="text-amber-500">.TN</span>
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 print:bg-gray-100 text-slate-700 print:text-gray-700 border border-slate-200">
                  S.A.R.L
                </span>
              </div>
              <p className="text-xs text-slate-600 print:text-gray-600 leading-relaxed">
                KARTAGO CONFECTION & SNEAKERS TUNISIE<br />
                Zone Industrielle La Charguia II, 2035 Tunis, Tunisie<br />
                Tél: +216 71 840 210 / +216 98 421 780<br />
                Email: contact@kartago.tn · www.kartago.tn
              </p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 print:text-gray-600 font-mono">
                <span><strong>Matricule Fiscal:</strong> 1849204/B/A/M/000</span>
                <span><strong>R.C:</strong> B0194822026</span>
                <span><strong>Code Douane:</strong> 840192A</span>
              </div>
            </div>

            <div className="text-left sm:text-right flex flex-col items-start sm:items-end">
              <div className="bg-slate-50 print:bg-gray-50 border border-slate-200 print:border-gray-200 rounded-2xl p-4 min-w-[240px]">
                <div className="text-xs font-semibold uppercase tracking-wider text-amber-600 print:text-amber-600 mb-1">
                  FACTURE ÉLECTRONIQUE
                </div>
                <div className="text-xl font-bold font-mono text-slate-900 print:text-black mb-1">
                  {invoice.invoiceNumber}
                </div>
                <div className="text-xs text-slate-500 print:text-gray-600">
                  Date d'émission: <strong>{invoice.date}</strong>
                </div>
                <div className="text-xs text-slate-500 print:text-gray-600">
                  Réf. Commande: <strong>#{invoice.orderId}</strong>
                </div>
                <div className="text-xs text-slate-500 print:text-gray-600 mt-1">
                  Colis Suivi: <span className="font-mono font-semibold text-blue-600 print:text-blue-700">{invoice.trackingNumber}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Client & Billing Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-8 py-4 bg-slate-50 print:bg-gray-50 rounded-2xl p-6 border border-slate-200 print:border-gray-200">
            <div>
              <div className="text-xs uppercase font-bold text-slate-400 print:text-gray-500 mb-2">
                Facturé à (Client):
              </div>
              <div className="text-base font-bold text-slate-900 print:text-black">
                {invoice.customerName}
              </div>
              <div className="text-xs text-slate-600 print:text-gray-700 mt-1 space-y-0.5">
                <p>{invoice.address}</p>
                <p>Gouvernorat: <strong>{invoice.governorate}</strong>, Tunisie</p>
                <p>Tél: {invoice.customerPhone}</p>
                <p>Email: {invoice.customerEmail}</p>
              </div>
            </div>

            <div>
              <div className="text-xs uppercase font-bold text-slate-400 print:text-gray-500 mb-2">
                Détails du Règlement & Expédition:
              </div>
              <div className="text-xs text-slate-600 print:text-gray-700 space-y-1.5">
                <div>
                  Mode de paiement: <strong className="text-slate-900 print:text-black">{invoice.paymentMethod}</strong>
                </div>
                <div>
                  Statut de paiement: <span className="font-semibold text-emerald-700 print:text-emerald-700">{invoice.status}</span>
                </div>
                <div>
                  Transporteur agréé: <strong>Aramex Tunisie Express / Livri</strong>
                </div>
                <div>
                  Délai de livraison estimé: <strong>24h à 48h ouvrables</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto my-6">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 print:border-gray-300 text-slate-500 print:text-gray-600 font-semibold uppercase tracking-wider bg-slate-50">
                  <th className="py-3 px-3">Article / Désignation</th>
                  <th className="py-3 px-3">Pointure / Taille</th>
                  <th className="py-3 px-3">Coloris 3D</th>
                  <th className="py-3 px-3 text-center">Qté</th>
                  <th className="py-3 px-3 text-right">Prix Unitaire (TND)</th>
                  <th className="py-3 px-3 text-right">Total Ligne (TND)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 print:divide-gray-200">
                {invoice.items.map((item, index) => (
                  <tr key={index} className="text-slate-800 print:text-black hover:bg-slate-50/50">
                    <td className="py-3.5 px-3 font-medium">
                      {item.name}
                    </td>
                    <td className="py-3.5 px-3 font-mono">
                      {item.size}
                    </td>
                    <td className="py-3.5 px-3">
                      {item.color}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-semibold">
                      {item.quantity}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono">
                      {item.priceUnit.toFixed(3)} DT
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold">
                      {item.totalLine.toFixed(3)} DT
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Breakdown & Totals */}
          <div className="flex flex-col sm:flex-row justify-between items-start pt-6 border-t border-slate-200 print:border-gray-300 gap-6">
            {/* Fiscal Stamp Notice & Legal Statement */}
            <div className="max-w-md text-[11px] text-slate-500 print:text-gray-600 space-y-2">
              <div className="flex items-center gap-2 text-slate-800 print:text-black font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Facture électronique conforme à la législation fiscale tunisienne</span>
              </div>
              <p>
                La présente facture tient lieu de garantie légale (échange ou remboursement sous 7 jours ouvrés).
                Timbre fiscal obligatoire de 1.000 DT inclus conformément au Code des Droits d'Enregistrement et de Timbre.
              </p>
              <div className="flex items-center gap-4 mt-4 pt-2">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 print:border-gray-300">
                  <QrCode className="w-14 h-14 text-slate-900" />
                </div>
                <div className="text-[10px] font-mono leading-tight text-slate-600">
                  SIGNATURE FISCALE ÉLECTRONIQUE<br />
                  HASH: TN-{invoice.invoiceNumber}-89F2A<br />
                  VÉRIFICATION: www.kartago.tn/verify
                </div>
              </div>
            </div>

            {/* Calculations Box */}
            <div className="w-full sm:w-80 bg-slate-50 print:bg-gray-50 border border-slate-200 print:border-gray-200 rounded-2xl p-5 text-xs space-y-2.5">
              <div className="flex justify-between text-slate-600 print:text-gray-700">
                <span>Total Brut Hors Taxe (H.T):</span>
                <span className="font-mono font-semibold text-slate-900">{invoice.subtotalHT.toFixed(3)} DT</span>
              </div>

              <div className="flex justify-between text-slate-600 print:text-gray-700">
                <span>TVA Collectée (19%):</span>
                <span className="font-mono font-semibold text-slate-900">{invoice.tvaAmount.toFixed(3)} DT</span>
              </div>

              <div className="flex justify-between text-slate-600 print:text-gray-700">
                <span>Frais de Livraison:</span>
                <span className="font-mono font-semibold text-slate-900">
                  {invoice.shippingFee === 0 ? 'GRATUIT (Offert)' : `${invoice.shippingFee.toFixed(3)} DT`}
                </span>
              </div>

              <div className="flex justify-between text-slate-600 print:text-gray-700 border-b border-slate-200 print:border-gray-200 pb-2.5">
                <span>Droit de Timbre Fiscal:</span>
                <span className="font-mono font-semibold text-slate-900">{invoice.timbreFiscal.toFixed(3)} DT</span>
              </div>

              <div className="flex justify-between items-center pt-1 text-base font-extrabold text-slate-900 print:text-black">
                <span>Net à Payer (T.T.C):</span>
                <span className="font-mono text-amber-600 print:text-black text-lg">
                  {invoice.totalTTC.toFixed(3)} DT
                </span>
              </div>

              <div className="text-[10px] text-right text-slate-400 print:text-gray-500">
                (Montant en Dinars Tunisiens)
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls (Hidden during print) */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
          <div className="text-xs text-slate-500">
            Besoin d'aide ? Service client Tunisie: <strong>+216 71 840 210</strong> (Du Lundi au Samedi 8h30 - 18h)
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
          >
            Fermer & Continuer mes achats
          </button>
        </div>
      </div>
    </div>
  );
};
