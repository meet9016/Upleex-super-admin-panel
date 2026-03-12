import endPointApi from '@/utils/endPointApi';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3688/api/v1';

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
}

export const apiService = new ApiService();