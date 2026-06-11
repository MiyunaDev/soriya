import { ApiClient } from "../core/ApiClient";
import { AxiosResponse } from "axios";

export class UserService extends ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor(baseURL: string) {
    super(baseURL);
  }

  protected override async handleTokenRefresh(
    originalRequest: any
  ): Promise<any> {
    if (!this.refreshToken) {
      throw new Error("No refresh token available");
    }

    try {
      const response = await this.client.post(
        "/refresh",
        {
          refreshToken: this.refreshToken
        }
      );

      const { accessToken } = response.data;

      this.accessToken = accessToken;

      originalRequest.headers.Authorization =
        `Bearer ${accessToken}`;

      return this.client(originalRequest);
    } catch (error) {
      await this.logout();
      throw error;
    }
  }

  private setAuthHeader(token: string) {
    this.client.defaults.headers.common.Authorization =
      `Bearer ${token}`;
  }

  // ===== AUTH =====

  public async register(data: {
    ownerEmail: string;
    username: string;
    password: string;
  }): Promise<AxiosResponse> {
    return this.client.post("/register", data);
  }

  public async login(data: {
    ownerEmail: string;
    password: string;
  }): Promise<AxiosResponse> {
    const response = await this.client.post(
      "/login",
      data
    );

    this.refreshToken = response.data.refreshToken;

    return response;
  }

  public async selectProfile(
    userId: string,
    authMethod: "token" | "refresh" = "token"
  ): Promise<AxiosResponse> {
    const headers: any = {};

    if (
      authMethod === "refresh" &&
      this.refreshToken
    ) {
      headers["x-refresh-token"] =
        this.refreshToken;
    }

    const response = await this.client.post(
      "/select-profile",
      { userId },
      { headers }
    );

    this.accessToken = response.data.accessToken;

    this.setAuthHeader(
      this.accessToken!
    );

    return response;
  }

  public async logout(): Promise<
    AxiosResponse | void
  > {
    try {
      return await this.client.post(
        "/logout",
        {
          refreshToken:
            this.refreshToken
        }
      );
    } finally {
      this.accessToken = null;
      this.refreshToken = null;

      delete this.client.defaults
        .headers.common.Authorization;
    }
  }

  // ===== USER =====

  public async getMe(): Promise<AxiosResponse> {
    return this.client.get("/me");
  }

  public async updateProfile(
    data: {
      user?: any;
      accountCenter?: any;
    }
  ): Promise<AxiosResponse> {
    return this.client.patch(
      "/profile",
      data
    );
  }

  public async deleteProfile(): Promise<AxiosResponse> {
    return this.client.delete(
      "/profile"
    );
  }

  // ===== MEDIA =====

  public async updateAvatar(
    avatar: File
  ): Promise<AxiosResponse> {
    const formData = new FormData();

    formData.append(
      "avatar",
      avatar
    );

    return this.client.post(
      "/avatar",
      formData,
      {
        headers: {
          "Content-Type":
            "multipart/form-data"
        }
      }
    );
  }

  public async updateBanner(
    banner: File
  ): Promise<AxiosResponse> {
    const formData = new FormData();

    formData.append(
      "banner",
      banner
    );

    return this.client.post(
      "/banner",
      formData,
      {
        headers: {
          "Content-Type":
            "multipart/form-data"
        }
      }
    );
  }

  // ===== SECURITY =====

  public async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<AxiosResponse> {
    return this.client.post(
      "/change-password",
      {
        currentPassword,
        newPassword
      }
    );
  }

  public async updateSecurityPhrase(
    phrase: string,
    hint: string
  ): Promise<AxiosResponse> {
    return this.client.post(
      "/security-phrase",
      {
        phrase,
        hint
      }
    );
  }

  // ===== COMPATIBILITY =====

  public async getUser(
    id: string
  ): Promise<AxiosResponse> {
    return this.client.get(
      `/users/${id}`
    );
  }
}