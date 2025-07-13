// Google OAuth Configuration

// Note: In production, you should get this from environment variables
// For demo purposes, using a placeholder - you'll need to replace this with your actual Google OAuth client ID
export const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || 'your-google-client-id-here.apps.googleusercontent.com';

export const GOOGLE_CONFIG = {
  client_id: GOOGLE_CLIENT_ID,
  auto_select: false,
  cancel_on_tap_outside: true,
  context: 'signin' as const,
};

export const GOOGLE_BUTTON_CONFIG = {
  type: 'standard' as const,
  theme: 'outline' as const,
  size: 'large' as const,
  text: 'signin_with' as const,
  shape: 'rectangular' as const,
  logo_alignment: 'left' as const,
  width: '100%',
};

// Helper function to decode JWT token
export function decodeJWT(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

// Check if Google Identity Services is loaded
export function isGoogleLoaded(): boolean {
  return typeof window !== 'undefined' && 
         !!window.google && 
         !!window.google.accounts && 
         !!window.google.accounts.id;
}

// Wait for Google Identity Services to load
export function waitForGoogleLoad(): Promise<void> {
  return new Promise((resolve) => {
    if (isGoogleLoaded()) {
      resolve();
      return;
    }

    const checkInterval = setInterval(() => {
      if (isGoogleLoaded()) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 100);

    // Timeout after 10 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      resolve();
    }, 10000);
  });
} 