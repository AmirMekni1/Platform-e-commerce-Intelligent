import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Volume2,
  VolumeX,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { Product, ChatMessage } from '../types';

interface TunisianAIAssistantProps {
  currentProduct?: Product;
  selectedColor?: string;
  selectedSize?: string;
  onSelectProduct?: (product: Product) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const TunisianAIAssistant: React.FC<TunisianAIAssistantProps> = ({
  currentProduct,
  selectedColor,
  selectedSize,
  onSelectProduct,
  isOpen,
  onToggle,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      text: '3aslema w mar7ba bik fi KARTAGO 3D! 👋 Ena "Sami", ton conseiller mode & sneakers tunisien personnel. Kifech najem n3awnek lyoum? Choix de pointure, style streetwear, visualiseur 3D ou livraison f les 24 gouvernorats?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    { label: '📏 Pointure & Tailles', query: 'Est-ce que les modèles taillent grand ou petit par rapport aux pointures en Tunisie ?' },
    { label: '🎨 Conseil Couleur 3D', query: 'Quelle couleur 3D me conseilles-tu pour la Sidi Bou Runner ?' },
    { label: '🚚 Délais & Aramex', query: 'Comment se passe la livraison en Tunisie et combien de temps ça prend ?' },
    { label: '💵 Paiement & Facture', query: 'Puis-je payer à la livraison et recevoir ma facture électronique ?' },
    { label: '🔥 Style Outfit Tunis', query: 'Donne-moi une idée de tenue complète streetwear avec vos chaussures !' },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const speakText = (text: string) => {
    if (!speechEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/[#*`_]/g, ''));
    utterance.lang = 'fr-FR';
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/tunisian-ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          currentProduct: currentProduct
            ? {
                name: currentProduct.name,
                price: currentProduct.price,
                description: currentProduct.description,
                selectedColor: selectedColor || currentProduct.defaultColor.name,
                selectedSize: selectedSize || currentProduct.defaultSize,
              }
            : null,
        }),
      });

      const data = await response.json();
      const reply = data.reply || '3aslema! Ena dima m3ak fi KARTAGO 3D. A7na hna bech nfar7ouk.';

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      speakText(reply);
    } catch (error) {
      console.error('Chat error:', error);
      const fallbackMessage: ChatMessage = {
        id: `assistant-fallback-${Date.now()}`,
        role: 'assistant',
        text: '3aslema! Ya mar7ba bik fi KARTAGO 3D. 3andna a9wa collection de chaussures avec vue 3D rotative! La livraison est disponible dans toute la Tunisie (Tunis, Sousse, Sfax, Nabeul, Bizerte...) avec paiement à la livraison sécurisé.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating launcher button */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-3 bg-gradient-to-r from-red-600 via-amber-500 to-amber-600 text-slate-950 font-bold px-4 py-3 rounded-full shadow-2xl hover:scale-105 transition-transform duration-200 border border-amber-300/40"
        >
          <div className="relative">
            <span className="w-8 h-8 rounded-full bg-slate-950 flex items-center justify-center text-amber-400 font-extrabold text-sm border border-amber-400/30">
              🇹🇳
            </span>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-950 animate-pulse" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs uppercase tracking-wider text-slate-950/80 font-bold leading-tight">
              Conseiller Mode Tunisien
            </span>
            <span className="text-sm font-extrabold text-white drop-shadow">
              Sami AI (Derja & FR)
            </span>
          </div>
        </button>
      )}

      {/* Slide-in Chat Drawer */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                  🇹🇳
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base">Sami · Conseiller IA Tunisien</h3>
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                    Gemini 3.8
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Style tunisien, pointures, Derja & Facturation
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setSpeechEnabled(!speechEnabled)}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  speechEnabled ? 'text-amber-600 bg-amber-50' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-800'
                }`}
                title={speechEnabled ? 'Désactiver la voix' : 'Activer la voix'}
              >
                {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <button
                onClick={onToggle}
                className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Current product banner inside chat */}
          {currentProduct && (
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-slate-500">Produit 3D actif:</span>
                <span className="font-semibold text-slate-800 truncate">{currentProduct.name}</span>
              </div>
              <span className="font-bold text-amber-600 flex-shrink-0">{currentProduct.price} DT</span>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center flex-shrink-0 text-amber-700 text-xs font-bold mt-1">
                    🇹🇳
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl p-3.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-sm shadow-xs'
                      : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-sm shadow-xs'
                  }`}
                >
                  <div className="whitespace-pre-line">{msg.text}</div>
                  <div
                    className={`text-[10px] mt-1.5 flex justify-end ${
                      msg.role === 'user' ? 'text-slate-900/80' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 text-slate-700 text-xs mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start items-center">
                <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center flex-shrink-0 text-amber-700 text-xs font-bold">
                  🇹🇳
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2 text-xs text-amber-700">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                  <span>Sami ykhamem fi 7al mezyen... (Génération de réponse)</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-4 py-2 border-t border-slate-200 bg-slate-50 overflow-x-auto">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(qp.query)}
                  className="text-xs bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors cursor-pointer shadow-xs"
                >
                  {qp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input Form */}
          <div className="p-3 bg-slate-50 border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="As2al Sami fi ay 7aja (Taille, Style, 3D...)"
                className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors shadow-xs"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className="p-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="mt-2 text-center text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>Conseils certifiés KARTAGO Tunisie · Facturation électronique sécurisée</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
