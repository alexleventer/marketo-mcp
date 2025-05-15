# Marketo MCP Server

A Model Context Protocol server for interacting with the Marketo API. This server provides tools for managing Marketo forms, including listing, cloning, and approving forms.

[![smithery badge](https://smithery.ai/badge/@alexleventer/marketo-mcp)](https://smithery.ai/server/@alexleventer/marketo-mcp)

## Prerequisites

- Node.js (v14 or higher)
- Marketo API credentials (Client ID and Client Secret)
- A Marketo instance with API access enabled
- Claude Desktop installed

## Getting Started

### 1. Obtain Marketo API Credentials

1. Log into your Marketo admin panel
2. Navigate to **Admin** > **Integration** > **LaunchPoint**
3. Click **New** > **New Service**
4. Fill in the service details:
   - Service: Custom
   - Display Name: (e.g., "MCP Server")
5. Save the provided **Client ID** and **Client Secret**

### 2. Configure Environment Variables

1. Create a `.env` file in the root directory:

```env
# Your Marketo instance URL (required)
# Example: https://123-ABC-456.mktorest.com/rest
MARKETO_BASE_URL=your-marketo-instance-url

# Your API credentials (required)
MARKETO_CLIENT_ID=your-client-id
MARKETO_CLIENT_SECRET=your-client-secret
```

### 3. Installation and Setup

```bash
# Install dependencies
npm install

# Build the project
npm run build

# The build process will output configuration settings in your console
# Copy these settings into your Claude Desktop developer configuration
```

### 4. Claude Desktop Configuration

1. Open Claude Desktop
2. Go to Developer Settings
3. [Paste the configuration settings](https://modelcontextprotocol.io/quickstart/user#2-add-the-filesystem-mcp-server) that were output during the build process
4. Save the configuration
5. Restart Claude Desktop


## Available Tools

### Get Forms List
```typescript
marketo_get_forms({
  maxReturn: 200,  // optional, default: 200
  offset: 0,       // optional, default: 0
  status: 'draft'  // optional, 'draft' or 'approved'
})
```

### Get Form by ID
```typescript
marketo_get_form_by_id({
  formId: 1234
})
```

### Clone Form
```typescript
marketo_clone_form({
  formId: 1234,           // ID of form to clone
  name: "New Form Name",  // Name for the cloned form
  description: "Form description",  // optional
  folderId: 5678         // optional, destination folder ID
})
```

### Approve Form
```typescript
marketo_approve_form({
  formId: 1234,
  comment: "Approved by MCP server"  // optional
})
```

## Error Handling

Common error scenarios and solutions:

1. **Authentication Errors**
   - Verify your Client ID and Client Secret are correct
   - Check that your API access is enabled in Marketo
   - Ensure your instance URL is correct

2. **Permission Errors**
   - Verify your API user has sufficient permissions
   - Check folder access permissions for form operations

3. **Rate Limiting**
   - The server automatically handles token refresh
   - Consider implementing retry logic for rate-limited requests

## Best Practices

1. **Environment Management**
   - Never commit `.env` files to version control
   - Use different credentials for development and production
   - Regularly rotate your API credentials

2. **Security**
   - Store credentials securely
   - Use environment variables for sensitive data
   - Monitor API access logs

3. **Performance**
   - Cache form data when appropriate
   - Use pagination for large form lists
   - Handle rate limits appropriately

## Development

### Project Structure
```
├── src/
│   ├── index.ts        # Server entry point
│   ├── auth.ts         # Token management
│   └── constants.ts    # Configuration
├── .env                # Environment variables (not in git)
├── .env.example        # Example environment file
└── .gitignore         # Git ignore rules
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For issues and questions:
1. Check the [Marketo REST API documentation](https://developers.marketo.com/rest-api/)
2. Review common error scenarios above
3. Submit an issue in the repository 