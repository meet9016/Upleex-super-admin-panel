import endPointApi from '@/utils/endPointApi';
import { clearToken } from '@/utils/tokenManager';
import type { VendorPaymentResponse, VendorPaymentStatsResponse, ReleasePaymentResponse } from '@/types/vendorPayment';
import type { ContactResponse, ContactUpdateResponse } from '@/types/contact';

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL;

class ApiService {
  private getAuthHeaders(skipJsonContentType = false) {
    // Check if we're in browser environment
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    return {
      ...(skipJsonContentType ? {} : { 'Content-Type': 'application/json' }),
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
      if (response.status === 401) {
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          clearToken();
          localStorage.clear();
          window.location.replace('/login');
        }
      }
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  private async requestFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    const url = `${API_BASE_URL}/${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getAuthHeaders(true),
      body: formData,
    });

    if (!response.ok) {
      if (response.status === 401) {
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          clearToken();
          localStorage.clear();
          window.location.replace('/login');
        }
      }
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

  async uploadMetadataCsv(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.requestFormData(endPointApi.uploadMetadataCsv, formData);
  }

  async getMetadataJson() {
    return this.request(endPointApi.getMetadataJson);
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

  // Vendor Reports
  async getVendorReport(params?: {
    vendor_type?: string;
    date_range?: string;
    start_date?: string;
    end_date?: string;
    search?: string;
    status?: string;
    min_products?: string;
    max_products?: string;
    min_orders?: string;
    max_orders?: string;
    min_revenue?: string;
    max_revenue?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.vendor_type) queryParams.append('vendor_type', params.vendor_type);
    if (params?.date_range) queryParams.append('date_range', params.date_range);
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.min_products) queryParams.append('min_products', params.min_products);
    if (params?.max_products) queryParams.append('max_products', params.max_products);
    if (params?.min_orders) queryParams.append('min_orders', params.min_orders);
    if (params?.max_orders) queryParams.append('max_orders', params.max_orders);
    if (params?.min_revenue) queryParams.append('min_revenue', params.min_revenue);
    if (params?.max_revenue) queryParams.append('max_revenue', params.max_revenue);
    
    const endpoint = queryParams.toString() 
      ? `${endPointApi.getVendorReport}?${queryParams.toString()}`
      : endPointApi.getVendorReport;
    
    return this.request(endpoint);
  }

  async exportVendorReportExcel(params?: {
    vendor_type?: string;
    date_range?: string;
    start_date?: string;
    end_date?: string;
    search?: string;
    status?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.vendor_type) queryParams.append('vendor_type', params.vendor_type);
    if (params?.date_range) queryParams.append('date_range', params.date_range);
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    
    const endpoint = queryParams.toString() 
      ? `${endPointApi.exportVendorReportExcel}?${queryParams.toString()}`
      : endPointApi.exportVendorReportExcel;
    
    const url = `${API_BASE_URL}/${endpoint}`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to export vendor report');
    }
    
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `vendor_report_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
  }

  async exportVendorReportPDF(params?: {
    vendor_type?: string;
    date_range?: string;
    start_date?: string;
    end_date?: string;
    search?: string;
    status?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.vendor_type) queryParams.append('vendor_type', params.vendor_type);
    if (params?.date_range) queryParams.append('date_range', params.date_range);
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    
    const endpoint = queryParams.toString() 
      ? `${endPointApi.exportVendorReportPDF}?${queryParams.toString()}`
      : endPointApi.exportVendorReportPDF;
    
    const url = `${API_BASE_URL}/${endpoint}`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to export vendor report');
    }
    
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `vendor_report_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
  }

  // Settings
  async getSetting(key: string) {
    return this.request(`settings/${key}`);
  }

  async updateSetting(key: string, value: any) {
    return this.request(`settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    });
  }
}

export const apiService = new ApiService();