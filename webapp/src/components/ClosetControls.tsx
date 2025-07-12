import React from 'react';
import { useApp, useAppActions } from '../contexts/AppContext';
import { Search, Plus, Settings, Grid, List, Filter } from 'lucide-react';

export const ClosetControls: React.FC = () => {
  const { state } = useApp();
  const { setSearchQuery, toggleModal, setCurrentView } = useAppActions();

  return (
    <div className="absolute top-4 left-4 right-4 z-20">
      {/* Top Control Bar */}
      <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg shadow-lg p-4 border border-amber-200">
        <div className="flex items-center justify-between">
          {/* Left side - Search */}
          <div className="flex items-center space-x-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search your closet..."
                value={state.searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm bg-white"
              />
            </div>
          </div>

          {/* Center - Title */}
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-bold text-amber-900">My Digital Closet</h1>
            <p className="text-sm text-amber-700">{state.items.length} items</p>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-2 flex-1 justify-end">
            <button
              onClick={() => toggleModal('addItem', true)}
              className="flex items-center space-x-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Item</span>
            </button>
            
            <button
              onClick={() => setCurrentView(state.currentView === 'grid' ? 'list' : 'grid')}
              className="p-2 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
              title="Toggle view"
            >
              {state.currentView === 'grid' ? <List className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
            </button>
            
            <button
              className="p-2 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
              title="Filters"
            >
              <Filter className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => toggleModal('settings', true)}
              className="p-2 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="mt-2 bg-white bg-opacity-80 backdrop-blur-sm rounded-lg shadow-md p-3 border border-amber-200">
        <div className="flex justify-center space-x-8 text-sm">
          <div className="text-center">
            <div className="font-semibold text-amber-900">
              {state.items.filter(item => item.status === 'owned').length}
            </div>
            <div className="text-amber-700">Owned</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-amber-900">
              {state.items.filter(item => item.status === 'want').length}
            </div>
            <div className="text-amber-700">Wishlist</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-amber-900">
              {state.items.filter(item => item.status === 'purchased').length}
            </div>
            <div className="text-amber-700">Recent</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-amber-900">
              ${state.items.reduce((sum, item) => sum + (item.price || 0), 0).toFixed(0)}
            </div>
            <div className="text-amber-700">Total Value</div>
          </div>
        </div>
      </div>
    </div>
  );
};