import { ApiClient } from '../core/ApiClient';
import { AxiosResponse } from 'axios';

export class UserService extends ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor(baseURL: string) {
    super(baseURL);
  }

  protected override async handleTokenRefresh(originalRequest: any): Promise<any> {
    if (!this.refreshToken) throw new Error('No refresh token available');

    try {
      const response = await this.client.post('/refresh', { refreshToken: this.refreshToken });
      const { accessToken } = response.data;
      
      this.accessToken = accessToken;
      originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
      
      return this.client(originalRequest);
    } catch (error) {
      this.logout(); // Clear session if refresh fails
      throw error;
    }
  }

  private setAuthHeader(token: string) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  public async register(data: { ownerEmail: string; username: string; password: string }): Promise<AxiosResponse> {
    return this.client.post('/register', data);
  }

  public async login(data: { ownerEmail: string; password: string }): Promise<AxiosResponse> {
    const response = await this.client.post('/login', data);
    this.refreshToken = response.data.refreshToken;
    return response;
  }

  public async selectProfile(userId: string, authMethod: 'token' | 'refresh' = 'token'): Promise<AxiosResponse> {
    const headers: any = {};
    if (authMethod === 'refresh' && this.refreshToken) {
      headers['x-refresh-token'] = this.refreshToken;
    }
    
    const response = await this.client.post('/select-profile', { userId }, { headers });
    this.accessToken = response.data.accessToken;
    this.setAuthHeader(this.accessToken!);
    return response;
  }

  public async manageSecurityPhrase(action: 'create' | 'verify' | 'reset', phrase: string): Promise<AxiosResponse> {
    return this.client.post('/security-phrase', { action, phrase });
  }

  public async logout(): Promise<AxiosResponse | void> {
    try {
      const response = await this.client.post('/logout', { refreshToken: this.refreshToken });
      return response;
    } finally {
      this.accessToken = null;
      this.refreshToken = null;
      delete this.client.defaults.headers.common['Authorization'];
    }
  }

  public async getUser(id: string): Promise<AxiosResponse> {
    return this.client.get(`/users/${id}`);
  }
}
