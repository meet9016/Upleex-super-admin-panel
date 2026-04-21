import endPointApi from '@/utils/endPointApi';
import type { VendorPaymentResponse, VendorPaymentStatsResponse, ReleasePaymentResponse } from '@/types/vendorPayment';
import type { ContactResponse, ContactUpdateResponse } from '@/types/contact';

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3688/api/v1';

class ApiService {
  private getAuthHeaders() {
    // Check if we're in browser environment
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}/${endpoint}`;
    
    const config: RequestInit = {
      headers: this.getAuthHeaders(),
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Admin Authentication
  async login(email: string, password: string) {
    return this.request(endPointApi.adminLogin, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(adminData: { name: string; email: string; phone: string; password: string }) {
    return this.request(endPointApi.adminRegister, {
      method: 'POST',
      body: JSON.stringify(adminData),
    });
  }

  // Permission Management
  async getAllAdmins() {
    return this.request(endPointApi.getAllAdmins);
  }

  async getAvailablePages() {
    return this.request(endPointApi.getAvailablePages);
  }

  async assignPermissions(email: string, permissions: string[]) {
    return this.request(endPointApi.assignPermissions, {
      method: 'POST',
      body: JSON.stringify({ email, permissions }),
    });
  }

  async getMyPermissions() {
    return this.request(endPointApi.getMyPermissions);
  }

  // Vendor Payments
  async getAllVendorPayments(params?: { page?: number; limit?: number; status?: string; vendor_id?: string; type?: string }): Promise<VendorPaymentResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.vendor_id) queryParams.append('vendor_id', params.vendor_id);
    if (params?.type) queryParams.append('type', params.type);
    
    const endpoint = queryParams.toString() 
      ? `${endPointApi.getAllVendorPayments}?${queryParams.toString()}`
      : endPointApi.getAllVendorPayments;
    
    return this.request<VendorPaymentResponse>(endpoint);
  }

  async getVendorPaymentStats(vendorId?: string, type?: string): Promise<VendorPaymentStatsResponse> {
    const queryParams = new URLSearchParams();
    if (vendorId) queryParams.append('vendor_id', vendorId);
    if (type) queryParams.append('type', type);

    const endpoint = queryParams.toString() 
      ? `${endPointApi.getVendorPaymentStats}?${queryParams.toString()}`
      : endPointApi.getVendorPaymentStats;
    return this.request<VendorPaymentStatsResponse>(endpoint);
  }

  async releasePayment(paymentId: string, notes?: string): Promise<ReleasePaymentResponse> {
    const endpoint = endPointApi.releasePayment.replace(':paymentId', paymentId);
    return this.request<ReleasePaymentResponse>(endpoint, {
      method: 'PUT',
      body: JSON.stringify({ notes }),
    });
  }

  async releaseOrderPayment(orderId: string, vendorId: string, notes?: string): Promise<ReleasePaymentResponse> {
    const endpoint = endPointApi.releaseOrderPayment
      .replace(':orderId', orderId)
      .replace(':vendorId', vendorId);
    return this.request<ReleasePaymentResponse>(endpoint, {
      method: 'PUT',
      body: JSON.stringify({ notes }),
    });
  }

  async cancelPayment(paymentId: string, reason?: string): Promise<ReleasePaymentResponse> {
    const endpoint = endPointApi.cancelPayment.replace(':paymentId', paymentId);
    return this.request<ReleasePaymentResponse>(endpoint, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  }

  async releaseBulkPayments(paymentIds: string[], notes?: string): Promise<ReleasePaymentResponse> {
    return this.request<ReleasePaymentResponse>(endPointApi.releaseBulkPayments, {
      method: 'POST',
      body: JSON.stringify({ paymentIds, notes }),
    });
  }

  async releaseScheduledPayments(): Promise<ReleasePaymentResponse> {
    return this.request<ReleasePaymentResponse>(endPointApi.releaseScheduledPayments, {
      method: 'POST',
    });
  }

  // Contact Management
  async getAllContacts(params?: { page?: number; limit?: number }): Promise<ContactResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const endpoint = queryParams.toString() 
      ? `${endPointApi.getAllContacts}?${queryParams.toString()}`
      : endPointApi.getAllContacts;
    
    return this.request<ContactResponse>(endpoint);
  }

  async addContactNotes(id: string, notes: string): Promise<ContactUpdateResponse> {
    return this.request<ContactUpdateResponse>(`${endPointApi.updateContactStatus}/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ notes }),
    });
  }

  async deleteContact(id: string): Promise<ContactUpdateResponse> {
    return this.request<ContactUpdateResponse>(`${endPointApi.deleteContact}/${id}`, {
      method: 'DELETE',
    });
  }

  async bulkDeleteContacts(ids: string[]): Promise<ContactUpdateResponse> {
    return this.request<ContactUpdateResponse>(endPointApi.bulkDeleteContacts, {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    });
  }
}

export const apiService = new ApiService();