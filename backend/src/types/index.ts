import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';

// ================================
// Database Entity Types (mirrors Prisma schema)
// ================================

export interface User {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatar?: string;
  passwordHash?: string;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  googleId?: string;
  facebookId?: string;
  appleId?: string;
  bio?: string;
  birthDate?: Date;
  gender?: string;
  location?: string;
  website?: string;
  isPrivate: boolean;
  allowAnalytics: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  subscriptionTier: string;
  subscriptionExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
}

export interface SessionData {
  id: string;
  userId: string;
  token: string;
  refreshToken?: string;
  expiresAt: Date;
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Item {
  id: string;
  userId: string;
  name: string;
  brand?: string;
  description?: string;
  category: string;
  subcategory?: string;
  price?: number;
  originalPrice?: number;
  currency: string;
  sku?: string;
  size?: string;
  color?: string;
  material?: string;
  careInstructions?: string;
  status: string;
  purchaseDate?: Date;
  purchaseLocation?: string;
  images: string[];
  primaryImage?: string;
  originalUrl?: string;
  affiliateUrl?: string;
  tags: string[];
  notes?: string;
  isPublic: boolean;
  likes: number;
  views: number;
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date;
}

export interface Collection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PriceAlert {
  id: string;
  userId: string;
  itemId?: string;
  productUrl: string;
  targetPrice: number;
  currentPrice?: number;
  currency: string;
  isActive: boolean;
  isTriggered: boolean;
  triggeredAt?: Date;
  emailNotification: boolean;
  pushNotification: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastCheckedAt?: Date;
}

export interface UserAnalytics {
  id: string;
  userId: string;
  totalItems: number;
  totalValue: number;
  totalSpent: number;
  averageItemPrice: number;
  categoryBreakdown?: Record<string, unknown>;
  brandBreakdown?: Record<string, unknown>;
  colorBreakdown?: Record<string, unknown>;
  mostActiveMonth?: string;
  preferredBrands: string[];
  averageMonthlySpending: number;
  totalLogins: number;
  streak: number;
  longestStreak: number;
  lastCalculatedAt: Date;
  updatedAt: Date;
}

// ================================
// Core Types
// ================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
}

export interface ResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  category?: string;
  status?: string;
  brand?: string;
  color?: string;
  priceMin?: number;
  priceMax?: number;
  search?: string;
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
}

// ================================
// Authentication Types
// ================================

export interface AuthenticatedRequest extends Request {
  user?: UserJwtPayload;
  session?: SessionData;
}

export interface UserJwtPayload extends JwtPayload {
  userId: string;
  email: string;
  username?: string;
  role?: string;
  subscriptionTier?: string;
  sessionId?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
  deviceInfo?: DeviceInfo;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  acceptTerms: boolean;
}

