// content.js - Enhanced Fashion AI Content Script
(function() {
    console.log('Fashion AI Content Script Loading...');
    
    // Prevent multiple instances with unique identifier
    const INSTANCE_ID = 'fashionAI_' + Math.random().toString(36).substr(2, 9);
    if (window.hasRunFashionAI && window.fashionAIInstanceId) {
        console.log('Fashion AI already running with ID:', window.fashionAIInstanceId, 'current:', INSTANCE_ID);
        return;
    }
    window.hasRunFashionAI = true;
    window.fashionAIInstanceId = INSTANCE_ID;

    let fashionAISearchInstance = null;
    let isInitialized = false;
    let initializationInProgress = false;

    // Listen for commands from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log('Content script received message:', request);
        
        if (request.type === 'TOGGLE_UI') {
            handleToggleUI();
        } else if (request.type === 'CLEAR_HIGHLIGHTS') {
            clearHighlights();
        } else if (request.type === 'GET_STATS') {
            sendResponse(getPerformanceStats());
        }
    });

    async function handleToggleUI() {
        console.log('Processing TOGGLE_UI message');
        
        // Prevent multiple initialization attempts
        if (initializationInProgress) {
            console.log('Initialization already in progress, waiting...');
            showErrorNotification('Please wait, AI is loading...');
            return;
        }
        
        if (!fashionAISearchInstance) {
            console.log('Creating new FashionAISearch instance');
            await initializeFashionAI();
        } else {
            console.log('Toggling existing UI visibility');
            fashionAISearchInstance.toggleVisibility();
        }
    }

    async function initializeFashionAI() {
        if (initializationInProgress) {
            console.log('Initialization already in progress');
            return;
        }
        
        initializationInProgress = true;
        
        try {
            console.log('Starting Fashion AI initialization...');
            
            // ProductFinder.js is now loaded as a content script automatically
            // Just wait for it to be available
            await waitForProductFinder(3000);
            
            console.log('ProductFinder class is available, creating instance');
            fashionAISearchInstance = new FashionAISearch();
            await fashionAISearchInstance.initialize();
            
            isInitialized = true;
            console.log('Fashion AI initialized successfully with ID:', INSTANCE_ID);
            
        } catch (error) {
            console.error('Failed to initialize Fashion AI:', error);
            showErrorNotification('Failed to initialize AI: ' + error.message);
            // Reset state on failure
            initializationInProgress = false;
            fashionAISearchInstance = null;
        } finally {
            initializationInProgress = false;
        }
    }

    async function waitForProductFinder(timeoutMs = 3000) {
        console.log('⏳ Waiting for ProductFinder class to be available...');
        
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            let checkCount = 0;
            
            const checkInterval = setInterval(() => {
                checkCount++;
                const isAvailable = !!(window.ProductFinder);
                
                if (checkCount % 10 === 0) { // Log every 1 second
                    console.log(`🔍 ProductFinder check #${checkCount}: Available = ${isAvailable}`);
                }
                
                if (isAvailable) {
                    clearInterval(checkInterval);
                    console.log(`✅ ProductFinder class found after ${checkCount} checks (${Date.now() - startTime}ms)!`);
                    
                    // Quick validation
                    try {
                        const testInstance = new window.ProductFinder(() => {});
                        console.log('✅ ProductFinder class can be instantiated successfully');
                        resolve();
                    } catch (error) {
                        console.error('❌ ProductFinder found but cannot be instantiated:', error);
                        reject(new Error(`ProductFinder class found but instantiation failed: ${error.message}`));
                    }
                    return;
                }
                
                if (Date.now() - startTime > timeoutMs) {
                    clearInterval(checkInterval);
                    console.error(`❌ ProductFinder class not available after ${timeoutMs}ms (${checkCount} checks)`);
                    console.error('🔍 Window object contains ProductFinder:', !!window.ProductFinder);
                    console.error('🔍 Available classes:', Object.keys(window).filter(k => k.includes('Product') || k.includes('Finder')));
                    reject(new Error(`ProductFinder class not available after ${timeoutMs}ms`));
                    return;
                }
            }, 100); // Check every 100ms
        });
    }

    // waitForProductFinderViaMessaging function removed - no longer needed

    function clearHighlights() {
        if (fashionAISearchInstance) {
            fashionAISearchInstance.clearHighlights();
        }
    }

    function getPerformanceStats() {
        if (fashionAISearchInstance) {
            return fashionAISearchInstance.getPerformanceStats();
        }
        return {
            instanceId: INSTANCE_ID,
            isInitialized,
            initializationInProgress,
            error: 'AI not initialized'
        };
    }

    function showErrorNotification(message) {
        // Remove existing notifications
        document.querySelectorAll('.fashion-ai-error-notification').forEach(el => el.remove());
        
        const notification = document.createElement('div');
        notification.className = 'fashion-ai-error-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #ff4757, #ff3742);
            color: white;
            padding: 16px 20px;
            border-radius: 12px;
            z-index: 100000;
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 14px;
            font-weight: 500;
            max-width: 350px;
            box-shadow: 0 8px 24px rgba(255, 71, 87, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            animation: slideInRight 0.3s ease-out;
        `;
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 18px;">⚠️</span>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Enhanced Fashion AI Search Interface
     */
    class FashionAISearch {
        constructor() {
            console.log('FashionAISearch constructor called with ID:', INSTANCE_ID);
            this.ui = null;
            this.fashionAI = null;
            this.isSearching = false;
            this.isVisible = false;
            this.currentQuery = '';
            this.searchHistory = [];
            this.performanceStats = {};
            this.instanceId = INSTANCE_ID;
            
            // Load search history
            this.loadSearchHistory();
        }

        async initialize() {
            console.log('Initializing FashionAISearch...');
            
            try {
                await this.createSearchUI();
                this.setupEventListeners();
                this.setupKeyboardShortcuts();
                this.toggleVisibility(); // Show on creation
                
                console.log('FashionAISearch initialized successfully');
            } catch (error) {
                console.error('Failed to initialize FashionAISearch:', error);
                throw error;
            }
        }

        toggleVisibility() {
            console.log('toggleVisibility called, current isVisible:', this.isVisible);
            if (!this.ui) {
                console.log('No UI element found');
                return;
            }
            
            this.isVisible = !this.isVisible;
            this.ui.style.display = this.isVisible ? 'flex' : 'none';
            
            if (this.isVisible) {
                const input = this.ui.querySelector('#fashion-ai-query-input');
                if (input) {
                    setTimeout(() => input.focus(), 100); // Delay focus for better UX
                }
                this.showWelcomeMessage();
            }
            
            console.log('UI visibility set to:', this.isVisible ? 'visible' : 'hidden');
        }

        async createSearchUI() {
            console.log('Creating enhanced search UI');
            
            // Remove any existing UI
            const existingUI = document.getElementById('fashion-ai-search-container');
            if (existingUI) {
                existingUI.remove();
                console.log('Removed existing UI');
            }
            
            this.ui = document.createElement('div');
            this.ui.id = 'fashion-ai-search-container';
            this.ui.setAttribute('data-instance-id', this.instanceId);
            this.ui.style.display = 'none';
            
            this.ui.innerHTML = `
                <div class="search-bar">
                    <input type="text" 
                           id="fashion-ai-query-input" 
                           placeholder="e.g., vintage black leather jacket under $200"
                           autocomplete="off"
                           spellcheck="false">
                    <button id="fashion-ai-search-button">Find</button>
                </div>
                
                <div id="fashion-ai-status">Welcome! Enter a search query to find fashion items.</div>
                
                <div class="fashion-ai-settings" style="display: none;">
                    <label>
                        <input type="checkbox" id="performance-mode-toggle">
                        Performance Mode
                    </label>
                    <label>
                        <input type="checkbox" id="ollama-mode-toggle">
                        Use Ollama (Advanced)
                    </label>
                </div>
                
                <div class="fashion-ai-stats" id="fashion-ai-stats" style="display: none;"></div>
            `;
            
            document.body.appendChild(this.ui);
            console.log('Enhanced search UI created and added to page');
            
            // Load settings
            await this.loadSettings();
        }

        setupEventListeners() {
            const searchButton = this.ui.querySelector('#fashion-ai-search-button');
            const queryInput = this.ui.querySelector('#fashion-ai-query-input');
            const performanceToggle = this.ui.querySelector('#performance-mode-toggle');
            const ollamaToggle = this.ui.querySelector('#ollama-mode-toggle');

            if (searchButton) {
                searchButton.addEventListener('click', () => this.startSearch());
            }
            
            if (queryInput) {
                queryInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        this.startSearch();
                    } else if (e.key === 'Escape') {
                        this.toggleVisibility();
                    }
                });

                queryInput.addEventListener('input', (e) => {
                    this.handleQueryInput(e.target.value);
                });
            }

            if (performanceToggle) {
                performanceToggle.addEventListener('change', (e) => {
                    this.updateSetting('performanceMode', e.target.checked ? 'fast' : 'balanced');
                });
            }

            if (ollamaToggle) {
                ollamaToggle.addEventListener('change', (e) => {
                    this.updateSetting('useOllama', e.target.checked);
                });
            }

            // Settings toggle (double-click on status)
            const statusEl = this.ui.querySelector('#fashion-ai-status');
            if (statusEl) {
                statusEl.addEventListener('dblclick', () => {
                    this.toggleSettings();
                });
            }
        }

        setupKeyboardShortcuts() {
            // Use instance-specific event listener to avoid conflicts
            const keyHandler = (e) => {
                // Only handle if this is the active instance
                if (window.fashionAIInstanceId !== this.instanceId) return;
                
                // Ctrl/Cmd + Shift + F to toggle
                if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
                    e.preventDefault();
                    this.toggleVisibility();
                }
                
                // Escape to close
                if (e.key === 'Escape' && this.isVisible) {
                    this.toggleVisibility();
                }
            };
            
            document.addEventListener('keydown', keyHandler);
            
            // Store reference for cleanup
            this._keyHandler = keyHandler;
        }

        async loadSettings() {
            return new Promise(resolve => {
                chrome.storage.sync.get([
                    'performanceMode', 
                    'useOllama',
                    'confidenceThreshold'
                ], (result) => {
                    const performanceToggle = this.ui.querySelector('#performance-mode-toggle');
                    const ollamaToggle = this.ui.querySelector('#ollama-mode-toggle');
                    
                    if (performanceToggle) {
                        performanceToggle.checked = result.performanceMode === 'fast';
                    }
                    if (ollamaToggle) {
                        ollamaToggle.checked = !!result.useOllama;
                    }
                    resolve();
                });
            });
        }

        updateSetting(key, value) {
            chrome.storage.sync.set({ [key]: value }, () => {
                this.updateStatus(`Setting saved: ${key}`);
                
                // Update AI instance if it exists
                if (this.fashionAI) {
                    this.fashionAI.updateSettings({ [key]: value });
                }
            });
        }

        toggleSettings() {
            const settingsPanel = this.ui.querySelector('.fashion-ai-settings');
            const statsPanel = this.ui.querySelector('.fashion-ai-stats');
            
            if (!settingsPanel || !statsPanel) return;
            
            const isVisible = settingsPanel.style.display !== 'none';
            settingsPanel.style.display = isVisible ? 'none' : 'block';
            statsPanel.style.display = isVisible ? 'none' : 'block';
            
            if (!isVisible) {
                this.updatePerformanceStats();
            }
        }

        handleQueryInput(value) {
            // Provide smart suggestions or validation
            if (value.length > 3) {
                this.showQuerySuggestions(value);
            }
        }

        showQuerySuggestions(query) {
            // Simple query enhancement suggestions
            const suggestions = [];
            
            if (!query.includes('$') && !query.includes('price')) {
                suggestions.push('💡 Add price range like "under $50" for better results');
            }
            
            if (!this.hasColorWord(query)) {
                suggestions.push('💡 Specify colors like "black", "blue", "white"');
            }
            
            if (suggestions.length > 0 && Math.random() < 0.3) {
                this.updateStatus(suggestions[0]);
            }
        }

        hasColorWord(text) {
            const colors = ['black', 'white', 'red', 'blue', 'green', 'yellow', 'brown', 'gray', 'pink', 'purple'];
            return colors.some(color => text.toLowerCase().includes(color));
        }

        async startSearch() {
            if (this.isSearching) {
                this.updateStatus('⏳ Please wait for current search to complete...');
                return;
            }

            const queryInput = this.ui.querySelector('#fashion-ai-query-input');
            if (!queryInput) {
                this.updateStatus('❌ UI error: Input not found');
                return;
            }

            const query = queryInput.value.trim();
            if (!query) {
                this.updateStatus('❌ Please enter a search query');
                return;
            }

            console.log('Starting enhanced search for:', query);
            this.isSearching = true;
            this.currentQuery = query;
            
            // Add to search history
            this.addToSearchHistory(query);
            
            // Update UI state
            this.updateSearchButton(true);
            this.updateStatus('🤖 Initializing AI models...');

            try {
                // Initialize AI if needed
                if (!this.fashionAI) {
                    if (!window.ProductFinder) {
                        throw new Error('ProductFinder class not available - please refresh the page');
                    }
                    
                    console.log('Creating ProductFinder instance');
                    this.fashionAI = new window.ProductFinder((status) => this.updateStatus(status));
                    await this.fashionAI.initialize();
                }
                
                // Start the search
                this.updateStatus('🔍 Analyzing page for fashion products...');
                const startTime = performance.now();
                
                await this.fashionAI.findMatchingProducts(query);
                
                const endTime = performance.now();
                const duration = Math.round(endTime - startTime);
                
                this.performanceStats.lastSearchDuration = duration;
                this.updateStatus(`✅ Search complete in ${duration}ms. Found matches for "${query}".`);
                
                // Update performance stats
                this.updatePerformanceStats();
                
            } catch (error) {
                console.error('Search failed:', error);
                this.updateStatus(`❌ Search failed: ${error.message}`);
                
                // If it's a critical error, suggest refresh
                if (error.message.includes('ProductFinder')) {
                    setTimeout(() => {
                        this.updateStatus('💡 Try refreshing the page if the error persists');
                    }, 3000);
                }
            } finally {
                this.isSearching = false;
                this.updateSearchButton(false);
            }
        }

        updateSearchButton(isLoading) {
            const button = this.ui.querySelector('#fashion-ai-search-button');
            if (!button) return;
            
            if (isLoading) {
                button.innerHTML = '<span class="fashion-ai-loading"></span>Finding...';
                button.disabled = true;
            } else {
                button.innerHTML = 'Find';
                button.disabled = false;
            }
        }

        updateStatus(message) {
            const statusEl = this.ui.querySelector('#fashion-ai-status');
            if (!statusEl) return;
            
            statusEl.textContent = message;
            
            // Auto-clear certain messages
            if (message.includes('Setting saved') || message.includes('💡')) {
                setTimeout(() => {
                    if (statusEl.textContent === message) {
                        statusEl.textContent = 'Ready to search for fashion items.';
                    }
                }, 3000);
            }
        }

        showWelcomeMessage() {
            const messages = [
                'Ready to find your perfect fashion items! 👗',
                'Search for anything: "black boots", "vintage denim", "minimalist dress" 🔍',
                'Try: "red sneakers under $100" or "formal blazer size M" 💫',
                'Pro tip: Use keyboard shortcut Ctrl+Shift+F to toggle 🚀'
            ];
            
            const message = messages[Math.floor(Math.random() * messages.length)];
            this.updateStatus(message);
        }

        addToSearchHistory(query) {
            this.searchHistory.unshift(query);
            this.searchHistory = this.searchHistory.slice(0, 10); // Keep last 10
            
            // Save to storage
            chrome.storage.local.set({ 
                fashionAISearchHistory: this.searchHistory 
            });
        }

        loadSearchHistory() {
            chrome.storage.local.get(['fashionAISearchHistory'], (result) => {
                this.searchHistory = result.fashionAISearchHistory || [];
            });
        }

        updatePerformanceStats() {
            const statsEl = this.ui.querySelector('#fashion-ai-stats');
            if (!statsEl) return;
            
            if (!this.fashionAI) {
                statsEl.textContent = 'No performance data available';
                return;
            }
            
            const stats = this.fashionAI.getPerformanceStats();
            if (stats) {
                const memoryInfo = stats.memory ? 
                    `Memory: ${stats.memory.used}MB` : 'Memory: N/A';
                
                const lastDuration = this.performanceStats.lastSearchDuration || 0;
                
                statsEl.innerHTML = `
                    Instance: ${this.instanceId.substr(-6)}<br>
                    Last Search: ${lastDuration}ms | ${memoryInfo}<br>
                    Searches: ${this.searchHistory.length} | Cache Size: ${Object.keys(stats.counters || {}).length}
                `;
            }
        }

        clearHighlights() {
            if (this.fashionAI) {
                this.fashionAI.clearHighlights();
                this.updateStatus('🧹 Highlights cleared');
            }
        }

        getPerformanceStats() {
            return {
                instanceId: this.instanceId,
                searchHistory: this.searchHistory,
                performanceStats: this.performanceStats,
                aiStats: this.fashionAI ? this.fashionAI.getPerformanceStats() : null,
                isInitialized: !!this.fashionAI,
                isVisible: this.isVisible
            };
        }

        // Cleanup method
        destroy() {
            if (this._keyHandler) {
                document.removeEventListener('keydown', this._keyHandler);
            }
            if (this.ui && this.ui.parentElement) {
                this.ui.remove();
            }
            if (this.fashionAI && this.fashionAI.clearHighlights) {
                this.fashionAI.clearHighlights();
            }
        }
    }

    // Auto-initialize on specific e-commerce sites
    function shouldAutoInitialize() {
        const ecommerceDomains = [
            'amazon.com', 'zara.com', 'hm.com', 'uniqlo.com', 
            'nike.com', 'adidas.com', 'ssense.com', 'asos.com',
            'nordstrom.com', 'macys.com', 'shopify.com'
        ];
        
        return ecommerceDomains.some(domain => 
            window.location.hostname.includes(domain)
        );
    }

    // Performance monitoring
    function monitorPagePerformance() {
        // Monitor page load performance
        window.addEventListener('load', () => {
            const perfData = performance.getEntriesByType('navigation')[0];
            if (perfData) {
                console.log('Fashion AI - Page Load Performance:', {
                    loadTime: Math.round(perfData.loadEventEnd - perfData.loadEventStart),
                    domContentLoaded: Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart)
                });
            }
        });
    }

    // Debug helper removed for simplicity - use console diagnostics instead

    // Initialize performance monitoring
    monitorPagePerformance();

    // Show subtle notification on e-commerce sites
    if (shouldAutoInitialize() && !sessionStorage.getItem('fashionAINotificationShown')) {
        setTimeout(() => {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                padding: 12px 16px;
                border-radius: 8px;
                z-index: 100000;
                font-family: system-ui, -apple-system, sans-serif;
                font-size: 13px;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
                animation: slideInUp 0.5s ease-out;
            `;
            
            notification.innerHTML = `
                🛍 <strong>AI Fashion Finder</strong> detected!<br>
                <small>Click extension icon or press Ctrl+Shift+F</small>
            `;
            
            notification.onclick = () => notification.remove();
            document.body.appendChild(notification);
            
            setTimeout(() => notification.remove(), 8000);
            sessionStorage.setItem('fashionAINotificationShown', 'true');
        }, 3000);
    }

    // Add enhanced animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInUp {
            from {
                transform: translateY(100%);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
        
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    // Add global diagnostic function for troubleshooting
    window.debugFashionAIContent = () => {
        console.log('=== Fashion AI Content Script Debug ===');
        console.log('Instance ID:', INSTANCE_ID);
        console.log('Has Run:', window.hasRunFashionAI);
        console.log('ProductFinder Available:', !!window.ProductFinder);
        console.log('Instance Initialized:', isInitialized);
        console.log('Initialization In Progress:', initializationInProgress);
        if (fashionAISearchInstance) {
            console.log('Search Instance:', fashionAISearchInstance);
            console.log('Is Visible:', fashionAISearchInstance.isVisible);
        }
        return { INSTANCE_ID, isInitialized, initializationInProgress, hasProductFinder: !!window.ProductFinder };
    };

    console.log('Fashion AI Content Script Loaded Successfully! 🚀 Instance ID:', INSTANCE_ID);
    console.log('Run window.debugFashionAIContent() for diagnostics');
})();