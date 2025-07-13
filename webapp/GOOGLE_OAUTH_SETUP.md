# Google OAuth Setup Guide

This guide will help you set up Google Sign-In for the Digital Closet application.

## Prerequisites

- A Google account
- Access to Google Cloud Console

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" at the top
3. Click "New Project" 
4. Enter a project name (e.g., "Digital Closet")
5. Click "Create"

## Step 2: Enable Google Identity Services

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google Identity"
3. Click on "Google Identity Services API" 
4. Click "Enable"

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Select "External" user type (unless you have a Google Workspace account)
3. Click "Create"
4. Fill in the required fields:
   - App name: "Digital Closet"
   - User support email: Your email
   - Developer contact information: Your email
5. Click "Save and Continue"
6. Skip the "Scopes" step for now
7. Add test users if needed (for development)
8. Click "Save and Continue"

## Step 4: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Select "Web application" as the application type
4. Enter a name (e.g., "Digital Closet Web Client")
5. Add authorized origins:
   - For development: `http://localhost:3000`
   - For production: Your domain (e.g., `https://yourapp.com`)
6. Leave "Authorized redirect URIs" empty (not needed for Google Identity Services)
7. Click "Create"
8. Copy the Client ID (it will look like: `123456789-abc123.apps.googleusercontent.com`)

## Step 5: Configure the Application

1. Create a `.env.local` file in the `webapp` directory (if it doesn't exist)
2. Add your Google Client ID:

```bash
REACT_APP_GOOGLE_CLIENT_ID=your-actual-client-id-here.apps.googleusercontent.com
```

3. Replace `your-actual-client-id-here` with the Client ID you copied from Google Cloud Console

## Step 6: Test the Integration

1. Start your development server:
   ```bash
   npm start
   ```

2. Open the application in your browser
3. Try signing in with Google
4. You should see the Google sign-in popup

## Troubleshooting

### Common Issues

1. **"Invalid origin" error**: Make sure your domain is added to authorized origins in Google Cloud Console

2. **"Client ID not found" error**: Verify your Client ID is correctly set in the `.env.local` file

3. **Google button not appearing**: Check the browser console for JavaScript errors and ensure the Google Identity Services script is loading

### Development vs Production

- **Development**: Use `http://localhost:3000` as authorized origin
- **Production**: Use your actual domain (must be HTTPS)

### Security Notes

- Never commit your `.env.local` file to version control
- The Client ID is safe to expose publicly (it's meant to be public)
- Only the domains you specify in authorized origins can use this Client ID

## Environment Variables

Create a `.env.local` file in the `webapp` directory with:

```bash
# Google OAuth Configuration
REACT_APP_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
```

## Additional Resources

- [Google Identity Services Documentation](https://developers.google.com/identity/gsi/web)
- [Google Cloud Console](https://console.cloud.google.com/)
- [OAuth 2.0 Scopes](https://developers.google.com/identity/protocols/oauth2/scopes) 