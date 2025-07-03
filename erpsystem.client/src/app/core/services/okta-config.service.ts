import { Injectable } from '@angular/core';

export interface OktaConfig {
  issuer: string;
  clientId: string;
  redirectUri: string;
  responseType: string;
  scopes: string[];
  postLogoutRedirectUri: string;
  authorizationServerId?: string;
  pkce?: boolean; // Use PKCE for enhanced security
}

@Injectable({
  providedIn: 'root'
})
export class OktaConfigService {
  private config: OktaConfig = {
    issuer: 'https://trial-1358401.okta.com/oauth2/default',
    clientId: '0oasufbxz8RxDLA0w697',
    redirectUri: window.location.origin + '/login/callback',
    responseType: 'code',
    scopes: ['openid', 'profile', 'email', 'groups'],
    postLogoutRedirectUri: window.location.origin,
    pkce: true,
  };

  getConfig(): OktaConfig {
    return this.config;
  }

  updateConfig(newConfig: Partial<OktaConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  async getAuthorizationUrl(): Promise<string> {
    const config = this.getConfig();
    
    // Generate PKCE parameters if enabled
    let codeVerifier = '';
    let codeChallenge = '';
    
    if (config.pkce) {
      codeVerifier = this.generateCodeVerifier();
      codeChallenge = await this.generateCodeChallenge(codeVerifier);
      
      // Store code verifier for later use in token exchange
      localStorage.setItem('okta_code_verifier', codeVerifier);
    }
    
    const params = new URLSearchParams({
      'client_id': config.clientId,
      'response_type': config.responseType,
      'scope': config.scopes.join(' '),
      'redirect_uri': config.redirectUri,
      'state': this.generateRandomString(),
      'nonce': this.generateRandomString()
    });

    // Add PKCE parameters if enabled
    if (config.pkce && codeChallenge) {
      params.append('code_challenge', codeChallenge);
      params.append('code_challenge_method', 'S256');
    }

    return `${config.issuer}/v1/authorize?${params.toString()}`;
  }

  private generateRandomString(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  // PKCE helper methods
  private generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return this.base64UrlEncode(array);
  }

  private async generateCodeChallenge(codeVerifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    
    try {
      const hash = await crypto.subtle.digest('SHA-256', data);
      return this.base64UrlEncode(new Uint8Array(hash));
    } catch (error) {
      // Fallback for environments without crypto.subtle
      console.warn('crypto.subtle not available, using plain code verifier');
      return codeVerifier;
    }
  }

  private base64UrlEncode(array: Uint8Array): string {
    const base64 = btoa(String.fromCharCode.apply(null, Array.from(array)));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  // Helper method to extract domain from issuer
  getOktaDomain(): string {
    try {
      const url = new URL(this.config.issuer);
      return url.origin;
    } catch {
      return this.config.issuer;
    }
  }

  // Get stored code verifier for token exchange
  getStoredCodeVerifier(): string | null {
    return localStorage.getItem('okta_code_verifier');
  }

  // Clear stored PKCE data after token exchange
  clearPKCEData(): void {
    localStorage.removeItem('okta_code_verifier');
    localStorage.removeItem('okta_login_timestamp');
  }
}
