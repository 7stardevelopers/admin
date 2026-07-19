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

// The backend now answers OPTIONS preflight requests directly (see
// lambda_function.py), so the CORS-preflight issue that used to block every
// authenticated request is fixed. The text/plain trick in authApi below is
// no longer strictly required, but is left in place since it's harmless and
// already working.

// ── Auth ────────────────────────────────────────────────────────────────────
// Sent as "text/plain" (CORS-safelisted) — harmless leftover from before the
// backend answered CORS preflight; the backend parses the raw JSON body
// regardless of the declared content type.
export const authApi = {
  login: (phone: string, otp: string) =>
    api.post('/auth/verify-otp', JSON.stringify({ phone, otp, role: 'ADMIN' }), {
      headers: { 'Content-Type': 'text/plain' },
    }),
  sendOtp: (phone: string) =>
    api.post('/auth/send-otp', JSON.stringify({ phone }), {
      headers: { 'Content-Type': 'text/plain' },
    }),
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
// getAll/getCategories hit the admin-scoped list endpoints (not the public
// customer-facing /services, /categories) so suspended services and inactive
// categories still show up for management instead of disappearing entirely.
export const servicesApi = {
  getAll: (params?: Record<string, any>) => api.get('/admin/services', { params }),
  getCategories: (params?: Record<string, any>) =>
    api.get('/admin/categories', { params }),
  createService: (data: any) => api.post('/admin/services', data),
  updateService: (id: string, data: any) => api.patch(`/admin/services/${id}`, data),
  deleteService: (id: string) => api.delete(`/admin/services/${id}`),
  createCategory: (data: any) => api.post('/admin/categories', data),
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
  create: (data: { title: string; body: string; target_role: string }) =>
    api.post('/notifications/announce', data),
};
