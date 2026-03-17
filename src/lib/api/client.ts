// API Client definitions
// The actual implementation is now in VercelProxyProvider.ts

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  partner_id: number;
  partner_name: string;
  role?: string;
}
