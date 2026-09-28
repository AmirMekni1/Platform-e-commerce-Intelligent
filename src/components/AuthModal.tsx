import React, { useState } from 'react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import {
  X,
  Mail,
  Lock,
  User,
  ShieldCheck,
  Sparkles,
  Crown,
  MapPin,
  Phone,
  ArrowRight,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { auth, googleProvider, syncUserProfile } from '../firebase';
import { AppUser } from '../types';
import { TUNISIAN_GOVERNORATES } from '../data/products';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: AppUser) => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [governorate, setGovernorate] = useState('Tunis');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Google Sign-In via Firebase
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const profile = await syncUserProfile(result.user, { governorate, phone });
      onAuthSuccess(profile);
      onClose();
    } catch (error: any) {
      console.warn('Google popup error (falling back to fast session):', error);
      if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/cancelled-popup-request') {
        setErrorMessage('La fenêtre popup a été bloquée par le navigateur. Vous pouvez utiliser la connexion par email ci-dessous.');
      } else {
        setErrorMessage(error?.message || 'Erreur lors de la connexion Google');
      }
    } finally {
      setLoading(false);
    }
  };

  // Email / Password submission
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      if (mode === 'register') {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName) {
          await updateProfile(cred.user, { displayName });
        }
        const profile = await syncUserProfile(cred.user, {
          displayName: displayName || email.split('@')[0],
          governorate,
          phone,
        });
        onAuthSuccess(profile);
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const profile = await syncUserProfile(cred.user);
        onAuthSuccess(profile);
      }
      onClose();
    } catch (error: any) {
      console.error('Email auth error:', error);
      if (error?.code === 'auth/user-not-found' || error?.code === 'auth/wrong-password') {
        setErrorMessage('Identifiants incorrects. Veuillez vérifier votre email et mot de passe.');
      } else if (error?.code === 'auth/email-already-in-use') {
        setErrorMessage('Cet email est déjà utilisé. Veuillez vous connecter.');
      } else {
        setErrorMessage(error?.message || 'Erreur lors de l\'authentification');
      }
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Login helper (Admin or VIP Client)
  const handleFastDemoLogin = async (roleType: 'admin' | 'vip') => {
    setLoading(true);
    setErrorMessage(null);
    try {
      if (roleType === 'admin') {
        const mockAdmin: AppUser = {
          uid: 'usr-admin-1',
          email: 'mekniamir09@gmail.com',
          displayName: 'Amir Mekni (Admin)',
          role: 'admin',
          subscriptionTier: 'premium',
          governorate: 'Tunis',
          phone: '+216 98 421 780',
          createdAt: '2026-09-01',
          totalSpent: 1240.0,
          orderCount: 5,
          notes: 'Super Administrateur KARTAGO',
        };
        onAuthSuccess(mockAdmin);
      } else {
        const mockVIP: AppUser = {
          uid: 'usr-vip-2',
          email: 'yassine.bensalem@gmail.com',
          displayName: 'Yassine Ben Salem',
          role: 'customer',
          subscriptionTier: 'vip_club',
          governorate: 'Tunis',
          phone: '+216 98 421 780',
          createdAt: '2026-09-12',
          totalSpent: 498.0,
          orderCount: 2,
          notes: 'Membre Club VIP (-15% automatique)',
        };
        onAuthSuccess(mockVIP);
      }
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {mode === 'login' ? 'Connexion à votre Espace' : 'Créer un Compte KARTAGO'}
              </h2>
              <p className="text-xs text-slate-500">
                Accès aux modèles 3D, historique de commandes et club VIP
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

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Fast Demo Access Pills */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
              <span>🚀 Accès Rapide Démo Immédiat:</span>
              <span className="text-emerald-600 font-mono">1-Clic</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleFastDemoLogin('admin')}
                className="flex items-center justify-center gap-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <Crown className="w-3.5 h-3.5 text-amber-600" />
                <span>Admin Mekni</span>
              </button>
              <button
                type="button"
                onClick={() => handleFastDemoLogin('vip')}
                className="flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Client VIP (-15%)</span>
              </button>
            </div>
          </div>

          {/* Google Sign-in button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-800 font-bold py-3 px-4 rounded-2xl border border-slate-300 shadow-xs transition-all text-xs disabled:opacity-50 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.19 0 10.04 0 12s.45 3.81 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Continuer avec Google</span>
          </button>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <div className="flex-1 h-[1px] bg-slate-200" />
            <span>ou avec votre email</span>
            <div className="flex-1 h-[1px] bg-slate-200" />
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-xs">
              {errorMessage}
            </div>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3.5 text-xs">
            {mode === 'register' && (
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Nom & Prénom</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Amir Mekni"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-slate-700 mb-1 font-semibold">Adresse Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@exemple.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-semibold">Mot de passe</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {mode === 'register' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Gouvernorat</label>
                  <select
                    value={governorate}
                    onChange={(e) => setGovernorate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {TUNISIAN_GOVERNORATES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Téléphone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+216 -- --- ---"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Traitement en cours...</span>
                </>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Se connecter' : 'Créer mon compte'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Login / Register */}
          <div className="text-center text-xs text-slate-500 pt-1">
            {mode === 'login' ? (
              <span>
                Pas encore de compte ?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-amber-600 font-bold hover:underline cursor-pointer"
                >
                  S'inscrire gratuitement
                </button>
              </span>
            ) : (
              <span>
                Déjà inscrit ?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-amber-600 font-bold hover:underline cursor-pointer"
                >
                  Se connecter
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
