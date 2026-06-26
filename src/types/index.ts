export type Role = 'CUSTOMER' | 'PROVIDER' | 'ADMIN';
export type BookingStatus = 'PENDING' | 'ACCEPTED' | 'EN_ROUTE' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
export type ProviderStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export interface Provider {
  id: string;
  userId: string;
  bio?: string;
  experience?: number;
  status: ProviderStatus;
  rating: number;
  totalReviews: number;
  totalEarnings: number;
  walletBalance: number;
  isAvailable: boolean;
  documents?: any;
  bankDetails?: any;
  createdAt: string;
  user: User;
  services?: ProviderService[];
  _count?: { bookings: number };
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  _count?: { services: number };
}

export interface Service {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  image?: string;
  basePrice: number;
  duration: number;
  isActive: boolean;
  category?: Category;
  _count?: { providers: number };
}

export interface ProviderService {
  id: string;
  price: number;
  service: Service;
}

export interface Booking {
  id: string;
  customerId: string;
  providerId?: string;
  status: BookingStatus;
  scheduledAt: string;
  completedAt?: string;
  totalAmount: number;
  platformFee: number;
  providerEarning: number;
  notes?: string;
  cancellationReason?: string;
  createdAt: string;
  service: { id: string; name: string; image?: string; duration: number };
  customer: { id: string; name: string; avatar?: string; phone: string };
  provider?: { user: { id: string; name: string; avatar?: string; phone: string } };
  address?: { fullAddress: string };
  payment?: { status: PaymentStatus; amount: number; method: string };
  review?: { rating: number; comment?: string };
}

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  method: string;
  status: PaymentStatus;
  razorpayPaymentId?: string;
  refundAmount?: number;
  paidAt?: string;
  createdAt: string;
  booking: {
    id: string;
    service: { name: string };
    customer: { name: string; phone: string };
  };
}

export interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  fromUser: { name: string };
  toUser: { name: string };
  booking: { service: { name: string } };
}

export interface DashboardStats {
  total: number;
  pending: number;
  completed: number;
  cancelled: number;
  totalRevenue: number;
}

export interface ActivityLog {
  id: string;
  adminId: string | null;
  adminName: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  entityName: string | null;
  changes: Record<string, any> | null;
  ip: string | null;
  createdAt: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  bookingsIncluded: number;
  discountPct: number;
  description?: string;
  isActive: boolean;
  subscriberCount?: number;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  targetRole: string;
  sentBy?: string;
  createdAt: string;
}
