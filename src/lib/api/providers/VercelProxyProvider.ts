import { APIResponse, User } from '../client';
import { APIProvider } from './BaseProvider';
import { EnrichedMachineContext } from '../../../types/dashboard';

export class VercelProxyProvider implements APIProvider {
    private async fetchApi<T>(endpoint: string, params: any = {}, requiresAuth = true, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'POST'): Promise<APIResponse<T>> {
        const token = localStorage.getItem('qonneq_portal_auth_token');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (requiresAuth && token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            console.log(`[API Proxy] ${method} ${endpoint}`, params);
            const fetchOptions: RequestInit = {
                method,
                headers,
            };

            // Include body for POST, PUT, DELETE
            if (method !== 'GET') {
                fetchOptions.body = JSON.stringify(params);
            }

            const response = await fetch(endpoint, fetchOptions);

            const contentType = response.headers.get('content-type');
            if (response.ok) {
                if (contentType && contentType.includes('application/json')) {
                    const responseData = await response.json();

                    // If the response already has a 'data' property, return it as is
                    if (responseData.success && responseData.data) {
                        return responseData;
                    }

                    // Otherwise, wrap the non-control fields into 'data'
                    const { success, error, message, ...rest } = responseData;
                    return {
                        success: success !== false,
                        data: Object.keys(rest).length > 0 ? rest : undefined,
                        message,
                        error
                    };
                } else {
                    const text = await response.text();
                    console.error(`[API] Expected JSON but got ${contentType}:`, text.substring(0, 100));
                    return { success: false, error: `Invalid response format: ${contentType}` };
                }
            } else {
                let errorMsg = `Server error: ${response.status}`;
                try {
                    if (contentType && contentType.includes('application/json')) {
                        const errorData = await response.json();
                        errorMsg = errorData.error || errorMsg;
                    } else {
                        const errorText = await response.text();
                        console.error(`[API] Error response (${response.status}):`, errorText.substring(0, 100));
                    }
                } catch (e) {
                    // Ignore parsing error for error body
                }
                return { success: false, error: errorMsg };
            }
        } catch (error) {
            console.error(`[API] Network error fetching ${endpoint}:`, error);
            return { success: false, error: error instanceof Error ? error.message : 'API call failed' };
        }
    }

    async login(username: string, password: string): Promise<APIResponse<{ token: string; user: User }>> {
        return this.fetchApi('/api/auth/login', { username, password }, false);
    }

    async verifyToken(token: string): Promise<APIResponse<{ user: User }>> {
        return this.fetchApi('/api/auth/verify', { token }, false);
    }

    async logout(): Promise<APIResponse> {
        // Local logout is just clearing the token, but we can call a logout endpoint if needed
        return { success: true };
    }

    async getDashboardStats(): Promise<APIResponse<any>> {
        return this.fetchApi('/api/dashboard/stats');
    }

    async getMachines(): Promise<APIResponse<any[]>> {
        // Use portal machines endpoint for regular users' company machines
        return this.fetchApi('/api/machines/list', {}, true, 'GET');
    }

    async getAdminMachines(): Promise<APIResponse<any[]>> {
        // Admin-only endpoint to get all machines across all companies
        return this.fetchApi('/api/admin/machines/list', {}, true, 'GET');
    }

    async getMachine(id: string): Promise<APIResponse<any>> {
        return this.fetchApi(`/api/machines/${id}`);
    }

    async getMachineTelemetry(id: string, params?: { days?: number; startDate?: string; endDate?: string, refresh?: boolean }): Promise<APIResponse<any>> {
        const queryParams = new URLSearchParams();
        if (params?.days) queryParams.append('days', params.days.toString());
        if (params?.startDate) queryParams.append('startDate', params.startDate);
        if (params?.endDate) queryParams.append('endDate', params.endDate);
        if (params?.refresh) queryParams.append('refresh', 'true');

        const queryString = queryParams.toString();
        return this.fetchApi(`/api/machines/${id}/telemetry${queryString ? `?${queryString}` : ''}`, {}, true, 'GET');
    }

    async getCustomers(): Promise<APIResponse<any[]>> {
        return this.fetchApi('/api/customers', {}, true, 'GET');
    }

