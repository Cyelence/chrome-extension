import React, { useState } from 'react';
import { AppProvider, useApp, useAppActions } from './contexts/AppContext';
import { useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { Toaster } from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { Share, MoreHorizontal, Filter, LogIn, LogOut, User, Settings } from 'lucide-react';
import './styles/globals.css';

// Main App Content Component
function AppContent() {
  const { state } = useApp();
  const { state: authState, logout } = useAuth();
  const { toggleModal } = useAppActions();
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgotPassword'>('login');

  // Handle Google OAuth success
  const handleGoogleSuccess = async (credentialResponse: any) => {
    console.log('Google login successful:', credentialResponse);
    
    if (credentialResponse.credential) {
      try {
        // Simulate API call to authenticate with backend
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Decode the JWT token to get user info using jwt-decode library
        const googleUser = jwtDecode(credentialResponse.credential) as any;
        if (googleUser) {
          console.log('User info:', googleUser);
          // You can now use this user info to create a session
          // For now, we'll just show a success message
          alert(`Welcome ${googleUser.name}! Google OAuth is working.`);
        }
      } catch (error) {
        console.error('Error processing Google login:', error);
        alert('Google login failed. Please try again.');
      }
    }
  };

  const handleGoogleError = () => {
    console.log('Google login failed');
    alert('Google login failed. Please try again.');
  };

  const handleLogout = () => {
    logout();
  };

  const handleAuthModalClose = () => {
    toggleModal('login', false);
    toggleModal('register', false);
    toggleModal('forgotPassword', false);
  };

  const handleAuthModeSwitch = (mode: 'login' | 'register' | 'forgotPassword') => {
    setAuthMode(mode);
    toggleModal('login', mode === 'login');
    toggleModal('register', mode === 'register');
    toggleModal('forgotPassword', mode === 'forgotPassword');
  };

  // Show authentication required message if not logged in
  if (!authState.isAuthenticated) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-32 h-32 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <User className="w-16 h-16 text-indigo-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Digital Closet</h1>
            <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
              Organize your wardrobe, track your purchases, and discover new styles.
            </p>
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => handleAuthModeSwitch('login')}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                >
                  <LogIn className="w-5 h-5 inline mr-2" />
                  Sign In
                </button>
                <button
                  onClick={() => handleAuthModeSwitch('register')}
                  className="px-8 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                >
                  Create Account
                </button>
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="w-full max-w-sm mx-auto">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="outline"
                  size="large"
                  text="continue_with"
                  shape="rectangular"
                  width="100%"
                />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const user = authState.user;
  if (!user) return null;

  return (
    <Layout>
      {/* Profile Section */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-6">
          <img
            src={user.avatar}
            alt={user.displayName}
            className="w-20 h-20 rounded-full object-cover border-4 border-gray-200"
          />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{user.displayName}</h1>
            <p className="text-gray-500">@{user.username}</p>
            <div className="flex space-x-6 mt-2">
              <button className="text-sm font-medium text-gray-900 hover:underline">
                {user.followers} Followers
              </button>
              <button className="text-sm font-medium text-gray-900 hover:underline">
                {user.following} Following
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => toggleModal('profile', true)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Settings className="w-4 h-4 inline mr-2" />
            Profile
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            <LogOut className="w-4 h-4 inline mr-2" />
            Logout
          </button>
        </div>
      </div>

      {/* Collections Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Collections</h2>
          <button className="text-sm font-medium text-gray-600 hover:text-gray-900">
            View All
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {state.collections.length > 0 ? (
            state.collections.map((collection) => (
              <div key={collection.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <span className="text-4xl">👗</span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900">{collection.name}</h3>
                  <p className="text-sm text-gray-500">{collection.items.length} items</p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">No collections yet. Create your first collection!</p>
            </div>
          )}
        </div>
      </div>

      {/* All Saved Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">All Saved</h2>
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="w-4 h-4" />
              <span className="text-sm">Filter by brand</span>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {state.items.length > 0 ? (
            state.items.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-gray-900 text-sm">{item.title}</h3>
                  <p className="text-xs text-gray-500">{item.brand}</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">${item.price}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">No items yet. Start adding items to your closet!</p>
            </div>
          )}
        </div>
      </div>

      {/* Auth Modals */}
      <AuthModal
        mode={authMode}
        isOpen={state.modals.login || state.modals.register || state.modals.forgotPassword}
        onClose={handleAuthModalClose}
        onSwitchMode={handleAuthModeSwitch}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={state.modals.profile}
        onClose={() => toggleModal('profile', false)}
      />
    </Layout>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
      <Toaster position="top-right" />
    </AppProvider>
  );
}

export default App; 