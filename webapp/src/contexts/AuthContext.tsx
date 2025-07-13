import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AuthState, AuthContextType, LoginCredentials, RegisterData, User, ProfileUpdateData } from '../types';
import { GoogleCredentialResponse, GoogleUser } from '../types/google';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-hot-toast';

// Auth Actions
type AuthAction = 
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_PROFILE'; payload: User }
  | { type: 'CLEAR_ERROR' };

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  token: null,
};

// Auth reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true, error: null };
    
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    
    case 'UPDATE_PROFILE':
      return {
        ...state,
        user: action.payload,
        isLoading: false,
        error: null,
      };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    default:
      return state;
  }
}

// Create context
const AuthContext = createContext<AuthContextType | null>(null);

// Mock API functions (replace with real API calls)
const mockAPI = {
  login: async (credentials: LoginCredentials) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (credentials.email === 'demo@example.com' && credentials.password === 'password') {
      const user: User = {
        id: '1',
        username: 'demo_user',
        displayName: 'Demo User',
        email: credentials.email,
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        bio: 'Welcome to my digital closet!',
        isPrivate: false,
        totalItems: 0,
        totalValue: 0,
        totalCollections: 0,
        followers: 0,
        following: 0,
        preferredCurrency: 'USD',
        notifications: {
          priceDrops: true,
          newFollowers: true,
          collectionShares: true,
          weeklyDigest: true,
          salesAlerts: true,
        },
        isEmailVerified: true,
        dateCreated: new Date(),
        lastLogin: new Date(),
      };
      return { user, token: 'mock-jwt-token' };
    }
    throw new Error('Invalid credentials');
  },

  register: async (data: RegisterData) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (data.password !== data.confirmPassword) {
      throw new Error('Passwords do not match');
    }
    
    const user: User = {
      id: Date.now().toString(),
      username: data.username,
      displayName: data.displayName,
      email: data.email,
      avatar: `https://ui-avatars.com/api/?name=${data.displayName}&size=150&background=6366f1&color=fff`,
      bio: '',
      isPrivate: false,
      totalItems: 0,
      totalValue: 0,
      totalCollections: 0,
      followers: 0,
      following: 0,
      preferredCurrency: 'USD',
      notifications: {
        priceDrops: true,
        newFollowers: true,
        collectionShares: true,
        weeklyDigest: true,
        salesAlerts: true,
      },
      isEmailVerified: false,
      dateCreated: new Date(),
      lastLogin: new Date(),
    };
    return { user, token: 'mock-jwt-token' };
  },

  updateProfile: async (updates: ProfileUpdateData) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return updates;
  },

  forgotPassword: async (email: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Password reset email sent to:', email);
  },

  resetPassword: async (token: string, newPassword: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Password reset with token:', token);
  },

  verifyEmail: async (token: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Email verified with token:', token);
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Password changed');
  },

  loginWithGoogle: async (credential: string) => {
    // Simulate API call - decode the Google credential
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Decode JWT using jwt-decode library
    const googleUser: GoogleUser = jwtDecode(credential) as GoogleUser;
    if (!googleUser) {
      throw new Error('Invalid Google credential');
    }

    // Map Google user to our User type
    const user: User = {
      id: googleUser.sub,
      username: googleUser.email.split('@')[0], // Use email prefix as username
      displayName: googleUser.name,
      email: googleUser.email,
      avatar: googleUser.picture,
      bio: '',
      isPrivate: false,
      totalItems: 0,
      totalValue: 0,
      totalCollections: 0,
      followers: 0,
      following: 0,
      preferredCurrency: 'USD',
      notifications: {
        priceDrops: true,
        newFollowers: true,
        collectionShares: true,
        weeklyDigest: true,
        salesAlerts: true,
      },
      isEmailVerified: googleUser.email_verified,
      dateCreated: new Date(),
      lastLogin: new Date(),
    };

    return { user, token: 'google-oauth-token' };
  },
};

// Auth Provider
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Google OAuth methods
  const handleGoogleCallback = async (response: GoogleCredentialResponse) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const result = await mockAPI.loginWithGoogle(response.credential);
      dispatch({ type: 'AUTH_SUCCESS', payload: result });
      toast.success('Welcome! Signed in with Google');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Google sign-in failed';
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      toast.error(message);
    }
  };

  const loginWithGoogle = async () => {
    // This function will be called by the GoogleLogin component
    // The actual Google login will be handled by the @react-oauth/google package
    toast.success('Please use the Google sign-in button');
  };

  // Load persisted auth state on mount
  useEffect(() => {
    const token = localStorage.getItem('digitalCloset_token');
    const userData = localStorage.getItem('digitalCloset_user');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
      } catch (error) {
        console.error('Error loading auth state:', error);
        localStorage.removeItem('digitalCloset_token');
        localStorage.removeItem('digitalCloset_user');
      }
    }

    // Google OAuth will be handled by the @react-oauth/google package
  }, []);

  // Persist auth state
  useEffect(() => {
    if (state.user && state.token) {
      localStorage.setItem('digitalCloset_token', state.token);
      localStorage.setItem('digitalCloset_user', JSON.stringify(state.user));
    } else {
      localStorage.removeItem('digitalCloset_token');
      localStorage.removeItem('digitalCloset_user');
    }
  }, [state.user, state.token]);

  const login = async (credentials: LoginCredentials) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const result = await mockAPI.login(credentials);
      dispatch({ type: 'AUTH_SUCCESS', payload: result });
      toast.success('Welcome back!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      toast.error(message);
    }
  };

  const register = async (data: RegisterData) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const result = await mockAPI.register(data);
      dispatch({ type: 'AUTH_SUCCESS', payload: result });
      toast.success('Account created successfully!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      toast.error(message);
    }
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
    toast.success('Logged out successfully');
  };

  const updateProfile = async (updates: ProfileUpdateData) => {
    if (!state.user) return;
    
    dispatch({ type: 'AUTH_START' });
    try {
      await mockAPI.updateProfile(updates);
      const updatedUser = { ...state.user, ...updates };
      dispatch({ type: 'UPDATE_PROFILE', payload: updatedUser });
      toast.success('Profile updated successfully!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Profile update failed';
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      toast.error(message);
    }
  };

  const forgotPassword = async (email: string) => {
    dispatch({ type: 'AUTH_START' });
    try {
      await mockAPI.forgotPassword(email);
      dispatch({ type: 'CLEAR_ERROR' });
      toast.success('Password reset email sent!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send reset email';
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      toast.error(message);
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    dispatch({ type: 'AUTH_START' });
    try {
      await mockAPI.resetPassword(token, newPassword);
      dispatch({ type: 'CLEAR_ERROR' });
      toast.success('Password reset successfully!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Password reset failed';
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      toast.error(message);
    }
  };

  const verifyEmail = async (token: string) => {
    dispatch({ type: 'AUTH_START' });
    try {
      await mockAPI.verifyEmail(token);
      if (state.user) {
        const updatedUser = { ...state.user, isEmailVerified: true };
        dispatch({ type: 'UPDATE_PROFILE', payload: updatedUser });
      }
      toast.success('Email verified successfully!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Email verification failed';
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      toast.error(message);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    dispatch({ type: 'AUTH_START' });
    try {
      await mockAPI.changePassword(currentPassword, newPassword);
      dispatch({ type: 'CLEAR_ERROR' });
      toast.success('Password changed successfully!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Password change failed';
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      toast.error(message);
    }
  };

  const value: AuthContextType = {
    state,
    login,
    register,
    loginWithGoogle,
    logout,
    updateProfile,
    forgotPassword,
    resetPassword,
    verifyEmail,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 