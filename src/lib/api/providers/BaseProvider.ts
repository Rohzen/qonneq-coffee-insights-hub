import { APIResponse, User } from '../client';
import { EnrichedMachineContext } from '../../../types/dashboard';
import { SmartAnalyticsData } from '../../../types/analytics';

export interface APIProvider {
    login(username: string, password: string): Promise<APIResponse<{ token: string; user: User }>>;
    verifyToken(token: string): Promise<APIResponse<{ user: User }>>;
    logout(): Promise<APIResponse>;

    getDashboardStats(): Promise<APIResponse<any>>;
    getMachines(): Promise<APIResponse<any[]>>;
    getMachine(id: string): Promise<APIResponse<any>>;
    getMachineTelemetry(id: string, params?: { days?: number; startDate?: string; endDate?: string; refresh?: boolean }): Promise<APIResponse<any>>;

    getCustomers(): Promise<APIResponse<any[]>>;
    getCustomer(id: string): Promise<APIResponse<any>>;

    // Admin-only methods
    createCustomer(data: any): Promise<APIResponse>;
    createUser(data: any): Promise<APIResponse>;
    updateUser(id: string, data: any): Promise<APIResponse>;
    deleteUser(id: string): Promise<APIResponse>;
    createMachine(data: any): Promise<APIResponse>;
    getCustomerCredentials(customerId: string): Promise<APIResponse<any[]>>;
    saveCustomerCredential(customerId: string, credentials: any): Promise<APIResponse>;
    deleteCredential(credentialId: string): Promise<APIResponse>;
    testCredentialConnection(credentialId: string): Promise<APIResponse>;
    testCredential(credentialId: string): Promise<APIResponse<{ machines_synced: number }>>;
    deleteCustomer(customerId: string): Promise<APIResponse>;
    getUsers(): Promise<APIResponse<any[]>>;
    getAdminMachines(): Promise<APIResponse<any[]>>;
    getAdminMachineDetail(machineId: string): Promise<APIResponse<any>>;
    getAdminMachineTelemetry(machineId: string, params?: { days?: number, startDate?: string, endDate?: string, refresh?: boolean }): Promise<APIResponse<any>>;

    // Enrichment
    getEnrichedContext(serial: string): Promise<APIResponse<EnrichedMachineContext>>;

    // Analytics
    getSmartAnalytics(serial: string, lookbackDays?: number): Promise<APIResponse<SmartAnalyticsData>>;
}
