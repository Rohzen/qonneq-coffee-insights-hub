export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || '',  // Empty means relative path in Vercel
  endpoints: {
    auth: {
      login: '/api/auth/login',
      verify: '/api/auth/verify',
      logout: '/api/auth/logout',
    },
    customers: '/api/customers',
    machines: '/api/machines',
    dashboardStats: '/api/dashboard/stats',
  },
  timeout: 30000,
};

export const TOKEN_KEY = 'qonneq_portal_auth_token';
export const USER_KEY = 'qonneq_portal_user';
