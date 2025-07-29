// Digital Closet API Service
class ApiService {
    constructor() {
        this.baseURL = 'http://localhost:8080/api/v1';
        this.authToken = null;
        this.initialized = false;
        this.initPromise = this.init();
    }
    
    async init() {
        // Load auth token from storage
        try {
            const result = await chrome.storage.local.get(['authToken']);
            this.authToken = result.authToken;
            if (this.authToken) {
                console.log('🔑 Auth token loaded from storage');
            }
        } catch (error) {
            console.log('No auth token found');
        }
        this.initialized = true;
    }
    
    // Ensure initialization is complete before any operation
    async ensureInitialized() {
        if (!this.initialized) {
            await this.initPromise;
        }
    }
    
    // Helper method to get headers
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };
        
        if (this.authToken) {
            headers.Authorization = `Bearer ${this.authToken}`;
        }
        
        return headers;
    }
    
    // Helper method to make API calls
    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getHeaders(),
            ...options,
        };
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error(`API request failed for ${endpoint}:`, error);
            throw error;
        }
    }
    
    // Auth methods
    async login(email, password) {
        await this.ensureInitialized();
        const data = await this.makeRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        
        if (data.token) {
            this.authToken = data.token;
            await chrome.storage.local.set({ authToken: this.authToken });
            console.log('🔑 Auth token saved to storage');
        }
        
        return data;
    }
    
    async register(email, password, fullName) {
        await this.ensureInitialized();
        const data = await this.makeRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, fullName }),
        });
        
        if (data.token) {
            this.authToken = data.token;
            await chrome.storage.local.set({ authToken: this.authToken });
            console.log('🔑 Auth token saved to storage');
        }
        
        return data;
    }
    
    async logout() {
        await this.ensureInitialized();
        try {
            await this.makeRequest('/auth/logout', { method: 'POST' });
        } catch (error) {
            // Continue with local logout even if API call fails
            console.log('Logout API call failed, continuing with local logout');
        }
        
        this.authToken = null;
        await chrome.storage.local.remove(['authToken']);
        console.log('🔑 Auth token removed from storage');
    }
    
    async getProfile() {
        return await this.makeRequest('/auth/profile');
    }
    
    // Item methods
    async getItems() {
        return await this.makeRequest('/items');
    }
    
    async createItem(itemData) {
        // Transform extension data format to API format
        const apiData = this.transformItemToAPI(itemData);
        return await this.makeRequest('/items', {
            method: 'POST',
            body: JSON.stringify(apiData),
        });
    }
    
    async updateItem(itemId, itemData) {
        const apiData = this.transformItemToAPI(itemData);
        return await this.makeRequest(`/items/${itemId}`, {
            method: 'PUT',
            body: JSON.stringify(apiData),
        });
    }
    
    async deleteItem(itemId) {
        return await this.makeRequest(`/items/${itemId}`, {
            method: 'DELETE',
        });
    }
    
    async searchItems(query) {
        return await this.makeRequest(`/items/search?q=${encodeURIComponent(query)}`);
    }
    
    // Collection methods
    async getCollections() {
        return await this.makeRequest('/collections');
    }
    
    async createCollection(collectionData) {
        return await this.makeRequest('/collections', {
            method: 'POST',
            body: JSON.stringify(collectionData),
        });
    }
    
    async updateCollection(collectionId, collectionData) {
        return await this.makeRequest(`/collections/${collectionId}`, {
            method: 'PUT',
            body: JSON.stringify(collectionData),
        });
    }
    
    async deleteCollection(collectionId) {
        return await this.makeRequest(`/collections/${collectionId}`, {
            method: 'DELETE',
        });
    }
    
    // Analytics methods
    async getAnalytics() {
        return await this.makeRequest('/analytics/overview');
    }
    
    // Data transformation methods
    transformItemToAPI(extensionItem) {
        return {
            name: extensionItem.title,
            brand: extensionItem.brand || null,
            description: extensionItem.notes || null,
            category: extensionItem.category || 'other',
            price: extensionItem.price ? parseFloat(extensionItem.price) : null,
            size: extensionItem.size || null,
            color: extensionItem.color || null,
            status: extensionItem.status || 'want',
            purchaseDate: extensionItem.datePurchased ? new Date(extensionItem.datePurchased) : null,
            primaryImage: extensionItem.imageUrl || null,
            originalUrl: extensionItem.originalUrl || null,
            images: extensionItem.imageUrl ? [extensionItem.imageUrl] : [],
            tags: []
        };
    }
    
    transformItemFromAPI(apiItem) {
        return {
            id: apiItem.id,
            title: apiItem.name,
            brand: apiItem.brand || '',
            price: apiItem.price ? apiItem.price.toString() : '',
            category: apiItem.category || 'other',
            size: apiItem.size || '',
            color: apiItem.color || '',
            status: apiItem.status || 'want',
            imageUrl: apiItem.primaryImage || (apiItem.images && apiItem.images.length > 0 ? apiItem.images[0] : ''),
            originalUrl: apiItem.originalUrl || '',
            notes: apiItem.description || '',
            dateAdded: apiItem.createdAt,
            datePurchased: apiItem.purchaseDate,
            source: this.extractDomainFromUrl(apiItem.originalUrl)
        };
    }
    
    extractDomainFromUrl(url) {
        if (!url) return 'manual';
        try {
            const domain = new URL(url).hostname;
            return domain.replace('www.', '');
        } catch {
            return 'manual';
        }
    }
    
    // Utility method to check if user is authenticated
    async isAuthenticated() {
        await this.ensureInitialized();
        return !!this.authToken;
    }
    
    // Synchronous version for quick checks (use carefully)
    isAuthenticatedSync() {
        return !!this.authToken;
    }
}

// Create singleton instance
window.apiService = new ApiService(); 