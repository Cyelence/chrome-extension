// Core types for the Digital Closet app
export interface ClosetItem {
  id: string;
  title: string;
  brand: string;
  price: number;
  originalPrice?: number;
  category: ItemCategory;
  status: ItemStatus;
  color: string;
  size: string;
  imageUrl: string;
  originalLink: string;
  notes: string;
  tags: string[];
  dateAdded: Date;
  dateUpdated: Date;
  isFavorite: boolean;
  isOnSale: boolean;
  priceDropNotification: boolean;
  // Collection metadata
  collections: string[];
  // Social features
  likes: number;
  shares: number;
  saves: number;
  isPublic: boolean;
}

export type ItemCategory = 
  | 'tops'
  | 'bottoms'
  | 'outerwear'
  | 'dresses'
  | 'shoes'
  | 'accessories'
  | 'jewelry'
  | 'bags'
  | 'beauty'
  | 'home'
  | 'other';

export type ItemStatus = 
  | 'want'
  | 'purchased'
  | 'owned'
  | 'gifted'
  | 'returned';

export interface Collection {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  items: string[]; // Array of item IDs
  isPublic: boolean;
  isCollaborative: boolean;
  collaborators: string[];
  dateCreated: Date;
  dateUpdated: Date;
  tags: string[];
  // Social metrics
  likes: number;
  shares: number;
  saves: number;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatar?: string;
  bio?: string;
  isPrivate: boolean;
  // Statistics
  totalItems: number;
  totalValue: number;
  totalCollections: number;
  // Social
  followers: number;
  following: number;
  // Preferences
  preferredCurrency: string;
  notifications: NotificationSettings;
  // Authentication
  isEmailVerified: boolean;
  dateCreated: Date;
  lastLogin: Date;
}

export interface NotificationSettings {
  priceDrops: boolean;
  newFollowers: boolean;
  collectionShares: boolean;
  weeklyDigest: boolean;
  salesAlerts: boolean;
}

export interface FilterOptions {
  category: ItemCategory | 'all';
  status: ItemStatus | 'all';
  priceRange: {
    min: number | null;
    max: number | null;
  };
  brands: string[];
  colors: string[];
  sizes: string[];
  onSale: boolean | null;
  sortBy: SortOption;
  sortOrder: 'asc' | 'desc';
}

export type SortOption = 
  | 'dateAdded'
  | 'dateUpdated'
  | 'price'
  | 'brand'
  | 'category'
  | 'status'
  | 'likes'
  | 'popularity';

export interface SearchFilters {
  query: string;
  category: ItemCategory | 'all';
  status: ItemStatus | 'all';
  priceRange: {
    min: number | null;
    max: number | null;
  };
  brands: string[];
  tags: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}

export interface PriceAlert {
  id: string;
  itemId: string;
  targetPrice: number;
  isActive: boolean;
  dateCreated: Date;
  lastChecked: Date;
  notificationSent: boolean;
}

export interface ShoppingSession {
  id: string;
  userId: string;
  items: string[];
  totalValue: number;
  dateStarted: Date;
  dateCompleted?: Date;
  notes?: string;
  isCompleted: boolean;
}

// UI State types
export interface AppState {
  user: User | null;
  items: ClosetItem[];
  collections: Collection[];
  currentView: ViewType;
  currentSection: SectionType;
  searchQuery: string;
  filters: FilterOptions;
  selectedItems: string[];
  // UI state
  isLoading: boolean;
  error: string | null;
  modals: {
    addItem: boolean;
    editItem: boolean;
    createCollection: boolean;
    shareCollection: boolean;
    settings: boolean;
    login: boolean;
    register: boolean;
    profile: boolean;
    forgotPassword: boolean;
  };
}

export type ViewType = 'grid' | 'list' | 'board';

export type SectionType = 
  | 'all'
  | 'wishlist'
  | 'purchased'
  | 'owned'
  | 'collections'
  | 'trending'
  | 'following'
  | 'favorites';

// API Response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Component prop types
export interface ItemCardProps {
  item: ClosetItem;
  onEdit: (item: ClosetItem) => void;
  onDelete: (itemId: string) => void;
  onToggleFavorite: (itemId: string) => void;
  onAddToCollection: (itemId: string) => void;
  showActions?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export interface CollectionCardProps {
  collection: Collection;
  onEdit: (collection: Collection) => void;
  onDelete: (collectionId: string) => void;
  onShare: (collectionId: string) => void;
  showActions?: boolean;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: any;
}

// Event types
export interface ItemAddedEvent {
  item: ClosetItem;
  source: 'manual' | 'extension' | 'import';
}

export interface CollectionUpdatedEvent {
  collection: Collection;
  action: 'created' | 'updated' | 'deleted';
}

export interface PriceDropEvent {
  item: ClosetItem;
  oldPrice: number;
  newPrice: number;
  percentageDiscount: number;
}

// Extension integration types
export interface ExtensionMessage {
  type: 'ADD_ITEM' | 'OPEN_WEBAPP' | 'SYNC_DATA';
  payload: any;
}

export interface ProductData {
  title: string;
  brand: string;
  price: number;
  imageUrl: string;
  productUrl: string;
  description?: string;
  category?: ItemCategory;
  color?: string;
  size?: string;
  availability?: string;
}

// Authentication types
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  token: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthContextType {
  state: AuthState;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

export interface ProfileUpdateData {
  displayName?: string;
  bio?: string;
  avatar?: string;
  isPrivate?: boolean;
  preferredCurrency?: string;
  notifications?: NotificationSettings;
}

export interface UserProfile {
  user: User;
  stats: {
    totalItems: number;
    totalValue: number;
    totalCollections: number;
    recentlyAdded: ClosetItem[];
    topBrands: { brand: string; count: number }[];
    categoryBreakdown: { category: ItemCategory; count: number }[];
  };
  social: {
    followers: User[];
    following: User[];
    isFollowing: boolean;
    isFollowedBy: boolean;
  };
}