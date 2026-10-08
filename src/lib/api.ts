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
    if (error.response?.status === 401 && Cookies.get('admin_token')) {
      // Only force-redirect when a previously authenticated session has expired.
      // During the login flow (no cookie yet) let the component handle the error.
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
    api.post('/auth/verify-otp', JSON.stringify({ phone, otp }), {
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
<<<<<<< HEAD
  getStats: () => api.get('/admin/dashboard'),
  getRevenueStats: () => api.get('/admin/payments'),
=======
  // Backend: GET /admin/dashboard (snake_case counts; amounts are whole rupees,
  // despite the `_paise` name). Reshaped to the { data: { data } } the pages read.
  getStats: async () => {
    const res = await api.get('/admin/dashboard');
    const d = res.data?.data ?? {};
    return {
      ...res,
      data: {
        ...res.data,
        data: {
          total:        d.total_bookings ?? 0,
          pending:      d.pending_bookings ?? 0,
          completed:    d.completed_bookings ?? 0,
          cancelled:    d.cancelled_bookings ?? 0,
          today:        d.today_bookings ?? 0,
          totalRevenue: d.total_revenue_paise ?? 0,
          totalCustomers:           d.total_customers ?? 0,
          totalProviders:           d.total_providers ?? 0,
          pendingProviderApprovals: d.pending_provider_approvals ?? 0,
        },
      },
    };
  },
  getRevenueStats: () => api.get('/payments'),
>>>>>>> ae8764e (know admin can see the chatt history of the both end usersgit push origin new_oct)
};

// ── Bookings ────────────────────────────────────────────────────────────────
export const bookingsApi = {
<<<<<<< HEAD
  getAll: (params?: Record<string, any>) =>
    api.get('/admin/bookings', { params }),
=======
  // Backend: GET /admin/bookings → { items, total } (snake_case rows).
  getAll: ({ limit, ...params }: Record<string, any> = {}) =>
    api.get('/admin/bookings', { params: { ...params, per_page: limit ?? params.per_page } }),
  // Chat transcript — admin/support can read it even after the booking ends.
  getMessages: (id: string, params?: { before?: string; limit?: number }) =>
    api.get(`/bookings/${id}/messages`, { params }),
>>>>>>> ae8764e (know admin can see the chatt history of the both end usersgit push origin new_oct)
};

// ── Users (customers) ───────────────────────────────────────────────────────
export const usersApi = {
  getAll:   (params?: Record<string, any>) => api.get('/admin/users', { params }),
  suspend:  (id: string) => api.patch(`/admin/users/${id}/suspend`, {}),
  activate: (id: string) => api.patch(`/admin/users/${id}/activate`, {}),
};

// ── Providers ───────────────────────────────────────────────────────────────
export const providersApi = {
  getAll: (params?: Record<string, any>) => api.get('/providers', { params }),
  getById: (id: string) => api.get(`/providers/${id}`),
  approve: (id: string) => api.patch(`/providers/${id}/approve`, {}),
  suspend: (id: string) => api.patch(`/providers/${id}/suspend`, {}),
  getLocations: () => api.get('/admin/providers/locations'),
  updateBio: (id: string, bio: string) => api.patch(`/admin/providers/${id}/bio`, { bio }),
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
  updateCategory: (id: string, data: any) => api.patch(`/admin/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete(`/admin/categories/${id}`),
};

// ── Payments ─────────────────────────────────────────────────────────────────
export const paymentsApi = {
  getAll: (params?: Record<string, any>) => api.get('/admin/payments', { params }),
  refund: (bookingId: string, amount?: number) =>
    api.post('/payments/refund', { booking_id: bookingId, amount }),
};

// ── Reviews ──────────────────────────────────────────────────────────────────
export const reviewsApi = {
  getAll: (params?: Record<string, any>) => api.get('/admin/reviews', { params }),
  delete: (id: string) => api.delete(`/reviews/${id}`),
  getForProvider: (providerId: string) => api.get(`/reviews/provider/${providerId}`),
};

// ── Audit Logs ───────────────────────────────────────────────────────────────
export const logsApi = {
<<<<<<< HEAD
  getAll: (params?: Record<string, any>) => api.get('/admin/logs', { params }),
=======
  // Backend: GET /admin/logs → { items, total }. It filters by `search` only.
  getAll: async ({ limit, ...params }: Record<string, any> = {}) => {
    const res = await api.get('/admin/logs', { params: { ...params, per_page: limit ?? params.per_page } });
    const body = res.data?.data ?? {};
    const parse = (v: any) => {
      if (v == null || typeof v === 'object') return v ?? null;
      try { return JSON.parse(v); } catch { return { value: v }; }
    };
    return {
      ...res,
      data: {
        data: (body.items ?? []).map((r: any) => ({
          id: String(r.id),
          adminId: r.admin_id ?? null,
          adminName: r.admin_name ?? null,
          action: r.action ?? '',
          entity: r.entity ?? '',
          entityId: r.entity_id ?? null,
          entityName: null,
          changes: parse(r.changes),
          ip: r.ip ?? null,
          createdAt: r.created_at,
        })),
        pagination: { total: body.total ?? 0 },
      },
    };
  },
>>>>>>> ae8764e (know admin can see the chatt history of the both end usersgit push origin new_oct)
};

// ── Subscriptions ─────────────────────────────────────────────────────────────
export const subscriptionsApi = {
  getPlans:   (params?: Record<string, any>) => api.get('/admin/subscriptions/plans', { params }),
  createPlan: (data: any) => api.post('/admin/subscriptions/plans', data),
  updatePlan: (id: string, data: any) => api.patch(`/admin/subscriptions/plans/${id}`, data),
  deletePlan: (id: string) => api.delete(`/admin/subscriptions/plans/${id}`),
};

// ── Documents ─────────────────────────────────────────────────────────────────
export const documentsApi = {
  getByProvider: (providerId: string) => api.get(`/documents/${providerId}`),
  getContent: (id: string) => api.get(`/documents/${id}/content`),
  verify: (id: string, status: 'VERIFIED' | 'REJECTED', rejection_reason?: string) =>
    api.patch(`/documents/${id}/verify`, { status, rejection_reason }),
};

// ── Announcements ─────────────────────────────────────────────────────────────
export const announcementsApi = {
  getAll: (params?: any) => api.get('/admin/announcements', { params }),
  create: (data: { title: string; body: string; target_role: string }) =>
    api.post('/admin/announcements', data),
  remove: (id: string) => api.delete(`/admin/announcements/${id}`),
};

// ── Coupons ──────────────────────────────────────────────────────────────────
export const couponsApi = {
  getAll: () => api.get('/admin/coupons'),
  create: (data: any) => api.post('/coupons', data),
  update: (id: string, data: any) => api.patch(`/coupons/${id}`, data),
  remove: (id: string) => api.delete(`/coupons/${id}`),
};

// ── Calls (masked calling via Exotel) ───────────────────────────────────────────
export const callsApi = {
  initiate: (targetUserId: string) => api.post('/calls/initiate', { target_user_id: targetUserId }),
  // GET /admin/calls — ADMIN/SUPPORT only. Filters: status, booking_id, user_id; page, per_page.
  getLogs: (params?: Record<string, any>) => api.get('/admin/calls', { params }),
};

// ── Support tickets ────────────────────────────────────────────────────────────
export const supportApi = {
  getAll: (params?: Record<string, any>) => api.get('/support/tickets/all', { params }),
  getById: (id: string) => api.get(`/support/tickets/${id}`),
  updateStatus: (id: string, data: { status?: string; priority?: string }) =>
    api.patch(`/support/tickets/${id}`, data),
  reply: (id: string, content: string) => api.post(`/support/tickets/${id}/messages`, { content }),
};
