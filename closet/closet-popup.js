// Digital Wardrobe Popup Script
class DigitalWardrobe {
    constructor() {
        this.items = [];
        this.filteredItems = [];
        this.currentItem = null;
        this.currentDetectedItem = null;
        this.isLoading = false;
        this.activeTab = 'closet';
        this.activeFilter = 'all';
        this.pendingSync = []; // Items waiting to be synced to backend
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }
    
    async init() {
        console.log('👗 Initializing Digital Wardrobe...');
        
        // Wait for API service to be available (required)
        await this.waitForApiService();
        
        // Bind event listeners
        this.bindEventListeners();
        
        // Load data from API
        await this.loadItems();
        
        // Render initial state
        this.updateStats();
        this.renderItems();
        
        // Try to detect item on current page
        this.detectCurrentPageItem();
        
        // Set up periodic authentication check
        this.setupAuthCheck();
        
        console.log('✅ Digital Wardrobe initialized with', this.items.length, 'items');
    }
    
    setupAuthCheck() {
        // Check authentication status every 30 seconds
        setInterval(async () => {
            if (window.apiService && await window.apiService.isAuthenticated()) {
                // User is authenticated, try to load items if we don't have any
                if (this.items.length === 0) {
                    console.log('🔄 Auto-refreshing data for authenticated user...');
                    await this.refreshAfterAuth();
                }
                
                // Also try to sync pending items
                if (this.pendingSync.length > 0) {
                    console.log('🔄 Auto-syncing pending items...');
                    await this.syncPendingItems();
                }
            }
        }, 30000); // Check every 30 seconds
    }
    
    async waitForApiService() {
        // API service is now loaded directly in popup HTML, so it should always be available
        if (!window.apiService) {
            console.error('❌ API Service failed to load - this should not happen');
            throw new Error('API Service is required but failed to load');
        }
        
        // Wait for API service to initialize
        await window.apiService.ensureInitialized();
        console.log('🔌 API Service initialized and ready');
    }
    
