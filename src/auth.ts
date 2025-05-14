import axios from 'axios';
import { MARKETO_BASE_URL } from './constants.js';

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

class TokenManager {
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  async getToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      // Extract the identity URL from the base URL
      // Convert from https://instance.mktorest.com/rest to https://instance.mktorest.com/identity
      const identityUrl = MARKETO_BASE_URL.replace('/rest', '/identity');
      
      const response = await axios.get(`${identityUrl}/oauth/token`, {
        params: {
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret
        }
      });

      const data = response.data as TokenResponse;
      this.accessToken = data.access_token;
      // Set expiry to slightly before the actual expiry to ensure we don't use an expired token
      this.tokenExpiry = Date.now() + ((data.expires_in - 60) * 1000);

      return this.accessToken;
    } catch (error: any) {
      console.error('Failed to get Marketo access token:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with Marketo');
    }
  }
}

export { TokenManager }; 