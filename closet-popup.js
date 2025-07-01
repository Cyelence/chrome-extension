// Digital Closet Popup Script
class DigitalCloset {
    constructor() {
        this.items = [];
        this.filteredItems = [];
        this.currentItem = null;
        this.isLoading = false;
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }
    
    async init() {
        console.log('🗂️ Initializing Digital Closet...');
        
        // Bind event listeners
        this.bindEventListeners();
        
        // Load data from storage
        await this.loadItems();
        
        // Render initial state
        this.updateStats();
        this.renderItems();
        
        console.log('✅ Digital Closet initialized with', this.items.length, 'items');
    }
    
    bindEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        
        // Filter controls
        document.getElementById('categoryFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('statusFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('sortBy').addEventListener('change', () => this.applyFilters());
        
        // Add item buttons
        document.getElementById('addItemBtn').addEventListener('click', () => this.showQuickAddModal());
        document.getElementById('emptyAddBtn').addEventListener('click', () => this.showQuickAddModal());
        
        // Modal controls
        this.bindModalEventListeners();
    }
    
    bindModalEventListeners() {
        // Item detail modal
        document.getElementById('closeModal').addEventListener('click', () => this.hideModal('itemModal'));
        document.getElementById('saveItem').addEventListener('click', () => this.saveItemChanges());
        document.getElementById('deleteItem').addEventListener('click', () => this.deleteItem());
        
        // Quick add modal
        document.getElementById('closeQuickAdd').addEventListener('click', () => this.hideModal('quickAddModal'));
        document.getElementById('cancelQuickAdd').addEventListener('click', () => this.hideModal('quickAddModal'));
        document.getElementById('saveQuickAdd').addEventListener('click', () => this.saveQuickAddItem());
        
        // Close modals on backdrop click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal.id);
                }
            });
        });
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
    
    handleSearch(query) {
        const searchTerm = query.toLowerCase().trim();
        
        if (!searchTerm) {
            this.filteredItems = [...this.items];
        } else {
            this.filteredItems = this.items.filter(item =>
                item.title.toLowerCase().includes(searchTerm) ||
                item.brand.toLowerCase().includes(searchTerm) ||
                item.color.toLowerCase().includes(searchTerm) ||
                item.category.toLowerCase().includes(searchTerm) ||
                item.notes.toLowerCase().includes(searchTerm)
            );
        }
        
        this.applyFilters(false); // Don't reset search
    }
    
    applyFilters(resetSearch = true) {
        if (resetSearch) {
            document.getElementById('searchInput').value = '';
            this.filteredItems = [...this.items];
        }
        
        const categoryFilter = document.getElementById('categoryFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;
        const sortBy = document.getElementById('sortBy').value;
        
        // Apply category filter
        if (categoryFilter !== 'all') {
            this.filteredItems = this.filteredItems.filter(item => item.category === categoryFilter);
        }
        
        // Apply status filter
        if (statusFilter !== 'all') {
            this.filteredItems = this.filteredItems.filter(item => item.status === statusFilter);
        }
        
        // Apply sorting
        this.sortItems(sortBy);
        
        // Re-render
        this.renderItems();
    }
    
    sortItems(sortBy) {
        this.filteredItems.sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.dateAdded) - new Date(a.dateAdded);
                case 'oldest':
                    return new Date(a.dateAdded) - new Date(b.dateAdded);
                case 'price-high':
                    return (b.price || 0) - (a.price || 0);
                case 'price-low':
                    return (a.price || 0) - (b.price || 0);
                case 'brand':
                    return a.brand.localeCompare(b.brand);
                default:
                    return 0;
            }
        });
    }
    
    renderItems() {
        const itemsGrid = document.getElementById('itemsGrid');
        const emptyState = document.getElementById('emptyState');
        
        if (this.filteredItems.length === 0) {
            itemsGrid.style.display = 'none';
            emptyState.style.display = 'block';
            
            if (this.items.length === 0) {
                emptyState.querySelector('h3').textContent = 'Your closet is empty';
                emptyState.querySelector('p').textContent = 'Start building your digital wardrobe by adding items from any website!';
            } else {
                emptyState.querySelector('h3').textContent = 'No items match your filters';
                emptyState.querySelector('p').textContent = 'Try adjusting your search or filter settings.';
            }
            return;
        }
        
        itemsGrid.style.display = 'grid';
        emptyState.style.display = 'none';
        
        itemsGrid.innerHTML = this.filteredItems.map(item => this.createItemCard(item)).join('');
        
        // Bind click events to item cards
        itemsGrid.querySelectorAll('.item-card').forEach((card, index) => {
            card.addEventListener('click', () => this.showItemDetails(this.filteredItems[index]));
        });
    }
    
    createItemCard(item) {
        const ownershipDuration = this.calculateOwnershipDuration(item);
        const statusEmoji = this.getStatusEmoji(item.status);
        const categoryEmoji = this.getCategoryEmoji(item.category);
        
        return `
            <div class="item-card status-${item.status}" data-item-id="${item.id}">
                <div class="status-badge status-${item.status}">
                    ${statusEmoji} ${item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </div>
                <img src="${item.imageUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0xMDAgNzVDOTQuNDc3MiA3NSA5MCA3OS40NzcyIDkwIDg1VjExNUM5MCA5My43NjEgMTA2LjIzOSAxMTAgMTI1IDExMEgxNzVDMTgwLjUyMyAxMTAgMTg1IDEwNS41MjMgMTg1IDEwMFY1MEM5MCA0NS40NzcyIDk0LjQ3NzIgNDEgMTAwIDQxSDEyNUM5NC4yNjcgNDEgNzUgNjAuMjY3IDc1IDg1VjE1MEg3NVoiIGZpbGw9IiNDNEM0QzQiLz4KPC9zdmc+'}" alt="${item.title}" class="item-image">
                <div class="item-info">
                    <h3 class="item-title">${this.escapeHtml(item.title)}</h3>
                    <div class="item-details">
                        <span class="item-price">${item.price ? '$' + item.price : 'No price'}</span>
                        <span class="item-brand">${this.escapeHtml(item.brand)}</span>
                    </div>
                    <div class="item-meta">
                        <div class="item-date">
                            <span>📅 ${this.formatDate(item.dateAdded)}</span>
                        </div>
                        <div class="item-category">
                            ${categoryEmoji} ${item.category}
                        </div>
                    </div>
                    ${ownershipDuration ? `<div class="ownership-duration">Owned for ${ownershipDuration}</div>` : ''}
                </div>
            </div>
        `;
    }
    
    updateStats() {
        const totalItems = this.items.length;
        const totalValue = this.items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
        
        document.getElementById('totalItems').textContent = totalItems;
        document.getElementById('totalValue').textContent = '$' + totalValue.toFixed(2);
    }
    
    async showQuickAddModal() {
        try {
            // Try to detect item from current tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (tab) {
                // Send message to content script to detect item
                chrome.tabs.sendMessage(tab.id, { type: 'DETECT_ITEM' }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.log('No content script available, showing empty modal');
                        this.showQuickAddModalWithData(null, tab);
                    } else if (response && response.success) {
                        this.showQuickAddModalWithData(response.item, tab);
                    } else {
                        this.showQuickAddModalWithData(null, tab);
                    }
                });
            } else {
                this.showQuickAddModalWithData(null, null);
            }
        } catch (error) {
            console.error('Error detecting item:', error);
            this.showQuickAddModalWithData(null, null);
        }
    }
    
    showQuickAddModalWithData(detectedItem, tab) {
        const modal = document.getElementById('quickAddModal');
        const detectedItemDiv = document.getElementById('detectedItem');
        
        if (detectedItem) {
            detectedItemDiv.innerHTML = `
                <img src="${detectedItem.imageUrl || ''}" alt="Detected item" onerror="this.style.display='none'">
                <div class="detected-info">
                    <h4>${this.escapeHtml(detectedItem.title || 'Untitled Item')}</h4>
                    <p>${this.escapeHtml(detectedItem.price || 'Price not detected')} • ${this.escapeHtml(detectedItem.source || 'Unknown source')}</p>
                </div>
            `;
            detectedItemDiv.style.display = 'flex';
            
            // Store detected data
            this.currentDetectedItem = detectedItem;
        } else if (tab) {
            // Show current page info
            detectedItemDiv.innerHTML = `
                <div class="detected-info">
                    <h4>${this.escapeHtml(tab.title || 'Current Page')}</h4>
                    <p>Adding from: ${this.escapeHtml(new URL(tab.url).hostname)}</p>
                </div>
            `;
            detectedItemDiv.style.display = 'flex';
            this.currentDetectedItem = null;
        } else {
            detectedItemDiv.style.display = 'none';
            this.currentDetectedItem = null;
        }
        
        // Reset form
        document.getElementById('quickStatus').value = 'want';
        document.getElementById('quickCategory').value = 'other';
        
        this.showModal('quickAddModal');
    }
    
    async saveQuickAddItem() {
        const status = document.getElementById('quickStatus').value;
        const category = document.getElementById('quickCategory').value;
        
        let itemData;
        
        if (this.currentDetectedItem) {
            // Use detected data
            itemData = {
                ...this.currentDetectedItem,
                status: status,
                category: category,
                id: this.generateId(),
                dateAdded: new Date().toISOString(),
                datePurchased: status === 'purchased' ? new Date().toISOString() : null
            };
        } else {
            // Manual entry - get current page info
            try {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                itemData = {
                    id: this.generateId(),
                    title: tab ? tab.title : 'Manual Entry',
                    price: '',
                    brand: '',
                    color: '',
                    size: '',
                    imageUrl: '',
                    originalUrl: tab ? tab.url : '',
                    status: status,
                    category: category,
                    notes: '',
                    dateAdded: new Date().toISOString(),
                    datePurchased: status === 'purchased' ? new Date().toISOString() : null,
                    source: tab ? new URL(tab.url).hostname : ''
                };
            } catch (error) {
                console.error('Error creating manual item:', error);
                return;
            }
        }
        
        // Add to items array
        this.items.unshift(itemData);
        await this.saveItems();
        
        // Update UI
        this.updateStats();
        this.applyFilters();
        
        // Hide modal
        this.hideModal('quickAddModal');
        
        // Show success message
        this.showNotification('Item added to your closet!', 'success');
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
        document.getElementById('modalOwnershipDuration').textContent = 
            this.calculateOwnershipDuration(item) || 'Not owned yet';
        
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
        
        if (confirm('Are you sure you want to delete this item from your closet?')) {
            // Remove from array
            this.items = this.items.filter(item => item.id !== this.currentItem.id);
            await this.saveItems();
            
            // Update UI
            this.updateStats();
            this.applyFilters();
            
            this.hideModal('itemModal');
            this.showNotification('Item deleted from your closet', 'info');
        }
    }
    
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.add('show');
        modal.style.display = 'flex';
        
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
            modal.style.display = 'none';
        }, 300);
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '600',
            zIndex: '10000',
            opacity: '0',
            transform: 'translateY(-20px)',
            transition: 'all 0.3s ease'
        });
        
        // Set background color based on type
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            info: '#17a2b8',
            warning: '#ffc107'
        };
        notification.style.background = colors[type] || colors.info;
        
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
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }
    
    calculateOwnershipDuration(item) {
        if (item.status !== 'owned' && item.status !== 'purchased') return null;
        
        const purchaseDate = new Date(item.datePurchased || item.dateAdded);
        const now = new Date();
        const diffTime = Math.abs(now - purchaseDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return '1 day';
        if (diffDays < 7) return `${diffDays} days`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
        
        return `${Math.floor(diffDays / 365)} years`;
    }
    
    getStatusEmoji(status) {
        const emojis = {
            'want': '❤️',
            'purchased': '🛒',
            'owned': '✅'
        };
        return emojis[status] || '📦';
    }
    
    getCategoryEmoji(category) {
        const emojis = {
            'tops': '👔',
            'bottoms': '👖',
            'outerwear': '🧥',
            'dresses': '👗',
            'shoes': '👠',
            'accessories': '👜',
            'other': '📦'
        };
        return emojis[category] || '📦';
    }
}

// Initialize the Digital Closet
const digitalCloset = new DigitalCloset();
