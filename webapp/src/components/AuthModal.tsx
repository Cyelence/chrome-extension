import React, { useState } from 'react';
import { X, Eye, EyeOff, Mail, Lock, User, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

interface AuthModalProps {
  mode: 'login' | 'register' | 'forgotPassword';
  isOpen: boolean;
  onClose: () => void;
  onSwitchMode: (mode: 'login' | 'register' | 'forgotPassword') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ mode, isOpen, onClose, onSwitchMode }) => {
  const { login, register, forgotPassword, state } = useAuth();
  
  // Form states
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    displayName: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleGoogleSuccess = async (credentialResponse: any) => {
    console.log('Google login successful:', credentialResponse);
    // Handle successful login here
    if (credentialResponse.credential) {
      try {
        const googleUser = jwtDecode(credentialResponse.credential) as any;
        console.log('Decoded user info:', googleUser);
        alert(`Google OAuth is working! Welcome ${googleUser.name || googleUser.email}!`);
      } catch (error) {
        console.error('Error decoding JWT:', error);
        alert('Google OAuth is working! Check the console for details.');
      }
    }
    onClose();
  };

  const handleGoogleError = () => {
    console.log('Google login failed');
    alert('Google login failed. Please try again.');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (mode !== 'forgotPassword' && !formData.password) {
      newErrors.password = 'Password is required';
    } else if (mode !== 'forgotPassword' && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    if (mode === 'register') {
      if (!formData.username) {
        newErrors.username = 'Username is required';
      } else if (formData.username.length < 3) {
        newErrors.username = 'Username must be at least 3 characters long';
      } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
        newErrors.username = 'Username can only contain letters, numbers, and underscores';
      }

      if (!formData.displayName) {
        newErrors.displayName = 'Display name is required';
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      if (mode === 'login') {
        await login({
          email: formData.email,
          password: formData.password,
        });
      } else if (mode === 'register') {
        await register({
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          username: formData.username,
          displayName: formData.displayName,
        });
      } else if (mode === 'forgotPassword') {
        await forgotPassword(formData.email);
      }
      
      if (!state.error) {
        onClose();
        // Reset form
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
          username: '',
          displayName: '',
        });
      }
    } catch (error) {
      console.error('Auth error:', error);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'login': return 'Welcome back';
      case 'register': return 'Create your account';
      case 'forgotPassword': return 'Reset your password';
      default: return 'Authentication';
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'login': return 'Sign in to your digital closet';
      case 'register': return 'Join the community and start organizing your closet';
      case 'forgotPassword': return 'Enter your email to receive a password reset link';
      default: return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{getTitle()}</h2>
            <p className="text-sm text-gray-600 mt-1">{getDescription()}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Demo credentials hint for login */}
          {mode === 'login' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
              <p className="font-medium text-blue-900">Demo Credentials:</p>
              <p className="text-blue-700">Email: demo@example.com</p>
              <p className="text-blue-700">Password: password</p>
            </div>
          )}

          {/* Display Name (Register only) */}
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                    errors.displayName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Your full name"
                />
              </div>
              {errors.displayName && (
                <p className="mt-1 text-sm text-red-600">{errors.displayName}</p>
              )}
            </div>
          )}

          {/* Username (Register only) */}
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <UserPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                    errors.username ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Choose a username"
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username}</p>
              )}
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your email"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Password (not for forgot password) */}
          {mode !== 'forgotPassword' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>
          )}

          {/* Confirm Password (Register only) */}
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>
          )}

          {/* Error message */}
          {state.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{state.error}</p>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={state.isLoading}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {state.isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </span>
            ) : (
              <>
                {mode === 'login' && 'Sign In'}
                {mode === 'register' && 'Create Account'}
                {mode === 'forgotPassword' && 'Send Reset Link'}
              </>
            )}
          </button>

          {/* Google Sign-in Section (only for login and register) */}
          {mode !== 'forgotPassword' && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              {/* Google OAuth Login Button */}
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="outline"
                size="large"
                text={mode === 'register' ? 'signup_with' : 'signin_with'}
                shape="rectangular"
                width="100%"
              />
            </>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 pb-6 space-y-3">
          {mode === 'login' && (
            <>
              <div className="text-center">
                <button
                  onClick={() => onSwitchMode('forgotPassword')}
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Forgot your password?
                </button>
              </div>
              <div className="text-center">
                <span className="text-sm text-gray-600">Don't have an account? </span>
                <button
                  onClick={() => onSwitchMode('register')}
                  className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                >
                  Sign up
                </button>
              </div>
            </>
          )}

          {mode === 'register' && (
            <div className="text-center">
              <span className="text-sm text-gray-600">Already have an account? </span>
              <button
                onClick={() => onSwitchMode('login')}
                className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
              >
                Sign in
              </button>
            </div>
          )}

          {mode === 'forgotPassword' && (
            <div className="text-center">
              <span className="text-sm text-gray-600">Remember your password? </span>
              <button
                onClick={() => onSwitchMode('login')}
                className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
              >
                Sign in
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 