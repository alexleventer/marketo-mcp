import axios from 'axios';
import { MARKETO_BASE_URL } from '../constants.js';
import { TokenManager } from '../auth.js';

const tokenManager = new TokenManager(
  process.env.MARKETO_CLIENT_ID!,
  process.env.MARKETO_CLIENT_SECRET!
);

// Helper function to make API requests with authentication
export async function makeApiRequest(
  endpoint: string,
  method: string,
  data?: any,
  contentType: string = 'application/json'
) {
  const token = await tokenManager.getToken();
  const headers: any = {
    Authorization: `Bearer ${token}`,
  };

  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  try {
    const response = await axios({
      url: `${MARKETO_BASE_URL}${endpoint}`,
      method: method,
      data:
        contentType === 'application/x-www-form-urlencoded'
          ? new URLSearchParams(data).toString()
          : data,
      headers,
    });
    return response.data;
  } catch (error: any) {
    console.error('API request failed:', error.response?.data || error.message);
    throw error;
  }
} 