import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  getDocFromServer,
  collection,
  query,
  getDocs,
  orderBy,
  limit,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Auth instance
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Firestore instance (using configured database ID if present)
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Connection test as required by skill
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    if (error?.message && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline, working with cached/local fallback.');
    }
  }
}

// User Profile interface
export interface AppUserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'customer' | 'admin';
  subscriptionTier: 'free' | 'vip_club' | 'premium';
  governorate?: string;
  phone?: string;
  createdAt: string;
  totalSpent: number;
  orderCount: number;
}

// Sync user profile in Firestore
export async function syncUserProfile(user: FirebaseUser, extra?: Partial<AppUserProfile>): Promise<AppUserProfile> {
  const userRef = doc(db, 'users', user.uid);
  try {
    const snap = await getDoc(userRef);
    const isAdminEmail = user.email === 'mekniamir09@gmail.com';
    
    if (snap.exists()) {
      const existing = snap.data() as AppUserProfile;
      const updated: AppUserProfile = {
        ...existing,
        displayName: user.displayName || existing.displayName || 'Client KARTAGO',
        email: user.email || existing.email,
        photoURL: user.photoURL || existing.photoURL,
        role: isAdminEmail ? 'admin' : (existing.role || 'customer'),
        ...(extra || {}),
      };
      await setDoc(userRef, updated, { merge: true });
      return updated;
    } else {
      const newProfile: AppUserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'Client KARTAGO',
        photoURL: user.photoURL || '',
        role: isAdminEmail ? 'admin' : 'customer',
        subscriptionTier: 'free',
        governorate: extra?.governorate || 'Tunis',
        phone: extra?.phone || '',
        createdAt: new Date().toISOString(),
        totalSpent: 0,
        orderCount: 0,
        ...(extra || {}),
      };
      await setDoc(userRef, newProfile);
      return newProfile;
    }
  } catch (err) {
    console.warn('Could not sync user profile to Firestore (using memory fallback):', err);
    return {
      uid: user.uid,
      email: user.email || 'user@kartago.tn',
      displayName: user.displayName || 'Client KARTAGO',
      photoURL: user.photoURL || '',
      role: user.email === 'mekniamir09@gmail.com' ? 'admin' : 'customer',
      subscriptionTier: 'free',
      createdAt: new Date().toISOString(),
      totalSpent: 0,
      orderCount: 0,
    };
  }
}

export async function fastLoginDemoUser(role: 'admin' | 'vip'): Promise<AppUserProfile> {
  if (role === 'admin') {
    return {
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
    };
  } else {
    return {
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
    };
  }
}