    bindEventListeners() {
        // Tab switching
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
        
        // Category filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.filterByCategory(e.target.dataset.category));
        });
        
        // Manual add item form
        document.getElementById('addManualItem').addEventListener('click', () => this.addManualItem());
        
        // Detected item add button
        document.getElementById('addDetectedItem').addEventListener('click', () => this.addDetectedItem());
        
        // Modal controls
        this.bindModalEventListeners();
    }
    
    bindModalEventListeners() {
        // Item detail modal
        document.getElementById('closeModal').addEventListener('click', () => this.hideModal('itemModal'));
        document.getElementById('saveItem').addEventListener('click', () => this.saveItemChanges());
        document.getElementById('deleteItem').addEventListener('click', () => this.deleteItem());
        
        // Close modals on backdrop click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal.id);
                }
            });
        });
    }
    
    switchTab(tabName) {
        // Update active tab
        this.activeTab = tabName;
        
        // Update tab buttons
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Show/hide tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.style.display = 'none';
        });
        document.getElementById(`${tabName}-tab`).style.display = 'block';
        
        // Update content based on active tab
        if (tabName === 'closet') {
            this.renderItems();
        } else if (tabName === 'stats') {
            this.renderStats();
        }
    }
    
    filterByCategory(category) {
        this.activeFilter = category;
        
        // Update filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-category="${category}"]`).classList.add('active');
        
        // Filter and render items
        this.applyFilters();
    }
    
    applyFilters() {
        if (this.activeFilter === 'all') {
            this.filteredItems = [...this.items];
        } else {
            this.filteredItems = this.items.filter(item => item.category === this.activeFilter);
        }
        
        this.renderItems();
    }
    
    async loadItems() {
        try {
            // First, load local items from storage
            const localItems = await this.loadLocalItems();
            this.items = localItems;
            this.filteredItems = [...this.items];
            
            // If user is authenticated, try to sync with backend
            if (window.apiService && await window.apiService.isAuthenticated()) {
                try {
                    const apiItems = await window.apiService.getItems();
                    const backendItems = apiItems.map(item => window.apiService.transformItemFromAPI(item));
                    
                    // Merge local and backend items, avoiding duplicates
                    const mergedItems = this.mergeItems(localItems, backendItems);
                    this.items = mergedItems;
                    this.filteredItems = [...this.items];
                    
                    // Save merged items locally
                    await this.saveLocalItems(this.items);
                    
                    console.log('📦 Loaded', this.items.length, 'items (local + backend)');
                } catch (error) {
                    console.error('Failed to load from backend:', error);
                    // Continue with local items only
                }
            } else {
                console.log('📦 Loaded', this.items.length, 'items (local only)');
            }
        } catch (error) {
            console.error('Failed to load items:', error);
            this.items = [];
            this.filteredItems = [];
        }
    }
    
    async loadLocalItems() {
        try {
            const result = await chrome.storage.local.get(['localClosetItems']);
            return result.localClosetItems || [];
        } catch (error) {
            console.error('Failed to load local items:', error);
            return [];
        }
    }
    
    async saveLocalItems(items) {
        try {
            await chrome.storage.local.set({ localClosetItems: items });
        } catch (error) {
            console.error('Failed to save local items:', error);
        }
    }
    
    mergeItems(localItems, backendItems) {
        const merged = [...localItems];
        
        // Add backend items that don't exist locally
        backendItems.forEach(backendItem => {
            const exists = merged.some(localItem => 
                localItem.id === backendItem.id || 
                (localItem.title === backendItem.title && localItem.originalUrl === backendItem.originalUrl)
            );
            
            if (!exists) {
                merged.push(backendItem);
            }
        });
        
        return merged;
    }
    
    // Method to refresh data after authentication
    async refreshAfterAuth() {
        console.log('🔄 Refreshing data after authentication...');
        await this.loadItems();
        this.updateStats();
        this.renderItems();
        
        // Try to sync pending items
        if (this.pendingSync.length > 0) {
            await this.syncPendingItems();
        }
    }
    
    // Sync pending items to backend
    async syncPendingItems() {
        if (!window.apiService || !await window.apiService.isAuthenticated()) {
            console.log('User not authenticated, cannot sync items');
            return;
        }
        
        console.log(`🔄 Syncing ${this.pendingSync.length} pending items...`);
        
        for (const localItem of this.pendingSync) {
            try {
                // Remove local flag and prepare for API
                const itemData = { ...localItem };
                delete itemData.isLocal;
                delete itemData.id; // Let backend generate ID
                
                const apiItem = await window.apiService.createItem(itemData);
                const transformedItem = window.apiService.transformItemFromAPI(apiItem);
                
                // Update the local item with backend data
                const index = this.items.findIndex(item => item.id === localItem.id);
                if (index !== -1) {
                    this.items[index] = { ...transformedItem, isLocal: false };
                }
                
                console.log('✅ Synced item:', transformedItem.title);
            } catch (error) {
                console.error('Failed to sync item:', localItem.title, error);
            }
        }
        
        // Clear pending sync and save updated items
        this.pendingSync = [];
        await this.saveLocalItems(this.items);
        this.updateStats();
        this.renderItems();
        
        if (this.pendingSync.length === 0) {
            this.showNotification('All items synced successfully!', 'success');
        }
    }
    
    async saveItem(itemData) {
        try {
            // Generate local ID for the item (temporary until backend assigns real ID)
            const localItem = {
                ...itemData,
                id: this.generateId(),
                dateAdded: new Date().toISOString(),
                isLocal: true // Flag to identify local items awaiting sync
            };
            
            // Add to local storage immediately for responsive UI
            this.items.unshift(localItem);
            await this.saveLocalItems(this.items);
            
            // Update UI immediately
            this.updateStats();
            this.applyFilters();
            
            console.log('💾 Saved item locally (temporary):', localItem.title);
            
            // Try to sync with backend if authenticated
            if (window.apiService && await window.apiService.isAuthenticated()) {
                try {
                    const apiItem = await window.apiService.createItem(itemData);
                    const transformedItem = window.apiService.transformItemFromAPI(apiItem);
                    
                    // Update the local item with backend data
                    const index = this.items.findIndex(item => item.id === localItem.id);
                    if (index !== -1) {
                        this.items[index] = { ...transformedItem, isLocal: false };
                        await this.saveLocalItems(this.items);
                        this.updateStats();
                        this.applyFilters();
                    }
                    
                    // Remove from pending sync since it was successfully synced
                    this.pendingSync = this.pendingSync.filter(item => item.id !== localItem.id);
                    
                    console.log('💾 Synced item to backend:', transformedItem.title);
                    return transformedItem;
                } catch (error) {
                    console.error('Failed to sync with backend:', error);
                    // Item stays local, will be synced later
                    this.pendingSync.push(localItem);
                    this.showNotification('Item saved locally. Will sync when connection is restored.', 'info');
                    return localItem;
                }
            } else {
                // User not authenticated, show sync prompt
                this.pendingSync.push(localItem);
                await this.showSyncPrompt();
                return localItem;
            }
        } catch (error) {
            console.error('Failed to save item:', error);
            throw error;
        }
    }
    
    renderItems() {
        const wardrobeGrid = document.getElementById('wardrobeGrid');
        const emptyState = document.getElementById('emptyState');
        
        if (this.filteredItems.length === 0) {
            wardrobeGrid.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }
        
        emptyState.classList.add('hidden');
        
        wardrobeGrid.innerHTML = this.filteredItems.map(item => this.createItemCard(item)).join('');
        
        // Bind click events to item cards
        wardrobeGrid.querySelectorAll('.wardrobe-item').forEach((card, index) => {
            card.addEventListener('click', () => this.showItemDetails(this.filteredItems[index]));
        });
    }
    
    createItemCard(item) {
        const statusEmoji = this.getStatusEmoji(item.status);
        const categoryEmoji = this.getCategoryEmoji(item.category);
        const localIndicator = item.isLocal ? '<div class="local-indicator">📱 Local</div>' : '';
        
        return `
            <div class="wardrobe-item status-${item.status}" data-item-id="${item.id}">
                <div class="item-actions">
                    <button class="action-btn edit-btn" onclick="event.stopPropagation()">✏️</button>
                    <button class="action-btn delete-btn" onclick="event.stopPropagation()">🗑️</button>
                </div>
                <div class="status-badge">
                    ${statusEmoji} ${item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </div>
                ${localIndicator}
                ${item.imageUrl ? 
                    `<img src="${item.imageUrl}" alt="${item.title}" class="item-image">` : 
                    `<div class="item-image">${categoryEmoji}</div>`
                }
                <div class="item-title">${this.escapeHtml(item.title)}</div>
                <div class="item-brand">${this.escapeHtml(item.brand || 'No brand')}</div>
                <div class="item-price">${item.price ? '$' + item.price : 'No price'}</div>
            </div>
        `;
    }
    
    updateStats() {
        const totalItems = this.items.length;
        const totalValue = this.items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
        
        // Update stats in stats tab
        document.getElementById('totalItemsCount').textContent = totalItems;
        document.getElementById('totalValueAmount').textContent = '$' + totalValue.toFixed(2);
        
        // Update category counts
        const categoryCounts = this.items.reduce((acc, item) => {
            acc[item.category] = (acc[item.category] || 0) + 1;
            return acc;
        }, {});
        
        document.getElementById('topsCount').textContent = categoryCounts.tops || 0;
        document.getElementById('bottomsCount').textContent = categoryCounts.bottoms || 0;
        
        // Update badge in background script
        this.updateBadge(totalItems);
    }
    
    async updateBadge(count) {
        try {
            await chrome.runtime.sendMessage({
                type: 'UPDATE_BADGE',
                count: count
            });
        } catch (error) {
            // Ignore badge update errors
            console.log('Could not update badge:', error);
        }
    }
    
    renderStats() {
        this.updateStats();
        this.renderRecentItems();
        this.renderCategorySpending();
    }
    
    renderRecentItems() {
        const recentGrid = document.getElementById('recentItemsGrid');
        const recentItems = this.items.slice(0, 2); // Show 2 most recent
        
        recentGrid.innerHTML = recentItems.map(item => {
            const categoryEmoji = this.getCategoryEmoji(item.category);
            return `
                <div class="wardrobe-item" onclick="window.digitalWardrobe.showItemDetails(${JSON.stringify(item).replace(/"/g, '&quot;')})">
                    ${item.imageUrl ? 
                        `<img src="${item.imageUrl}" alt="${item.title}" class="item-image">` : 
                        `<div class="item-image">${categoryEmoji}</div>`
                    }
                    <div class="item-title">${this.escapeHtml(item.title)}</div>
                    <div class="item-brand">Added ${this.formatDate(item.dateAdded)}</div>
                    <div class="item-price">${item.price ? '$' + item.price : 'No price'}</div>
                </div>
            `;
        }).join('');
    }
    
    renderCategorySpending() {
        const spendingDiv = document.getElementById('categorySpending');
        
        // Calculate spending by category
        const categorySpending = this.items.reduce((acc, item) => {
            const price = parseFloat(item.price) || 0;
            acc[item.category] = (acc[item.category] || 0) + price;
            return acc;
        }, {});
        
        // Sort by spending amount
        const sortedCategories = Object.entries(categorySpending)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3); // Show top 3 categories
        
        const maxSpending = Math.max(...Object.values(categorySpending));
        
        spendingDiv.innerHTML = sortedCategories.map(([category, amount]) => {
            const percentage = maxSpending > 0 ? (amount / maxSpending) * 100 : 0;
            const categoryEmoji = this.getCategoryEmoji(category);
            
            return `
                <div class="spending-bar">
                    <span>${categoryEmoji} ${category.charAt(0).toUpperCase() + category.slice(1)}</span>
                    <span>$${amount.toFixed(2)}</span>
                </div>
                <div class="spending-bar-fill">
                    <div class="spending-bar-progress" style="width: ${percentage}%"></div>
                </div>
            `;
        }).join('');
    }
    
    async detectCurrentPageItem() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (tab) {
                chrome.tabs.sendMessage(tab.id, { type: 'DETECT_ITEM' }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.log('No content script available');
                    } else if (response && response.success) {
                        this.showDetectedItem(response.item);
                    }
                });
            }
        } catch (error) {
            console.error('Error detecting item:', error);
        }
    }
    
    showDetectedItem(item) {
        const container = document.getElementById('detectedItemContainer');
        const content = document.getElementById('detectedItemContent');
        
        content.innerHTML = `
            <p><strong>${this.escapeHtml(item.title || 'Untitled Item')}</strong> - ${this.escapeHtml(item.price || 'Price not detected')}</p>
            <p>From: ${this.escapeHtml(item.source || 'Unknown source')}</p>
        `;
        
        container.style.display = 'block';
        this.currentDetectedItem = item;
    }
    
    async addDetectedItem() {
        if (!this.currentDetectedItem) return;
        
        const itemData = {
            ...this.currentDetectedItem,
            status: 'want',
            category: this.currentDetectedItem.category || 'other',
            dateAdded: new Date().toISOString(),
            notes: '',
            size: '',
            color: ''
        };
        
        try {
            await this.saveItem(itemData);
            
            this.showNotification('Item added to your wardrobe!', 'success');
            
            // Hide detected item
            document.getElementById('detectedItemContainer').style.display = 'none';
            this.currentDetectedItem = null;
        } catch (error) {
            this.showNotification('Failed to add item. Please try again.', 'error');
        }
    }
    
    async addManualItem() {
        const itemData = {
            title: document.getElementById('itemName').value.trim(),
            brand: document.getElementById('itemBrand').value.trim(),
            category: document.getElementById('itemCategory').value || 'other',
            price: document.getElementById('itemPrice').value,
            color: document.getElementById('itemColor').value.trim(),
            size: document.getElementById('itemSize').value.trim(),
            status: document.getElementById('itemStatus').value,
            imageUrl: '',
            originalUrl: '',
            notes: '',
            dateAdded: new Date().toISOString(),
            datePurchased: null,
            source: 'manual'
        };
        
        // Validate required fields
        if (!itemData.title) {
            this.showNotification('Please enter an item name', 'error');
            return;
        }
        
        if (!itemData.category) {
            this.showNotification('Please select a category', 'error');
            return;
        }
        
        try {
            await this.saveItem(itemData);
            
            // Clear form
            document.getElementById('itemName').value = '';
            document.getElementById('itemBrand').value = '';
            document.getElementById('itemCategory').value = '';
            document.getElementById('itemPrice').value = '';
            document.getElementById('itemColor').value = '';
            document.getElementById('itemSize').value = '';
            document.getElementById('itemStatus').value = 'want';
            
            this.showNotification('Item added to your wardrobe!', 'success');
            
            // Switch to closet tab to show the new item
            this.switchTab('closet');
        } catch (error) {
            this.showNotification('Failed to add item. Please try again.', 'error');
        }
    }
    
    showItemDetails(item) {
        this.currentItem = item;
        
        // Populate modal fields
        document.getElementById('modalTitle').textContent = item.title;
        document.getElementById('modalImage').src = item.imageUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0xMDAgNzVDOTQuNDc3MiA3NSA5MCA3OS40NzcyIDkwIDg1VjExNUM5MCA5My43NjEgMTA2LjIzOSAxMTAgMTI1IDExMEgxNzVDMTgwLjUyMyAxMTAgMTg1IDEwNS41MjMgMTg1IDEwMFY1MEM5MCA0NS40NzcyIDk0LjQ3NzIgNDEgMTAwIDQxSDEyNUM5NC4yNjcgNDEgNzUgNjAuMjY3IDc1IDg1VjE1MEg3NVoiIGZpbGw9IiNDNEM0QzQiLz4KPC9zdmc+';
        document.getElementById('modalStatus').value = item.status;
        document.getElementById('modalCategory').value = item.category;
        document.getElementById('modalBrand').value = item.brand || '';
        document.getElementById('modalPrice').value = item.price || '';
        document.getElementById('modalSize').value = item.size || '';
        document.getElementById('modalColor').value = item.color || '';
        document.getElementById('modalNotes').value = item.notes || '';
        
        // Update metadata
        document.getElementById('modalDateAdded').textContent = this.formatDate(item.dateAdded);
        
        const originalLink = document.getElementById('modalOriginalLink');
        if (item.originalUrl) {
            originalLink.href = item.originalUrl;
            originalLink.style.display = 'inline';
        } else {
            originalLink.style.display = 'none';
        }
        
        this.showModal('itemModal');
    }
    
    async saveItemChanges() {
        if (!this.currentItem) return;
        
        // Get current values
        const updatedItem = {
            ...this.currentItem,
            status: document.getElementById('modalStatus').value,
            category: document.getElementById('modalCategory').value,
            brand: document.getElementById('modalBrand').value,
            price: document.getElementById('modalPrice').value,
            size: document.getElementById('modalSize').value,
            color: document.getElementById('modalColor').value,
            notes: document.getElementById('modalNotes').value
        };
        
        // Update purchase date if status changed to purchased
        if (updatedItem.status === 'purchased' && this.currentItem.status !== 'purchased') {
            updatedItem.datePurchased = new Date().toISOString();
        }
        
        try {
            if (!window.apiService || !await window.apiService.isAuthenticated()) {
                await this.showAuthenticationPrompt();
                return;
            }
            
            const apiItem = await window.apiService.updateItem(this.currentItem.id, updatedItem);
            const transformedItem = window.apiService.transformItemFromAPI(apiItem);
            
            // Find and update item in array
            const index = this.items.findIndex(item => item.id === this.currentItem.id);
            if (index !== -1) {
                this.items[index] = transformedItem;
                
                // Update UI
                this.updateStats();
                this.applyFilters();
                
                this.hideModal('itemModal');
                this.showNotification('Item updated successfully!', 'success');
            }
        } catch (error) {
            console.error('Failed to update item:', error);
            this.showNotification('Failed to update item. Please try again.', 'error');
        }
    }
    
    async deleteItem() {
        if (!this.currentItem) return;
        
        if (confirm('Are you sure you want to delete this item from your wardrobe?')) {
            try {
                if (!window.apiService || !await window.apiService.isAuthenticated()) {
                    await this.showAuthenticationPrompt();
                    return;
                }
                
                await window.apiService.deleteItem(this.currentItem.id);
                
                // Remove from array
                this.items = this.items.filter(item => item.id !== this.currentItem.id);
                
                // Update UI
                this.updateStats();
                this.applyFilters();
                
                this.hideModal('itemModal');
                this.showNotification('Item deleted from your wardrobe', 'info');
            } catch (error) {
                console.error('Failed to delete item:', error);
                this.showNotification('Failed to delete item. Please try again.', 'error');
            }
        }
    }
    
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('hidden');
        modal.classList.add('show');
        
        // Focus first input
        setTimeout(() => {
            const firstInput = modal.querySelector('input, select, textarea');
            if (firstInput) firstInput.focus();
        }, 100);
    }
    
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('show');
        
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }
    
    async showSyncPrompt() {
        console.log('showSyncPrompt called, checking conditions...');
        console.log('Pending sync items:', this.pendingSync.length);
        
        // Don't show sync prompt if user is already authenticated
        if (window.apiService && await window.apiService.isAuthenticated()) {
            console.log('User already authenticated, skipping sync prompt');
            return;
        }
        
        // Don't show if no items to sync
        if (this.pendingSync.length === 0) {
            console.log('No items to sync, skipping sync prompt');
            return;
        }
        
        console.log('📝 Showing sync prompt for', this.pendingSync.length, 'items');
        
        // Create sync prompt
        const syncPrompt = document.createElement('div');
        syncPrompt.className = 'sync-prompt';
        syncPrompt.innerHTML = `
            <div class="sync-prompt-overlay">
                <div class="sync-prompt-content">
                    <h3>Sign in to add to your closet</h3>
                    <p>Your items are saved locally. Sign in to sync them across all your devices and never lose your wardrobe!</p>
                    <div class="sync-stats">
                        <span>📦 ${this.pendingSync.length} items ready to sync</span>
                    </div>
                    <button id="openWebAppBtn">Sign In to Sync</button>
                    <button id="syncLaterBtn">Sync Later</button>
                    <button id="closeSyncPrompt">Close</button>
                </div>
            </div>
        `;
        syncPrompt.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 10001;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        const content = syncPrompt.querySelector('.sync-prompt-content');
        content.style.cssText = `
            background: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            max-width: 350px;
        `;
        
        const syncStats = content.querySelector('.sync-stats');
        syncStats.style.cssText = `
            background: #f8f9fa;
            padding: 10px;
            border-radius: 6px;
            margin: 10px 0;
            font-weight: 600;
            color: #667eea;
        `;
        
        const buttons = content.querySelectorAll('button');
        buttons.forEach((button, index) => {
            let backgroundColor;
            if (index === 0) {
                backgroundColor = '#667eea'; // Primary button
            } else if (index === 1) {
                backgroundColor = '#28a745'; // Success button
            } else {
                backgroundColor = '#6c757d'; // Secondary button
            }
            
            button.style.cssText = `
                margin: 5px;
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                background: ${backgroundColor};
                color: white;
            `;
        });
        
        // Add event listeners
        const openWebAppBtn = syncPrompt.querySelector('#openWebAppBtn');
        const syncLaterBtn = syncPrompt.querySelector('#syncLaterBtn');
        const closeBtn = syncPrompt.querySelector('#closeSyncPrompt');
        
        openWebAppBtn.addEventListener('click', () => {
            // Open the web app in a new tab
            window.open('http://localhost:3000', '_blank');
            // Close the prompt
            syncPrompt.remove();
        });
        
        syncLaterBtn.addEventListener('click', () => {
            // Close prompt, items stay local
            syncPrompt.remove();
            this.showNotification('Items saved locally. You can sync them later!', 'info');
        });
        
        closeBtn.addEventListener('click', () => {
            syncPrompt.remove();
        });
        
        document.body.appendChild(syncPrompt);
    }
    
    async showAuthenticationPrompt() {
        // For now, just show the sync prompt
        await this.showSyncPrompt();
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 10000;
            opacity: 0;
            transform: translateY(-20px);
            transition: all 0.3s ease;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        }, 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    // Utility functions
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }
    
    getStatusEmoji(status) {
        switch (status) {
            case 'want': return '❤️';
            case 'purchased': return '🛒';
            case 'owned': return '✅';
            default: return '📦';
        }
    }
    
    getCategoryEmoji(category) {
        switch (category) {
            case 'tops': return '👔';
            case 'bottoms': return '👖';
            case 'shoes': return '👟';
            case 'dresses': return '👗';
            case 'outerwear': return '🧥';
            case 'accessories': return '👜';
            default: return '📦';
        }
    }
}

// Initialize the app
window.digitalWardrobe = new DigitalWardrobe();
