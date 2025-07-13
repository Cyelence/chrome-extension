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
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }
    
    async init() {
        console.log('👗 Initializing Digital Wardrobe...');
        
        // Bind event listeners
        this.bindEventListeners();
        
        // Load data from storage
        await this.loadItems();
        
        // Render initial state
        this.updateStats();
        this.renderItems();
        
        // Try to detect item on current page
        this.detectCurrentPageItem();
        
        console.log('✅ Digital Wardrobe initialized with', this.items.length, 'items');
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
            const result = await chrome.storage.local.get(['closetItems']);
            this.items = result.closetItems || [];
            this.filteredItems = [...this.items];
            console.log('📦 Loaded', this.items.length, 'items from storage');
        } catch (error) {
            console.error('Failed to load items:', error);
            this.items = [];
            this.filteredItems = [];
        }
    }
    
    async saveItems() {
        try {
            await chrome.storage.local.set({ closetItems: this.items });
            console.log('💾 Saved', this.items.length, 'items to storage');
        } catch (error) {
            console.error('Failed to save items:', error);
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
        
        return `
            <div class="wardrobe-item status-${item.status}" data-item-id="${item.id}">
                <div class="item-actions">
                    <button class="action-btn edit-btn" onclick="event.stopPropagation()">✏️</button>
                    <button class="action-btn delete-btn" onclick="event.stopPropagation()">🗑️</button>
                </div>
                <div class="status-badge">
                    ${statusEmoji} ${item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </div>
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
            id: this.generateId(),
            status: 'want',
            category: 'other',
            dateAdded: new Date().toISOString(),
            notes: '',
            size: '',
            color: ''
        };
        
        this.items.unshift(itemData);
        await this.saveItems();
        
        this.updateStats();
        this.applyFilters();
        
        this.showNotification('Item added to your wardrobe!', 'success');
        
        // Hide detected item
        document.getElementById('detectedItemContainer').style.display = 'none';
        this.currentDetectedItem = null;
    }
    
    async addManualItem() {
        const itemData = {
            id: this.generateId(),
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
        
        this.items.unshift(itemData);
        await this.saveItems();
        
        this.updateStats();
        this.applyFilters();
        
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
        
        // Find and update item in array
        const index = this.items.findIndex(item => item.id === this.currentItem.id);
        if (index !== -1) {
            this.items[index] = updatedItem;
            await this.saveItems();
            
            // Update UI
            this.updateStats();
            this.applyFilters();
            
            this.hideModal('itemModal');
            this.showNotification('Item updated successfully!', 'success');
        }
    }
    
    async deleteItem() {
        if (!this.currentItem) return;
        
        if (confirm('Are you sure you want to delete this item from your wardrobe?')) {
            // Remove from array
            this.items = this.items.filter(item => item.id !== this.currentItem.id);
            await this.saveItems();
            
            // Update UI
            this.updateStats();
            this.applyFilters();
            
            this.hideModal('itemModal');
            this.showNotification('Item deleted from your wardrobe', 'info');
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
