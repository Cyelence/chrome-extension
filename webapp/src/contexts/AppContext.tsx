import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AppState, ClosetItem, Collection, FilterOptions, SectionType, ViewType } from '../types';

// Actions
type AppAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ITEMS'; payload: ClosetItem[] }
  | { type: 'ADD_ITEM'; payload: ClosetItem }
  | { type: 'UPDATE_ITEM'; payload: ClosetItem }
  | { type: 'DELETE_ITEM'; payload: string }
  | { type: 'SET_COLLECTIONS'; payload: Collection[] }
  | { type: 'ADD_COLLECTION'; payload: Collection }
  | { type: 'UPDATE_COLLECTION'; payload: Collection }
  | { type: 'DELETE_COLLECTION'; payload: string }
  | { type: 'SET_CURRENT_VIEW'; payload: ViewType }
  | { type: 'SET_CURRENT_SECTION'; payload: SectionType }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_FILTERS'; payload: FilterOptions }
  | { type: 'TOGGLE_MODAL'; payload: { modal: keyof AppState['modals']; isOpen: boolean } }
  | { type: 'SET_SELECTED_ITEMS'; payload: string[] }
  | { type: 'TOGGLE_FAVORITE'; payload: string };

// Initial state
const initialState: AppState = {
  user: null,
  items: [],
  collections: [],
  currentView: 'grid',
  currentSection: 'all',
  searchQuery: '',
  filters: {
    category: 'all',
    status: 'all',
    priceRange: { min: null, max: null },
    brands: [],
    colors: [],
    sizes: [],
    onSale: null,
    sortBy: 'dateAdded',
    sortOrder: 'desc',
  },
  selectedItems: [],
  isLoading: false,
  error: null,
  modals: {
    addItem: false,
    editItem: false,
    createCollection: false,
    shareCollection: false,
    settings: false,
  },
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_ITEMS':
      return { ...state, items: action.payload };
    
    case 'ADD_ITEM':
      return { ...state, items: [...state.items, action.payload] };
    
    case 'UPDATE_ITEM':
      return {
        ...state,
        items: state.items.map(item => 
          item.id === action.payload.id ? action.payload : item
        ),
      };
    
    case 'DELETE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload),
      };
    
    case 'SET_COLLECTIONS':
      return { ...state, collections: action.payload };
    
    case 'ADD_COLLECTION':
      return { ...state, collections: [...state.collections, action.payload] };
    
    case 'UPDATE_COLLECTION':
      return {
        ...state,
        collections: state.collections.map(collection => 
          collection.id === action.payload.id ? action.payload : collection
        ),
      };
    
    case 'DELETE_COLLECTION':
      return {
        ...state,
        collections: state.collections.filter(collection => collection.id !== action.payload),
      };
    
    case 'SET_CURRENT_VIEW':
      return { ...state, currentView: action.payload };
    
    case 'SET_CURRENT_SECTION':
      return { ...state, currentSection: action.payload };
    
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    
    case 'SET_FILTERS':
      return { ...state, filters: action.payload };
    
    case 'TOGGLE_MODAL':
      return {
        ...state,
        modals: {
          ...state.modals,
          [action.payload.modal]: action.payload.isOpen,
        },
      };
    
    case 'SET_SELECTED_ITEMS':
      return { ...state, selectedItems: action.payload };
    
    case 'TOGGLE_FAVORITE':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload
            ? { ...item, isFavorite: !item.isFavorite }
            : item
        ),
      };
    
    default:
      return state;
  }
}

// Context
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

