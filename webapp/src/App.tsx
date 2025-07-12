import React from 'react';
import { AppProvider } from './contexts/AppContext';
import { Layout } from './components/Layout';
import { Toaster } from 'react-hot-toast';
import { Share, MoreHorizontal, Filter } from 'lucide-react';
import './styles/globals.css';

function App() {
  return (
    <AppProvider>
      <Layout>
        {/* Profile Section */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-600">K</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Kirsten</h1>
              <p className="text-gray-500">@kirstenho</p>
              <div className="flex space-x-6 mt-2">
                <button className="text-sm font-medium text-gray-900 hover:underline">
                  Followers
                </button>
                <button className="text-sm font-medium text-gray-900 hover:underline">
                  Following
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              Share
            </button>
            <button className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
              Unfollow
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <MoreHorizontal className="w-5 h-5" />
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
            <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <span className="text-4xl">👗</span>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900">clothes</h3>
                <p className="text-sm text-gray-500">2mo</p>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <span className="text-4xl">👠</span>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900">shoes</h3>
                <p className="text-sm text-gray-500">1mo</p>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <span className="text-4xl">👜</span>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900">accessories</h3>
                <p className="text-sm text-gray-500">3w</p>
              </div>
            </div>
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
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div key={item} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <span className="text-2xl">👕</span>
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-gray-900 text-sm">Item {item}</h3>
                  <p className="text-xs text-gray-500">Brand Name</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">$99</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
      <Toaster position="top-right" />
    </AppProvider>
  );
}

export default App; 