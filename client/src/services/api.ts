const API_URL = '/api';

interface FetchOptions extends RequestInit {
  token?: string;
}

class ApiClient {
  private baseUrl: string;
  constructor(baseUrl: string) { this.baseUrl = baseUrl; }

  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  private async request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    // Normalize: strip accidental leading "api/" or "/api/" since baseUrl already includes /api
    const normalized = endpoint.replace(/^\/?api\/?/, '/');
    const path = normalized.startsWith('/') ? normalized : `/${normalized}`;
    const { token, ...fetchOptions } = options;
    const authToken = token || this.getToken();
    const headers: Record<string, string> = {
      ...(fetchOptions.headers as Record<string, string>),
    };
    if (!(fetchOptions.body instanceof FormData)) headers['Content-Type'] = 'application/json';
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

    const response = await fetch(`${this.baseUrl}${path}`, { ...fetchOptions, headers });
    let data: { message?: string; success?: boolean } = {};
    const responseText = await response.text();
    if (responseText) {
      try { data = JSON.parse(responseText); } catch (error) {
        if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
      }
    }
    if (!response.ok) {
      // Invalid credentials for a password change should stay on Settings;
      // only an expired/missing session should force a login redirect.
      if (response.status === 401 && !path.startsWith('/auth/change-password')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }
    return data;
  }

  async get<T>(endpoint: string, options?: FetchOptions): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', ...options });
  }
  async post<T>(endpoint: string, body?: unknown, options?: FetchOptions): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined, ...options });
  }
  async put<T>(endpoint: string, body?: unknown, options?: FetchOptions): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body: body ? JSON.stringify(body) : undefined, ...options });
  }
  async delete<T>(endpoint: string, options?: FetchOptions): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', ...options });
  }
}

export const api = new ApiClient(API_URL);
export default api;
