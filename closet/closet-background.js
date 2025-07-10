// Digital Closet Background Script

// Handle extension icon click to open popup
chrome.action.onClicked.addListener((tab) => {
    console.log('Digital Closet icon clicked');
    // The popup will open automatically based on manifest configuration
});

// Handle installation
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('🗂️ Digital Closet extension installed');
        
        // Initialize with sample data for demo purposes
        chrome.storage.local.get(['closetItems'], (result) => {
            if (!result.closetItems || result.closetItems.length === 0) {
                const sampleItems = [
                    {
                        id: 'sample1',
                        title: 'Classic White T-Shirt',
                        price: '19.99',
                        brand: 'Uniqlo',
                        color: 'White',
                        size: 'M',
                        imageUrl: '',
                        originalUrl: 'https://example.com/white-tshirt',
                        status: 'owned',
                        category: 'tops',
                        notes: 'Perfect everyday basic',
                        dateAdded: new Date('2024-01-15').toISOString(),
                        datePurchased: new Date('2024-01-15').toISOString(),
                        source: 'uniqlo.com'
                    },
                    {
                        id: 'sample2',
                        title: 'High-Waisted Blue Jeans',
                        price: '69.99',
                        brand: 'Levi\'s',
                        color: 'Blue',
                        size: '28',
                        imageUrl: '',
                        originalUrl: 'https://example.com/blue-jeans',
                        status: 'want',
                        category: 'bottoms',
                        notes: 'Want these for casual weekends',
                        dateAdded: new Date('2024-01-20').toISOString(),
                        datePurchased: null,
                        source: 'levis.com'
                    },
                    {
                        id: 'sample3',
                        title: 'Wool Blend Coat',
                        price: '129.99',
                        brand: 'Zara',
                        color: 'Black',
                        size: 'S',
                        imageUrl: '',
                        originalUrl: 'https://example.com/wool-coat',
                        status: 'purchased',
                        category: 'outerwear',
                        notes: 'Just bought for winter',
                        dateAdded: new Date('2024-01-25').toISOString(),
                        datePurchased: new Date('2024-01-25').toISOString(),
                        source: 'zara.com'
                    }
                ];
                
                chrome.storage.local.set({ closetItems: sampleItems }, () => {
                    console.log('📦 Initialized closet with sample items');
                });
            }
        });
    }
});

// Handle context menu clicks (optional)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'QUICK_ADD_ITEM') {
        // Handle quick add requests from content scripts
        console.log('Quick add item request:', request.item);
        sendResponse({ success: true });
    }
});

// Badge management
function updateBadge() {
    chrome.storage.local.get(['closetItems'], (result) => {
        const items = result.closetItems || [];
        const count = items.length;
        
        if (count > 0) {
            chrome.action.setBadgeText({ text: count.toString() });
            chrome.action.setBadgeBackgroundColor({ color: '#667eea' });
        } else {
            chrome.action.setBadgeText({ text: '' });
        }
    });
}

// Update badge when storage changes
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.closetItems) {
        updateBadge();
    }
});

// Initialize badge
updateBadge(); 