export interface DeviceInfo {
  userAgent?: string;
  platform?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResult {
  user: SafeUser;
  tokens: TokenPair;
  isNewUser?: boolean;
}

// ================================
// User Types
// ================================

export interface SafeUser {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  isPrivate: boolean;
  subscriptionTier: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
  // Never include sensitive data like passwordHash
}

export interface UserProfile extends SafeUser {
  birthDate?: Date;
  gender?: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  allowAnalytics: boolean;
  followersCount?: number;
  followingCount?: number;
  itemsCount?: number;
  collectionsCount?: number;
}

export interface UserUpdateData {
  username?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  bio?: string;
  location?: string;
  website?: string;
  isPrivate?: boolean;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  allowAnalytics?: boolean;
}

export interface UserStats {
  totalItems: number;
  totalValue: number;
  totalSpent: number;
  averageItemPrice: number;
  categoryBreakdown: Record<string, number>;
  brandBreakdown: Record<string, number>;
  colorBreakdown: Record<string, number>;
  monthlySpending: Array<{ month: string; amount: number }>;
  mostActiveMonth?: string;
  preferredBrands: string[];
  averageMonthlySpending: number;
}

// ================================
// Item Types
// ================================

export interface ItemData {
  name: string;
  brand?: string;
  description?: string;
  category: string;
  subcategory?: string;
  price?: number;
  originalPrice?: number;
  currency?: string;
  sku?: string;
  size?: string;
  color?: string;
  material?: string;
  careInstructions?: string;
  status?: string;
  purchaseDate?: Date;
  purchaseLocation?: string;
  images?: string[];
  primaryImage?: string;
  originalUrl?: string;
  affiliateUrl?: string;
  tags?: string[];
  notes?: string;
  isPublic?: boolean;
}

export interface ItemUpdateData extends Partial<ItemData> {
  id: string;
}

export interface ItemWithRelations extends Item {
  user?: SafeUser;
  collectionItems?: Array<{
    collection: {
      id: string;
      name: string;
    };
  }>;
  priceAlerts?: PriceAlert[];
}

export interface ItemQueryParams extends PaginationParams, SortParams, FilterParams {
  userId?: string;
  includeArchived?: boolean;
  includePublic?: boolean;
}

export interface ItemAnalytics {
  totalItems: number;
  totalValue: number;
  averagePrice: number;
  categoryDistribution: Record<string, number>;
  statusDistribution: Record<string, number>;
  brandDistribution: Record<string, number>;
  colorDistribution: Record<string, number>;
  monthlyAdditions: Array<{ month: string; count: number }>;
  priceRanges: Array<{ range: string; count: number }>;
  topBrands: Array<{ brand: string; count: number; totalValue: number }>;
  recentItems: Item[];
}

// ================================
// Collection Types
// ================================

export interface CollectionData {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  isPublic?: boolean;
}

export interface CollectionWithItems extends Collection {
  items: Array<{
    id: string;
    itemId: string;
    order: number;
    notes?: string;
    item: Item;
  }>;
  itemCount?: number;
}

export interface CollectionQueryParams extends PaginationParams, SortParams {
  userId?: string;
  includePublic?: boolean;
}

// ================================
// Search Types
// ================================

export interface SearchParams {
  query: string;
  category?: string;
  brand?: string;
  color?: string;
  priceMin?: number;
  priceMax?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface SearchResult {
  items: ItemWithRelations[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  suggestions?: string[];
  facets?: {
    categories: Array<{ value: string; count: number }>;
    brands: Array<{ value: string; count: number }>;
    colors: Array<{ value: string; count: number }>;
    priceRanges: Array<{ range: string; count: number }>;
  };
}

// ================================
// Price Alert Types
// ================================

export interface PriceAlertData {
  productUrl: string;
  targetPrice: number;
  currency?: string;
  emailNotification?: boolean;
  pushNotification?: boolean;
  itemId?: string;
}

export interface PriceAlertWithItem extends PriceAlert {
  item?: Item;
}

// ================================
// Analytics Types
// ================================

export interface AnalyticsData {
  userStats: UserStats;
  itemAnalytics: ItemAnalytics;
  trends: {
    popularCategories: Array<{ category: string; count: number }>;
    trendingBrands: Array<{ brand: string; count: number }>;
    priceInsights: {
      averagePrice: number;
      priceDistribution: Record<string, number>;
      savings: number;
    };
  };
}

// ================================
// Configuration Types
// ================================

export interface AppConfig {
  server: {
    port: number;
    host: string;
    nodeEnv: string;
    apiPrefix: string;
  };
  database: {
    url: string;
  };
  auth: {
    jwtSecret: string;
    jwtExpiresIn: string;
    jwtRefreshExpiresIn: string;
    sessionSecret: string;
    bcryptRounds: number;
  };
  redis?: {
    url: string;
    password?: string;
    db: number;
  };
  email?: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    password: string;
  };
  storage?: {
    provider: 'aws' | 'cloudinary' | 'local';
    aws?: {
      accessKeyId: string;
      secretAccessKey: string;
      region: string;
      bucket: string;
    };
    cloudinary?: {
      cloudName: string;
      apiKey: string;
      apiSecret: string;
    };
  };
  features: {
    enableSwagger: boolean;
    enableAnalytics: boolean;
    enableCaching: boolean;
    enableCompression: boolean;
  };
  security: {
    rateLimitWindowMs: number;
    rateLimitMaxRequests: number;
    corsOrigins: string[];
  };
}

// ================================
// Utility Types
// ================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// ================================
// Error Types
// ================================

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: unknown;
}

export interface BusinessError extends Error {
  code: string;
  statusCode: number;
  details?: Record<string, unknown>;
  isOperational: boolean;
}

// ================================
// Event Types
// ================================

export interface AppEvent {
  type: string;
  userId?: string;
  data: Record<string, unknown>;
  timestamp: Date;
}

export interface UserEvent extends AppEvent {
  userId: string;
}

export interface ItemEvent extends UserEvent {
  itemId: string;
}

// ================================
// Job Types
// ================================

export interface JobData {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  priority?: number;
  delay?: number;
  attempts?: number;
  retryDelay?: number;
}

export interface PriceCheckJob extends JobData {
  type: 'price-check';
  payload: {
    priceAlertId: string;
    productUrl: string;
    targetPrice: number;
  };
}

export interface AnalyticsJob extends JobData {
  type: 'analytics-calculation';
  payload: {
    userId: string;
    force?: boolean;
  };
}

// ================================
// External API Types
// ================================

export interface ProductInfo {
  title: string;
  price?: number;
  originalPrice?: number;
  currency?: string;
  brand?: string;
  category?: string;
  images?: string[];
  description?: string;
  availability?: string;
  rating?: number;
  reviews?: number;
  sku?: string;
  url: string;
}

export interface ImageUploadResult {
  url: string;
  publicId?: string;
  width?: number;
  height?: number;
  format?: string;
  size?: number;
}

// ================================
// Webhook Types
// ================================

export interface WebhookEvent {
  id: string;
  type: string;
  data: Record<string, unknown>;
  timestamp: Date;
  signature?: string;
}

export interface PaymentWebhook extends WebhookEvent {
  type: 'payment.succeeded' | 'payment.failed' | 'subscription.updated';
  data: {
    userId: string;
    subscriptionTier: string;
    amount?: number;
    currency?: string;
  };
}

// ================================
// Export all types
// ================================

// Note: Prisma client types will be available after running `prisma generate`
// The types above mirror the Prisma schema and will be compatible with generated types 