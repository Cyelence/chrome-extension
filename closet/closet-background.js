// Digital Closet Background Script

// Handle extension icon click to toggle floating icon
chrome.action.onClicked.addListener(async (tab) => {
    console.log('Digital Closet icon clicked - toggling floating icon');
    
    try {
        // Send message to content script to toggle floating icon
        await chrome.tabs.sendMessage(tab.id, { 
            type: 'TOGGLE_FLOATING_ICON' 
        });
    } catch (error) {
        console.log('Could not toggle floating icon:', error.message);
    }
});

// Handle installation
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('🗂️ Digital Closet extension installed');
        console.log('💡 All data will be stored in your PostgreSQL database via API');
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

// Badge management - will be updated when items are loaded from API
function updateBadge(count = 0) {
    if (count > 0) {
        chrome.action.setBadgeText({ text: count.toString() });
        chrome.action.setBadgeBackgroundColor({ color: '#667eea' });
    } else {
        chrome.action.setBadgeText({ text: '' });
    }
}

// Listen for badge updates from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'UPDATE_BADGE') {
        updateBadge(request.count);
        sendResponse({ success: true });
    }
});

// Initialize badge (will be updated when user data is loaded)
updateBadge(); 