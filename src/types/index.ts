export type UserRole = 'admin' | 'restaurant' | 'captain' | 'user';

export interface AdminUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  isAdmin: boolean;
}

export type SubscriptionStatus = 'Active' | 'Pending' | 'Expired' | 'Suspended';

export interface Restaurant {
  id: string;
  name: string;
  category?: string;
  phone?: string;
  rating?: number;
  subscriptionStatus?: SubscriptionStatus;
  isActive: boolean;
  createdAt?: any;
  address?: string;
  ownerEmail?: string;
  // Preserve any raw fields from existing Firestore documents
  raw?: Record<string, any>;
}

export type CaptainStatus = 'online' | 'offline' | 'busy';

export interface Captain {
  id: string;
  name: string;
  phone: string;
  status: CaptainStatus;
  ordersCount: number;
  rating: number;
  createdAt?: any;
  vehicleType?: string;
  raw?: Record<string, any>;
}

export type OrderStatus =
  | 'New'
  | 'Accepted'
  | 'Preparing'
  | 'Ready'
  | 'Picked Up'
  | 'Delivered'
  | 'Cancelled';

export interface OrderItem {
  id?: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  restaurantId?: string;
  restaurantName: string;
  customerName: string;
  customerPhone?: string;
  deliveryAddress?: string;
  captainId?: string;
  captainName?: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  createdAt?: any;
  items?: OrderItem[];
  raw?: Record<string, any>;
}

export interface SubscriptionPlan {
  captainsCount: number;
  price: number;
  label: string;
}

export interface Subscription {
  id: string;
  restaurantId: string;
  restaurantName: string;
  plan: string;
  captainsCount?: number;
  price: number;
  startDate: string;
  endDate: string;
  status: SubscriptionStatus;
  raw?: Record<string, any>;
}

export type PaymentMethod = 'Visa' | 'Mobile Wallet' | 'Cash' | string;
export type PaymentStatus = 'success' | 'pending' | 'failed';

export interface Payment {
  id: string;
  transactionId?: string;
  transactionNumber?: string;
  restaurantId?: string;
  restaurantName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  date?: string;
  createdAt?: any;
  notes?: string;
  raw?: Record<string, any>;
}

export interface DashboardStats {
  totalRestaurants: number;
  activeRestaurants: number;
  totalCaptains: number;
  activeCaptains: number;
  totalOrders: number;
  todayOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  monthlyRevenue?: number;
  dailyOrderVolume?: number;
  avgOrderValue?: number;
  avgDeliveryTimeMinutes?: number;
  orderSuccessRate?: number;
}

export interface SystemSettings {
  companyName: string;
  companyNameAr: string;
  supportPhone: string;
  supportEmail: string;
  address: string;
  baseDeliveryFee: number;
  perKmRate: number;
  taxRatePercent: number;
  activeCities: string[];
}
