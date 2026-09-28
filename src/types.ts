export type ProductCategory = 'shoes' | 'apparel' | 'accessories';

export interface ColorOption {
  name: string;
  hex: string;
  soleHex?: string;
  accentHex?: string;
  lacesHex?: string;
  labelDerja?: string;
}

export interface Product {
  id: string;
  name: string;
  tagline: string;
  price: number; // In Tunisian Dinars (DT)
  category: ProductCategory;
  description: string;
  longDescription: string;
  rating: number;
  reviewsCount: number;
  availableSizes: string[];
  colors: ColorOption[];
  defaultColor: ColorOption;
  defaultSize: string;
  badges: string[];
  features: string[];
  inStock: boolean;
  model3DType: 'sneaker-retro' | 'sneaker-hightop' | 'boot-desert' | 'trainer-speed' | 'hoodie' | 'duffle' | 'watch';
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  size: string;
  color: ColorOption;
  quantity: number;
  model3DType: Product['model3DType'];
}

export interface ElectronicInvoice {
  invoiceNumber: string;
  orderId: string;
  date: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  governorate: string;
  items: Array<{
    name: string;
    size: string;
    color: string;
    quantity: number;
    priceUnit: number;
    totalLine: number;
  }>;
  subtotalHT: number;
  tvaRate: number; // 19%
  tvaAmount: number;
  timbreFiscal: number; // 1.000 DT
  shippingFee: number;
  totalTTC: number;
  paymentMethod: string;
  matriculeFiscalCompany: string;
  rcCompany: string;
  status: 'Payée' | 'En attente' | 'Contre remboursement';
  trackingNumber: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedProduct?: Product;
}

export interface AppUser {
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
  notes?: string;
}

export interface AIPredictionResult {
  stylePersona: string;
  styleConfidencePercent: number;
  fitPrediction: {
    recommendedSize: string;
    fitCertaintyPercent: number;
    advice: string;
  };
  purchasePropensityScore: number;
  predictedBudgetCategory: string;
  bestMatchedColorDerja: string;
  reasoning: string;
  recommendedBundle: {
    productId: string;
    name: string;
    complementaryPrice: number;
    synergyPercent: number;
    bundleDiscountPercent: number;
    benefit: string;
  };
  smartOptions: Array<{
    id: string;
    title: string;
    description: string;
    actionType: 'apply_size' | 'add_bundle' | 'fast_checkout' | 'switch_color';
  }>;
}

export interface AdminProductMetric {
  id: string;
  name: string;
  category: string;
  price: number;
  unitsSold: number;
  totalRevenue: number;
  returnsCount: number;
  returnRatePercent: number;
  views3D: number;
  conversionRate: number;
  stockLevel: number;
  rating: number;
  status: 'most_pay' | 'average' | 'not_good';
  aiDiagnosis: string;
  aiRemedyAction: string;
}

export interface CustomerReview {
  id: string;
  productId: string;
  productName: string;
  userId: string;
  userName: string;
  userEmail: string;
  rating: number;
  title: string;
  comment: string;
  isVerifiedPurchase: boolean;
  sizeFit?: 'Taille trop petit' | 'Parfait / Conforme' | 'Taille trop grand';
  comfortScore?: number;
  createdAt: string;
  helpfulCount: number;
}
