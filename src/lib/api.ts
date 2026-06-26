import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5001/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor — attach token ──────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('admin_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — handle 401 ──────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('admin_token');
      if (typeof window !== 'undefined') window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// ── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (phone: string, otp: string) =>
    api.post('/auth/verify-otp', { phone, otp, role: 'ADMIN' }),
  sendOtp: (phone: string) => api.post('/auth/send-otp', { phone }),
  getMe: () => api.get('/auth/me'),
};

// ── Dashboard ───────────────────────────────────────────────────────────────
export const dashboardApi = {
  getStats: () => api.get('/bookings/admin/stats'),
  getRevenueStats: () => api.get('/payments'),
};

// ── Bookings ────────────────────────────────────────────────────────────────
export const bookingsApi = {
  getAll: (params?: Record<string, any>) =>
    api.get('/bookings/admin/all', { params }),
};

// ── Users (customers) ───────────────────────────────────────────────────────
export const usersApi = {
  getAll: (params?: Record<string, any>) =>
    api.get('/admin/users', { params }),
};

// ── Providers ───────────────────────────────────────────────────────────────
export const providersApi = {
  getAll: (params?: Record<string, any>) => api.get('/providers', { params }),
  getById: (id: string) => api.get(`/providers/${id}`),
  updateStatus: (id: string, status: string) =>
    api.patch(`/providers/${id}/status`, { status }),
};

// ── Services ────────────────────────────────────────────────────────────────
export const servicesApi = {
  getAll: (params?: Record<string, any>) => api.get('/services', { params }),
  getCategories: (params?: Record<string, any>) =>
    api.get('/categories', { params }),
  createService: (data: any) => api.post('/services', data),
  updateService: (id: string, data: any) => api.put(`/services/${id}`, data),
  deleteService: (id: string) => api.delete(`/services/${id}`),
  createCategory: (data: any) => api.post('/categories', data),
  updateCategory: (id: string, data: any) => api.put(`/categories/${id}`, data),
};

// ── Payments ─────────────────────────────────────────────────────────────────
export const paymentsApi = {
  getAll: (params?: Record<string, any>) => api.get('/payments', { params }),
  refund: (bookingId: string, amount?: number) =>
    api.post('/payments/refund', { bookingId, amount }),
};

// ── Reviews ──────────────────────────────────────────────────────────────────
export const reviewsApi = {
  getAll: (params?: Record<string, any>) => api.get('/reviews', { params }),
  delete: (id: string) => api.delete(`/reviews/${id}`),
};

// ── Audit Logs ───────────────────────────────────────────────────────────────
export const logsApi = {
  getAll: (params?: Record<string, any>) => api.get('/logs', { params }),
};

// ── Subscriptions ─────────────────────────────────────────────────────────────
export const subscriptionsApi = {
  getPlans: () => api.get('/subscriptions/plans'),
  createPlan: (data: any) => api.post('/subscriptions/plans', data),
  updatePlan: (id: string, data: any) =>
    api.patch(`/subscriptions/plans/${id}`, data),
};

// ── Announcements ─────────────────────────────────────────────────────────────
export const announcementsApi = {
  getAll: (params?: any) => api.get('/admin/announcements', { params }),
  create: (data: { title: string; body: string; targetRole: string }) =>
    api.post('/admin/announcements', data),
};
