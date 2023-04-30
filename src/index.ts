import axios, { AxiosInstance } from "axios";
import { Buffer } from "buffer";

export interface FuroProviderOptions {
  domain: string;
  clientId: string;
  redirectUri: string;
  apiUrl?: string;
}

export interface FuroToken {
  access_token: string;
  refresh_token: string;
}

export class FuroClient {
  domain: string;
  clientId: string;
  redirectURI: string;
  api: AxiosInstance;

  static DEFAULT_API_BASE_URL = "https://api.furo.one";
  static FURO_AUTH_URL = "https://auth.furo.one";

  constructor(options: FuroProviderOptions) {
    this.domain = options.domain;
    this.clientId = options.clientId;
    this.redirectURI = options.redirectUri;
    this.api = axios.create({
      baseURL: options.apiUrl ?? FuroClient.DEFAULT_API_BASE_URL,
    });
  }

  async buildAuthorizeUrl() {
    const baseUrl = `${this.domain}/login/${this.clientId}`;
    if (this.redirectURI)
      return `${baseUrl}?redirect_uri=${encodeURIComponent(this.redirectURI)}`;
    else return baseUrl;
  }

  async getUser() {
    const accessToken = await localStorage.getItem(
      `furo-${this.clientId}-token`
    );
    if (!accessToken) return null;

    const { data: user } = await this.api.get(`/users/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return user;
  }

  async handleRedirectCallback(url: string) {
    const params = new URLSearchParams(url);
    const code = params.get("code");
    const response = await this.api.post<FuroToken>(
      `/sessions/code/authenticate`,
      {
        code,
      }
    );
    const { access_token, refresh_token } = response.data;

    const base64Payload = access_token.split(".")[1];
    const payload = Buffer.from(base64Payload, "base64");
    const { pid } = JSON.parse(payload.toString());
    if (!pid || pid !== this.clientId) return null;

    return { access_token, refresh_token };
  }

  async refreshTokenSilently(
    accessToken: string,
    refreshToken: string
  ): Promise<FuroToken | null> {
    const { data } = await this.api.post<FuroToken>(
      `/sessions/token/refresh`,
      {
        accessToken,
      },
      {
        headers: { Authorization: `Bearer ${refreshToken}` },
      }
    );
    const { access_token, refresh_token } = data;
    return { access_token, refresh_token };
  }

  async loginWithKakao(KAKAO_REST_API_KEY: string) {
    if (!KAKAO_REST_API_KEY) throw "API KEY is empty";
    const redirectUri = encodeURIComponent(
      `${FuroClient.FURO_AUTH_URL}/oauth/kakao/${this.clientId}`
    );
    const url = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_REST_API_KEY}&redirect_uri=${redirectUri}&response_type=code`;
    return url;
  }
}

export class FuroFrontClient extends FuroClient {
  constructor(options: FuroProviderOptions) {
    super(options);
  }

  async loginWithRedirect() {
    const url = await super.buildAuthorizeUrl();
    window.location.href = url;
  }

  async handleRedirectCallback(url: string = window.location.search) {
    const data = await super.handleRedirectCallback(url);
    if (!data) return null;

    const { access_token, refresh_token } = data;

    await localStorage.setItem(`furo-${this.clientId}-token`, access_token);
    await localStorage.setItem(`furo-${this.clientId}-refresh`, refresh_token);

    return { access_token, refresh_token };
  }

  async checkSession() {
    return await sessionStorage.getItem(`furo-${this.clientId}-token`);
  }

  async refreshTokenSilently() {
    const oldRefreshToken = await localStorage.getItem(
      `furo-${this.clientId}-refresh`
    );
    if (!oldRefreshToken) return null;
    const oldAccessToken = await localStorage.getItem(
      `furo-${this.clientId}-token`
    );
    if (!oldAccessToken) return null;

    const token = await super.refreshTokenSilently(
      oldAccessToken,
      oldRefreshToken
    );
    if (!token) return null;
    const { access_token, refresh_token } = token;
    await localStorage.setItem(`furo-${this.clientId}-token`, access_token);
    await localStorage.setItem(`furo-${this.clientId}-refresh`, refresh_token);
    return { access_token, refresh_token };
  }

  async logout() {
    await localStorage.removeItem(`furo-${this.clientId}-token`);
    await localStorage.removeItem(`furo-${this.clientId}-refresh`);
  }

  async loginWithKakao(KAKAO_REST_API_KEY: string) {
    const url = await super.loginWithKakao(KAKAO_REST_API_KEY);
    window.location.href = url;
    return url;
  }
}