    async getCustomer(id: string): Promise<APIResponse<any>> {
        return this.fetchApi(`/api/customers/${id}`, {}, true, 'GET');
    }

    // Admin methods
    async createCustomer(data: any): Promise<APIResponse> {
        return this.fetchApi('/api/admin/customers/create', data);
    }

    async createUser(data: any): Promise<APIResponse> {
        return this.fetchApi('/api/admin/users/create', data);
    }

    async updateUser(id: string, data: any): Promise<APIResponse> {
        return this.fetchApi('/api/admin/users/update', { id, ...data }, true, 'PUT');
    }

    async deleteUser(id: string): Promise<APIResponse> {
        return this.fetchApi('/api/admin/users/delete', { id }, true, 'DELETE');
    }

    async createMachine(data: any): Promise<APIResponse> {
        return this.fetchApi('/api/admin/machines/create', data);
    }

    async getUsers(): Promise<APIResponse<any[]>> {
        return this.fetchApi('/api/admin/users/list', {}, true, 'GET');
    }

    async getCustomerCredentials(customerId: string): Promise<APIResponse<any[]>> {
        return this.fetchApi(`/api/admin/customers/${customerId}/credentials`, {}, true, 'GET');
    }

    async saveCustomerCredential(customerId: string, data: any): Promise<APIResponse> {
        return this.fetchApi(`/api/admin/customers/${customerId}/credentials`, data);
    }

    async deleteCredential(credentialId: string): Promise<APIResponse> {
        return this.fetchApi(`/api/admin/credentials/${credentialId}`, {}, true, 'DELETE' as any);
    }

    async testCredentialConnection(credentialId: string): Promise<APIResponse> {
        return this.fetchApi(`/api/admin/credentials/${credentialId}/test`, {}, true, 'POST');
    }

    async testCredential(credentialId: string): Promise<APIResponse<{ machines_synced: number }>> {
        return this.fetchApi(`/api/admin/credentials/${credentialId}/sync`, {}, true, 'POST');
    }

    async deleteCustomer(customerId: string): Promise<APIResponse> {
        return this.fetchApi(`/api/admin/customers/${customerId}`, {}, true, 'DELETE' as any);
    }

    // Admin machine detail methods
    async getAdminMachineDetail(machineId: string): Promise<APIResponse<any>> {
        return this.fetchApi(`/api/admin/machines/${machineId}/detail`, {}, true, 'GET');
    }

    async getAdminMachineTelemetry(machineId: string, params?: { days?: number, startDate?: string, endDate?: string, refresh?: boolean }): Promise<APIResponse<any>> {
        const queryParams = new URLSearchParams();
        if (params?.days) queryParams.append('days', params.days.toString());
        if (params?.startDate) queryParams.append('startDate', params.startDate);
        if (params?.endDate) queryParams.append('endDate', params.endDate);
        if (params?.refresh) queryParams.append('refresh', 'true'); // Pass refresh param

        const queryString = queryParams.toString();
        return this.fetchApi(`/api/admin/machines/${machineId}/telemetry${queryString ? `?${queryString}` : ''}`, {}, true, 'GET');
    }

    // BRITA
    async getAdminBritaMachineDetail(machineId: string): Promise<APIResponse<any>> {
        return this.fetchApi(`/api/admin/machines/brita-detail?machineId=${encodeURIComponent(machineId)}`, {}, true, 'GET');
    }

    async getAdminBritaMachinesList(companyId?: string): Promise<APIResponse<any[]>> {
        const params = companyId ? `?companyId=${encodeURIComponent(companyId)}` : '';
        return this.fetchApi(`/api/admin/machines/brita-list${params}`, {}, true, 'GET');
    }

    // Enrichment
    async getEnrichedContext(serial: string): Promise<APIResponse<EnrichedMachineContext>> {
        return this.fetchApi(`/api/enrichment/context?serial=${encodeURIComponent(serial)}`, {}, true, 'GET');
    }

    // Analytics
    async getSmartAnalytics(serial: string, lookbackDays: number = 90): Promise<APIResponse<any>> {
        return this.fetchApi(`/api/analytics/smart?serial=${encodeURIComponent(serial)}&lookbackDays=${lookbackDays}`, {}, true, 'GET');
    }
}
