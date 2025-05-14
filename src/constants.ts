// Base URL for Marketo API
export const MARKETO_BASE_URL = process.env.MARKETO_BASE_URL || 'https://259-IFZ-779.mktorest.com/rest';

// Marketo authentication credentials
export const MARKETO_CLIENT_ID = process.env.MARKETO_CLIENT_ID;
export const MARKETO_CLIENT_SECRET = process.env.MARKETO_CLIENT_SECRET;

if (!MARKETO_CLIENT_ID || !MARKETO_CLIENT_SECRET) {
  console.warn(`
WARNING: Missing Marketo credentials!
Please create a .env file with the following variables:
MARKETO_CLIENT_ID=your-client-id
MARKETO_CLIENT_SECRET=your-client-secret
MARKETO_BASE_URL=your-marketo-instance-url (optional)
`);
}