// Provider
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load data on mount
  useEffect(() => {
    loadPersistedData();
  }, []);

  // Save data when state changes
  useEffect(() => {
    savePersistedData();
  }, [state.items, state.collections]);

  const loadPersistedData = () => {
    try {
      const savedItems = localStorage.getItem('digitalCloset_items');
      const savedCollections = localStorage.getItem('digitalCloset_collections');
      
      if (savedItems) {
        const items = JSON.parse(savedItems).map((item: any) => ({
          ...item,
          dateAdded: new Date(item.dateAdded),
          dateUpdated: new Date(item.dateUpdated),
        }));
        dispatch({ type: 'SET_ITEMS', payload: items });
      } else {
        // Load sample data
        const sampleItems = getSampleData();
        dispatch({ type: 'SET_ITEMS', payload: sampleItems });
      }

      if (savedCollections) {
        const collections = JSON.parse(savedCollections).map((collection: any) => ({
          ...collection,
          dateCreated: new Date(collection.dateCreated),
          dateUpdated: new Date(collection.dateUpdated),
        }));
        dispatch({ type: 'SET_COLLECTIONS', payload: collections });
      }
    } catch (error) {
      console.error('Error loading persisted data:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load saved data' });
    }
  };

  const savePersistedData = () => {
    try {
      localStorage.setItem('digitalCloset_items', JSON.stringify(state.items));
      localStorage.setItem('digitalCloset_collections', JSON.stringify(state.collections));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const getSampleData = (): ClosetItem[] => [
    {
      id: '1',
      title: 'Classic White Button Shirt',
      brand: 'Everlane',
      price: 68,
      originalPrice: 85,
      category: 'tops',
      status: 'owned',
      color: 'White',
      size: 'M',
      imageUrl: 'https://images.unsplash.com/photo-1583743814966-8936f37f3a21?w=400&h=300&fit=crop',
      originalLink: 'https://example.com/shirt',
      notes: 'Perfect for work and casual wear. Love the quality of the fabric.',
      tags: ['professional', 'versatile', 'cotton'],
      dateAdded: new Date('2024-01-15'),
      dateUpdated: new Date('2024-01-15'),
      isFavorite: true,
      isOnSale: true,
      priceDropNotification: false,
      collections: [],
      likes: 24,
      shares: 5,
      saves: 12,
      isPublic: true,
    },
    {
      id: '2',
      title: 'Leather Crossbody Bag',
      brand: 'Mansur Gavriel',
      price: 395,
      category: 'bags',
      status: 'want',
      color: 'Cognac',
      size: 'Small',
      imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop',
      originalLink: 'https://example.com/bag',
      notes: 'Would go perfect with fall outfits. Waiting for a sale!',
      tags: ['luxury', 'leather', 'crossbody'],
      dateAdded: new Date('2024-01-10'),
      dateUpdated: new Date('2024-01-10'),
      isFavorite: false,
      isOnSale: false,
      priceDropNotification: true,
      collections: [],
      likes: 18,
      shares: 3,
      saves: 8,
      isPublic: true,
    },
    {
      id: '3',
      title: 'High-Waisted Vintage Jeans',
      brand: 'Levi\'s',
      price: 89.5,
      category: 'bottoms',
      status: 'purchased',
      color: 'Dark Indigo',
      size: '28',
      imageUrl: 'https://images.unsplash.com/photo-1541840031508-326b77c9a17e?w=400&h=300&fit=crop',
      originalLink: 'https://example.com/jeans',
      notes: 'Just ordered, should arrive next week. Excited to try the fit!',
      tags: ['vintage', 'high-waisted', 'denim'],
      dateAdded: new Date('2024-01-12'),
      dateUpdated: new Date('2024-01-12'),
      isFavorite: false,
      isOnSale: false,
      priceDropNotification: false,
      collections: [],
      likes: 15,
      shares: 2,
      saves: 9,
      isPublic: true,
    },
    {
      id: '4',
      title: 'Cashmere Scarf',
      brand: 'Acne Studios',
      price: 240,
      category: 'accessories',
      status: 'want',
      color: 'Camel',
      size: 'One Size',
      imageUrl: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400&h=300&fit=crop',
      originalLink: 'https://example.com/scarf',
      notes: 'Investment piece for winter. Love the oversized style.',
      tags: ['cashmere', 'luxury', 'winter'],
      dateAdded: new Date('2024-01-08'),
      dateUpdated: new Date('2024-01-08'),
      isFavorite: true,
      isOnSale: false,
      priceDropNotification: true,
      collections: [],
      likes: 31,
      shares: 7,
      saves: 16,
      isPublic: true,
    },
  ];

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// Hook to use the context
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// Helper functions for common actions
export const useAppActions = () => {
  const { dispatch } = useApp();

  return {
    setLoading: (loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading }),
    setError: (error: string | null) => dispatch({ type: 'SET_ERROR', payload: error }),
    addItem: (item: ClosetItem) => dispatch({ type: 'ADD_ITEM', payload: item }),
    updateItem: (item: ClosetItem) => dispatch({ type: 'UPDATE_ITEM', payload: item }),
    deleteItem: (id: string) => dispatch({ type: 'DELETE_ITEM', payload: id }),
    setCurrentView: (view: ViewType) => dispatch({ type: 'SET_CURRENT_VIEW', payload: view }),
    setCurrentSection: (section: SectionType) => dispatch({ type: 'SET_CURRENT_SECTION', payload: section }),
    setSearchQuery: (query: string) => dispatch({ type: 'SET_SEARCH_QUERY', payload: query }),
    setFilters: (filters: FilterOptions) => dispatch({ type: 'SET_FILTERS', payload: filters }),
    toggleModal: (modal: keyof AppState['modals'], isOpen: boolean) => 
      dispatch({ type: 'TOGGLE_MODAL', payload: { modal, isOpen } }),
    toggleFavorite: (id: string) => dispatch({ type: 'TOGGLE_FAVORITE', payload: id }),
  };
}; 