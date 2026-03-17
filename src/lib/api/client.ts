// API Client definitions
// The actual implementation is now in VercelProxyProvider.ts

import { VercelProxyProvider } from './providers/VercelProxyProvider';

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

// Singleton API client instance
export const apiClient = new VercelProxyProvider();
