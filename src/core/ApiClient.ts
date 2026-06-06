import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

export class ApiClient {
  protected client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({ baseURL });
    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      return config;
    });

    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            return await this.handleTokenRefresh(originalRequest);
          } catch (refreshError) {
            // Re-throw the original or refresh error to be handled by the UI
            return Promise.reject(refreshError);
          }
        }
        
        // Enhance error object for better debugging
        return Promise.reject(this.formatError(error));
      }
    );
  }

  protected async handleTokenRefresh(_originalRequest: any): Promise<any> {
    throw new Error('Token refresh logic must be implemented in UserService');
  }

  private formatError(error: AxiosError) {
    if (error.response) {
      // Server responded with error status
      return {
        message: error.response.data || 'API Error',
        status: error.response.status,
        data: error.response.data
      };
    } else if (error.request) {
      // No response received
      return { message: 'Network Error', status: 0 };
    }
    return { message: error.message };
  }
}
