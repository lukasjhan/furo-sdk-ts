<p align="center">
  <img src="./furo.svg" alt="Furo Logo" width="400" height="240">
</p>

# Typescript SDK for Furo

Check Furo's [Official Documentation](https://docs.furo.one/react-sdk).

## Overview

```typescript
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

export declare class FuroClient {
  domain: string;
  clientId: string;
  redirectURI: string;
  api: AxiosInstance;
  static DEFAULT_API_BASE_URL: string;
  static FURO_AUTH_URL: string;
  constructor(options: FuroProviderOptions);
  buildAuthorizeUrl(): Promise<string>;
  getUser(): Promise<any>;
  handleRedirectCallback(url: string): Promise<{
    access_token: string;
    refresh_token: string;
  } | null>;
  refreshTokenSilently(
    accessToken: string,
    refreshToken: string
  ): Promise<FuroToken | null>;
  loginWithKakao(KAKAO_REST_API_KEY: string): Promise<string>;
}

export declare class FuroFrontClient extends FuroClient {
  constructor(options: FuroProviderOptions);
  loginWithRedirect(): Promise<void>;
  handleRedirectCallback(url?: string): Promise<{
    access_token: string;
    refresh_token: string;
  } | null>;
  checkSession(): Promise<string | null>;
  refreshTokenSilently(): Promise<{
    access_token: string;
    refresh_token: string;
  } | null>;
  logout(): Promise<void>;
  loginWithKakao(KAKAO_REST_API_KEY: string): Promise<string>;
}
```

### Parameters

| Name        | Type   | Description                                                                                        | Required |
| ----------- | ------ | -------------------------------------------------------------------------------------------------- | -------- |
| domain      | string | Using loginWithRedirect The login page to redirect to, using the default of https://auth.furo.one. | Yes      |
| clientId    | string | This is the client identifier assigned when creating the Furo project.                             | Yes      |
| redirectUri | string | This is the uri of the page to go to after login.                                                  | Yes      |
