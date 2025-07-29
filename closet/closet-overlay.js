// Digital Closet Auto-Detection Overlay (Like Locker/Honey)
class ClosetOverlay {
    constructor() {
        this.isProductPage = false;
        this.overlayShown = false;
        this.detectedItem = null;
        this.overlay = null;
        this.checkInterval = null;
        this.observing = false;
        this.processedItems = new Set(); // Track items we've already shown
        this.dismissedItems = new Set(); // Track items user dismissed
        this.currentItemId = null;
        
        // DISABLED: Automatic overlay detection removed
        // Users can now only add items manually through the floating icon
        // this.init();
        
        // Only initialize message listeners for manual detection
        this.initMessageListeners();
    }
    
    initMessageListeners() {
        // Handle messages from popup for manual item detection
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.type === 'DETECT_ITEM') {
                this.detectItem().then(item => {
                    sendResponse({ success: true, item: item });
                }).catch(error => {
                    sendResponse({ success: false, error: error.message });
                });
                return true;
            }
        });
        
        console.log('🔍 Digital Closet manual item detection available (automatic overlay disabled)');
    }
    
    init() {
        // DISABLED: Automatic detection removed to prevent annoying popups
        /*
        console.log('🔍 Digital Closet auto-detection initialized');
        
        // Load dismissed items from storage
        this.loadDismissedItems();
        
        // Wait for page to load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.startDetection());
        } else {
            this.startDetection();
        }
        */
        
        // Handle messages from popup
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.type === 'DETECT_ITEM') {
                this.detectItem().then(item => {
                    sendResponse({ success: true, item: item });
                }).catch(error => {
                    sendResponse({ success: false, error: error.message });
                });
                return true;
            }
        });
    }
    
    async loadDismissedItems() {
        // DISABLED: Local storage removed - using API-based authentication instead
        // Dismissed items are no longer needed since overlay is disabled
        try {
            console.log('Dismissed items tracking disabled - overlay functionality removed');
        } catch (error) {
            console.log('Could not load dismissed items:', error);
        }
    }
    
    async saveDismissedItems() {
        // DISABLED: Local storage removed - using API-based authentication instead
        try {
            console.log('Dismissed items saving disabled - overlay functionality removed');
        } catch (error) {
            console.log('Could not save dismissed items:', error);
        }
    }
    
    // DISABLED: Automatic detection methods
    /*
    startDetection() {
        // Check immediately
        this.checkForProduct();
        
        // Check periodically for dynamic content (less aggressive)
        this.checkInterval = setInterval(() => {
            this.checkForProduct();
        }, 5000);
        
        // Watch for URL changes (SPA navigation)
        this.watchForUrlChanges();
        
        // Watch for DOM changes
        this.setupMutationObserver();
    }
    */
    
    // DISABLED: Automatic product checking
    /*
    async checkForProduct() {
        const wasProductPage = this.isProductPage;
        this.isProductPage = this.detectIfProductPage();
        
        if (this.isProductPage && !this.overlayShown) {
            // New product detected!
            try {
                this.detectedItem = await this.detectItem();
                this.currentItemId = this.generateItemId(this.detectedItem);
                
                // Check if we've already processed or dismissed this item
                if (this.processedItems.has(this.currentItemId) || 
                    this.dismissedItems.has(this.currentItemId)) {
                    console.log('Item already processed or dismissed:', this.currentItemId);
                    return;
                }
                
                // Check if item has sufficient data to warrant showing
                if (this.shouldShowItem(this.detectedItem)) {
                    this.processedItems.add(this.currentItemId);
                    this.showOverlay();
                } else {
                    console.log('Item does not meet quality threshold:', this.detectedItem.title);
                }
            } catch (error) {
                console.error('Failed to detect item:', error);
            }
        } else if (!this.isProductPage && this.overlayShown) {
            // No longer on product page
            this.hideOverlay();
        }
    }
    */
    
    generateItemId(item) {
        // Create a unique ID based on title + URL to prevent duplicates
        const title = (item.title || '').toLowerCase().trim();
        const url = window.location.href.split('?')[0]; // Remove query params
        return btoa(title + '|' + url).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
    }
    
    shouldShowItem(item) {
        // Only show items that have sufficient data
        const hasTitle = item.title && item.title.trim().length > 3;
        const hasImage = item.imageUrl && item.imageUrl.length > 0;
        const hasPrice = item.price && item.price.length > 0;
        
        // At least title + (image OR price)
        return hasTitle && (hasImage || hasPrice);
    }
    
    detectIfProductPage() {
        // Quick heuristics to detect if this is a product page
        const url = window.location.href.toLowerCase();
        const title = document.title.toLowerCase();
        const bodyText = document.body.textContent.toLowerCase();
        
        // URL-based detection
        const productUrlPatterns = [
            '/product/',
            '/item/',
            '/p/',
            '/dp/',
            '/products/',
            'product-',
            'item-',
            '/shop/',
            '/buy/'
        ];
        
        const hasProductUrl = productUrlPatterns.some(pattern => url.includes(pattern));
        
        // Price detection
        const hasPriceElements = document.querySelectorAll('[class*="price"], [class*="cost"], [data-testid*="price"]').length > 0;
        const hasPriceText = /\$[\d,]+\.?\d*/.test(bodyText);
        
        // Product schema detection
        const hasProductSchema = document.querySelector('[itemtype*="Product"], [itemtype*="product"]') !== null;
        
        // Add to cart buttons
        const hasAddToCart = document.querySelectorAll('[class*="add-to-cart"], [class*="buy-now"], [class*="add-to-bag"]').length > 0;
        
        // E-commerce indicators
        const ecommerceKeywords = ['add to cart', 'buy now', 'add to bag', 'purchase', 'select size', 'select color'];
        const hasEcommerceKeywords = ecommerceKeywords.some(keyword => bodyText.includes(keyword));
        
        // Size/color selectors
        const hasSizeSelectors = document.querySelectorAll('select[class*="size"], [class*="size-selector"], [class*="color-selector"]').length > 0;
        
        // Combined scoring
        let score = 0;
        if (hasProductUrl) score += 3;
        if (hasProductSchema) score += 3;
        if (hasPriceElements) score += 2;
        if (hasPriceText) score += 1;
        if (hasAddToCart) score += 2;
        if (hasEcommerceKeywords) score += 1;
        if (hasSizeSelectors) score += 1;
        
        // Be more strict - require higher confidence
        return score >= 5;
    }
    
    async detectItem() {
        return {
            title: this.detectTitle(),
            price: this.detectPrice(),
            imageUrl: this.detectImage(),
            brand: this.detectBrand(),
            color: this.detectColor(),
            originalUrl: window.location.href,
            source: window.location.hostname,
            category: this.detectCategory(),
            size: this.detectSize(),
            notes: ''
        };
    }
    
    showOverlay() {
        if (this.overlayShown || !this.detectedItem) return;
        
        this.createOverlay();
        this.overlayShown = true;
        
        // Animate in
        setTimeout(() => {
            if (this.overlay) {
                this.overlay.classList.add('closet-overlay-show');
            }
        }, 100);
        
        console.log('✨ Showing Digital Closet overlay for:', this.detectedItem.title);
    }
    
    createOverlay() {
        // Remove existing overlay
        this.removeOverlay();
        
        // Create overlay HTML
        this.overlay = document.createElement('div');
        this.overlay.className = 'closet-overlay';
        this.overlay.innerHTML = `
            <div class="closet-overlay-content">
                <div class="closet-overlay-header">
                    <div class="closet-overlay-icon">👗</div>
                    <div class="closet-overlay-text">
                        <h4>Add to Digital Closet</h4>
                        <p>We found this item!</p>
                    </div>
                    <button class="closet-overlay-close">&times;</button>
                </div>
                <div class="closet-overlay-item">
                    <img src="${this.detectedItem.imageUrl || ''}" alt="Item" class="closet-overlay-item-image" onerror="this.style.display='none'">
                    <div class="closet-overlay-item-info">
                        <h5 class="closet-overlay-item-title">${this.escapeHtml(this.detectedItem.title)}</h5>
                        <p class="closet-overlay-item-details">
                            ${this.detectedItem.price ? '$' + this.detectedItem.price : 'Price not detected'} 
                            ${this.detectedItem.brand ? '• ' + this.detectedItem.brand : ''}
                        </p>
                    </div>
                </div>
                <div class="closet-overlay-actions">
                    <select class="closet-overlay-status">
                        <option value="want">Want</option>
                        <option value="purchased">Purchased</option>
                    </select>
                    <button class="closet-overlay-dismiss">Not Now</button>
                    <button class="closet-overlay-add">Add to Closet</button>
                </div>
            </div>
        `;
        
        // Add styles if not already added
        this.addOverlayStyles();
        
        // Add event listeners
        this.overlay.querySelector('.closet-overlay-close').addEventListener('click', () => this.hideOverlay());
        this.overlay.querySelector('.closet-overlay-dismiss').addEventListener('click', () => this.dismissItem());
        this.overlay.querySelector('.closet-overlay-add').addEventListener('click', () => this.addToCloset());
        
        // Add to page
        document.body.appendChild(this.overlay);
    }
    
    addOverlayStyles() {
        if (document.getElementById('closet-overlay-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'closet-overlay-styles';
        styles.textContent = `
            .closet-overlay {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 350px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
                z-index: 2147483647;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                transform: translateX(400px);
                opacity: 0;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                border: 1px solid #e0e0e0;
            }
            
            .closet-overlay-show {
                transform: translateX(0);
                opacity: 1;
            }
            
            .closet-overlay-content {
                padding: 16px;
            }
            
            .closet-overlay-header {
                display: flex;
                align-items: center;
                margin-bottom: 12px;
                gap: 12px;
            }
            
            .closet-overlay-icon {
                font-size: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 40px;
                height: 40px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 50%;
                color: white;
                flex-shrink: 0;
            }
            
            .closet-overlay-text {
                flex: 1;
            }
            
            .closet-overlay-text h4 {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
                color: #333;
            }
            
            .closet-overlay-text p {
                margin: 2px 0 0 0;
                font-size: 13px;
                color: #666;
            }
            
            .closet-overlay-close {
                background: none;
                border: none;
                font-size: 20px;
                color: #999;
                cursor: pointer;
                padding: 4px;
                line-height: 1;
                border-radius: 4px;
                transition: all 0.2s ease;
            }
            
            .closet-overlay-close:hover {
                background: #f0f0f0;
                color: #333;
            }
            
            .closet-overlay-item {
                display: flex;
                gap: 12px;
                margin-bottom: 16px;
                padding: 12px;
                background: #f8f9fa;
                border-radius: 8px;
                border: 1px solid #e9ecef;
            }
            
            .closet-overlay-item-image {
                width: 50px;
                height: 50px;
                object-fit: cover;
                border-radius: 6px;
                background: #ddd;
                flex-shrink: 0;
            }
            
            .closet-overlay-item-info {
                flex: 1;
                min-width: 0;
            }
            
            .closet-overlay-item-title {
                margin: 0 0 4px 0;
                font-size: 14px;
                font-weight: 600;
                color: #333;
                line-height: 1.3;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }
            
            .closet-overlay-item-details {
                margin: 0;
                font-size: 12px;
                color: #666;
            }
            
            .closet-overlay-actions {
                display: flex;
                gap: 8px;
                align-items: center;
            }
            
            .closet-overlay-status {
                flex: 1;
                padding: 8px 12px;
                border: 1px solid #ddd;
                border-radius: 6px;
                font-size: 13px;
                background: white;
                cursor: pointer;
            }
            
            .closet-overlay-dismiss {
                background: #6c757d;
                color: white;
                border: none;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                white-space: nowrap;
            }
            
            .closet-overlay-dismiss:hover {
                background: #5a6268;
            }
            
            .closet-overlay-add {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                white-space: nowrap;
            }
            
            .closet-overlay-add:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
            }
            
            .closet-overlay-add:active {
                transform: translateY(0);
            }
            
            @media (max-width: 480px) {
                .closet-overlay {
                    right: 10px;
                    left: 10px;
                    width: auto;
                    transform: translateY(-400px);
                }
                
                .closet-overlay-show {
                    transform: translateY(0);
                }
            }
        `;
        
        document.head.appendChild(styles);
    }
    
    async addToCloset() {
        const status = this.overlay.querySelector('.closet-overlay-status').value;
        
        // Prepare item data
        const itemData = {
            ...this.detectedItem,
            id: this.generateId(),
            status: status,
            category: this.detectedItem.category || 'other',
            dateAdded: new Date().toISOString(),
            datePurchased: status === 'purchased' ? new Date().toISOString() : null
        };
        
        try {
            // DISABLED: Local storage removed - would need API integration
            // Since overlay is disabled, this code path is not used
            console.log('Overlay addToCloset disabled - use extension popup instead');
            
            // Mark this item as dismissed so it won't show again
            if (this.currentItemId) {
                this.dismissedItems.add(this.currentItemId);
                await this.saveDismissedItems();
            }
            
            // Show success feedback
            this.showSuccessMessage();
            
            // Hide overlay after delay
            setTimeout(() => this.hideOverlay(), 2000);
            
            console.log('✅ Item added to Digital Closet:', itemData);
            
        } catch (error) {
            console.error('Failed to add item to closet:', error);
            this.showErrorMessage();
        }
    }
    
    async dismissItem() {
        if (this.currentItemId) {
            // Mark this item as dismissed
            this.dismissedItems.add(this.currentItemId);
            await this.saveDismissedItems();
            console.log('Item dismissed:', this.currentItemId);
        }
        
        // Hide overlay
        this.hideOverlay();
    }
    
    showSuccessMessage() {
        const addButton = this.overlay.querySelector('.closet-overlay-add');
        const originalText = addButton.textContent;
        addButton.textContent = '✅ Added!';
        addButton.style.background = '#28a745';
        addButton.disabled = true;
        
        setTimeout(() => {
            if (addButton) {
                addButton.textContent = originalText;
                addButton.style.background = '';
                addButton.disabled = false;
            }
        }, 2000);
    }
    
    showErrorMessage() {
        const addButton = this.overlay.querySelector('.closet-overlay-add');
        const originalText = addButton.textContent;
        addButton.textContent = '❌ Error';
        addButton.style.background = '#dc3545';
        
        setTimeout(() => {
            if (addButton) {
                addButton.textContent = originalText;
                addButton.style.background = '';
            }
        }, 2000);
    }
    
    hideOverlay() {
        if (!this.overlay) return;
        
        this.overlay.classList.remove('closet-overlay-show');
        
        setTimeout(() => {
            this.removeOverlay();
        }, 300);
        
        this.overlayShown = false;
    }
    
    removeOverlay() {
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
        this.overlay = null;
    }
    
    // DISABLED: Automatic URL watching and DOM observation
    /*
    watchForUrlChanges() {
        let currentUrl = window.location.href;
        
        const checkForUrlChange = () => {
            if (window.location.href !== currentUrl) {
                currentUrl = window.location.href;
                this.hideOverlay();
                
                // Clear processed items for new page (but keep dismissed items)
                this.processedItems.clear();
                this.currentItemId = null;
                
                // Check new page after brief delay
                setTimeout(() => this.checkForProduct(), 1000);
            }
        };
        
        // Check for URL changes
        setInterval(checkForUrlChange, 1000);
        
        // Listen for popstate events
        window.addEventListener('popstate', checkForUrlChange);
    }
    
    setupMutationObserver() {
        if (this.observing) return;
        
        const observer = new MutationObserver((mutations) => {
            let shouldRecheck = false;
            
            mutations.forEach((mutation) => {
                // Check if significant DOM changes occurred
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    shouldRecheck = true;
                }
            });
            
            if (shouldRecheck) {
                // Debounce the recheck
                clearTimeout(this.recheckTimeout);
                this.recheckTimeout = setTimeout(() => {
                    this.checkForProduct();
                }, 1000);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        this.observing = true;
    }
    */
    
    // Utility methods for item detection
    detectTitle() {
        let title = document.title;
        
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle && ogTitle.content) {
            title = ogTitle.content;
        }
        
        const schemaTitle = document.querySelector('[itemprop="name"]');
        if (schemaTitle) {
            title = schemaTitle.textContent || schemaTitle.innerText;
        }
        
        // Clean up title
        title = title.replace(/\s+/g, ' ').trim();
        const siteName = window.location.hostname.replace('www.', '');
        const cleanPatterns = [
            new RegExp(`\\s*[\\|\\-]\\s*${siteName}.*$`, 'i'),
            new RegExp(`\\s*[\\|\\-]\\s*buy.*$`, 'i'),
            new RegExp(`\\s*[\\|\\-]\\s*shop.*$`, 'i')
        ];
        
        for (const pattern of cleanPatterns) {
            title = title.replace(pattern, '');
        }
        
        return title.trim() || 'Untitled Item';
    }
    
    detectPrice() {
        const schemaPrice = document.querySelector('[itemprop="price"]');
        if (schemaPrice) {
            return schemaPrice.textContent || schemaPrice.getAttribute('content');
        }
        
        const priceSelectors = ['[class*="price"]', '[data-testid*="price"]', '[class*="cost"]'];
        for (const selector of priceSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent) {
                const text = element.textContent.trim();
                const priceMatch = text.match(/\$[\d,]+\.?\d*/);
                if (priceMatch) {
                    return priceMatch[0].replace(/[^\d.,]/g, '');
                }
            }
        }
        
        return '';
    }
    
    detectImage() {
        const ogImage = document.querySelector('meta[property="og:image"]');
        if (ogImage && ogImage.content) {
            return ogImage.content;
        }
        
        const schemaImage = document.querySelector('[itemprop="image"]');
        if (schemaImage) {
            return schemaImage.src || schemaImage.getAttribute('content');
        }
        
        const images = Array.from(document.querySelectorAll('img'));
        const validImages = images.filter(img => 
            img.src && 
            !img.src.includes('data:') &&
            img.naturalWidth > 100 &&
            img.naturalHeight > 100
        );
        
        if (validImages.length > 0) {
            validImages.sort((a, b) => 
                (b.naturalWidth * b.naturalHeight) - (a.naturalWidth * a.naturalHeight)
            );
            return validImages[0].src;
        }
        
        return '';
    }
    
    detectBrand() {
        const schemaBrand = document.querySelector('[itemprop="brand"]');
        if (schemaBrand) {
            return schemaBrand.textContent || schemaBrand.getAttribute('content');
        }
        
        const url = window.location.hostname.toLowerCase();
        const commonBrands = ['nike', 'adidas', 'zara', 'h&m', 'uniqlo', 'amazon'];
        
        for (const brandName of commonBrands) {
            if (url.includes(brandName)) {
                return brandName.charAt(0).toUpperCase() + brandName.slice(1);
            }
        }
        
        return '';
    }
    
    detectColor() {
        const colorKeywords = ['black', 'white', 'red', 'blue', 'green', 'yellow', 'pink', 'purple', 'brown', 'gray', 'navy'];
        const pageText = document.body.textContent.toLowerCase();
        
        for (const color of colorKeywords) {
            if (pageText.includes(color)) {
                return color.charAt(0).toUpperCase() + color.slice(1);
            }
        }
        
        return '';
    }
    
    detectCategory() {
        const pageText = document.body.textContent.toLowerCase();
        const url = window.location.href.toLowerCase();
        const title = (document.title || '').toLowerCase();
        const metaKeywords = (document.querySelector('meta[name="keywords"]')?.content || '').toLowerCase();
        const breadcrumbs = this.getBreadcrumbText().toLowerCase();
        
        // Enhanced category detection with scoring system
        const categoryKeywords = {
            'shoes': {
                primary: ['shoes', 'sneakers', 'boots', 'sandals', 'heels', 'loafers', 'flats', 'pumps', 'oxfords', 'trainers', 'footwear'],
                secondary: ['nike', 'adidas', 'jordan', 'converse', 'vans', 'puma', 'running', 'basketball', 'athletic'],
                patterns: [/\b\w+\s+shoes?\b/, /\b\w+\s+boots?\b/, /\b\w+\s+sneakers?\b/],
                urlPatterns: ['/shoes/', '/footwear/', '/sneakers/', '/boots/']
            },
            'tops': {
                primary: ['shirt', 'blouse', 'top', 'tee', 't-shirt', 'tank', 'polo', 'sweater', 'cardigan', 'pullover'],
                secondary: ['cotton', 'sleeve', 'collar', 'button', 'crew neck', 'v-neck'],
                patterns: [/\b\w+\s+shirt\b/, /\b\w+\s+top\b/, /\b\w+\s+tee\b/],
                urlPatterns: ['/shirts/', '/tops/', '/blouses/', '/sweaters/']
            },
            'bottoms': {
                primary: ['pants', 'jeans', 'trousers', 'shorts', 'leggings', 'chinos', 'slacks', 'joggers'],
                secondary: ['waist', 'inseam', 'denim', 'khaki', 'cargo'],
                patterns: [/\b\w+\s+pants?\b/, /\b\w+\s+jeans?\b/],
                urlPatterns: ['/pants/', '/jeans/', '/bottoms/', '/shorts/']
            },
            'outerwear': {
                primary: ['jacket', 'coat', 'blazer', 'hoodie', 'windbreaker', 'parka', 'vest', 'cardigan'],
                secondary: ['zip', 'hood', 'layer', 'weather', 'outdoor'],
                patterns: [/\b\w+\s+jacket\b/, /\b\w+\s+coat\b/],
                urlPatterns: ['/jackets/', '/coats/', '/outerwear/']
            },
            'dresses': {
                primary: ['dress', 'gown', 'frock', 'sundress', 'maxi', 'midi', 'mini'],
                secondary: ['occasion', 'formal', 'cocktail', 'evening'],
                patterns: [/\b\w+\s+dress\b/],
                urlPatterns: ['/dresses/', '/gowns/']
            },
            'accessories': {
                primary: ['bag', 'purse', 'wallet', 'belt', 'hat', 'cap', 'scarf', 'gloves', 'jewelry', 'watch', 'sunglasses'],
                secondary: ['leather', 'strap', 'buckle', 'chain', 'clasp'],
                patterns: [/\b\w+\s+bag\b/, /\b\w+\s+wallet\b/],
                urlPatterns: ['/bags/', '/accessories/', '/jewelry/']
            },
            'underwear': {
                primary: ['underwear', 'bra', 'panties', 'boxers', 'briefs', 'lingerie', 'socks', 'stockings', 'tights'],
                secondary: ['intimate', 'undergarment'],
                patterns: [],
                urlPatterns: ['/underwear/', '/lingerie/', '/intimates/']
            }
        };
        
        const scores = {};
        
        // Initialize scores
        for (const category of Object.keys(categoryKeywords)) {
            scores[category] = 0;
        }
        
        // Combine all text sources for analysis
        const allText = [pageText, url, title, metaKeywords, breadcrumbs].join(' ').toLowerCase();
        
        // Score each category
        for (const [category, keywords] of Object.entries(categoryKeywords)) {
            // Primary keywords (high weight)
            for (const keyword of keywords.primary) {
                const count = (allText.match(new RegExp(keyword, 'g')) || []).length;
                scores[category] += count * 10;
                
                // Extra points for title/URL matches
                if (title.includes(keyword)) scores[category] += 15;
                if (url.includes(keyword)) scores[category] += 12;
                if (breadcrumbs.includes(keyword)) scores[category] += 8;
            }
            
            // Secondary keywords (medium weight)
            for (const keyword of keywords.secondary) {
                const count = (allText.match(new RegExp(keyword, 'g')) || []).length;
                scores[category] += count * 3;
            }
            
            // Pattern matching (medium weight)
            for (const pattern of keywords.patterns) {
                const matches = allText.match(pattern) || [];
                scores[category] += matches.length * 5;
            }
            
            // URL pattern matching (high weight)
            for (const urlPattern of keywords.urlPatterns) {
                if (url.includes(urlPattern)) {
                    scores[category] += 20;
                }
            }
        }
        
        // Special case adjustments
        this.applySpecialCategoryRules(scores, allText, url);
        
        // Find the highest scoring category
        let bestCategory = 'other';
        let highestScore = 0;
        
        for (const [category, score] of Object.entries(scores)) {
            if (score > highestScore) {
                highestScore = score;
                bestCategory = category;
            }
        }
        
        // Only return a category if we have reasonable confidence
        return highestScore >= 3 ? bestCategory : 'other';
    }
    
    getBreadcrumbText() {
        // Try to find breadcrumb navigation
        const breadcrumbSelectors = [
            'nav[aria-label*="breadcrumb"]',
            '.breadcrumb',
            '.breadcrumbs',
            '[class*="breadcrumb"]',
            'ol.breadcrumb',
            'ul.breadcrumb'
        ];
        
        for (const selector of breadcrumbSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                return element.textContent || '';
            }
        }
        
        return '';
    }
    
    applySpecialCategoryRules(scores, allText, url) {
        // Shoe-specific adjustments
        if (allText.includes('size') && (allText.includes('athletic') || allText.includes('sport'))) {
            scores.shoes += 5;
        }
        
        // If we see "men's shoes" or "women's shoes" patterns
        if (/\b(men'?s?|women'?s?|kids?)\s+(shoes?|sneakers?|boots?)\b/.test(allText)) {
            scores.shoes += 15;
        }
        
        // Brand-based shoe detection
        const shoebrands = ['nike', 'adidas', 'jordan', 'converse', 'vans', 'puma', 'reebok', 'new balance'];
        for (const brand of shoebrands) {
            if (allText.includes(brand)) {
                scores.shoes += 8;
            }
        }
        
        // Clothing size indicators that might conflict with shoes
        if (allText.includes('xs') || allText.includes('small') || allText.includes('medium') || allText.includes('large')) {
            // This could be clothing, reduce shoe score slightly if no other shoe indicators
            if (!allText.includes('sneaker') && !allText.includes('boot') && !url.includes('shoe')) {
                scores.shoes -= 2;
            }
        }
        
        // Dress/formal wear indicators
        if (allText.includes('occasion') || allText.includes('formal') || allText.includes('wedding')) {
            scores.dresses += 5;
        }
        
        // Athletic wear
        if (allText.includes('athletic') || allText.includes('sport') || allText.includes('gym')) {
            if (allText.includes('shirt') || allText.includes('top')) {
                scores.tops += 5;
            }
            if (allText.includes('pants') || allText.includes('shorts')) {
                scores.bottoms += 5;
            }
        }
    }
    
    detectSize() {
        const pageText = document.body.textContent;
        const sizeRegex = /\b(XXS|XS|S|M|L|XL|XXL)\b/gi;
        const matches = pageText.match(sizeRegex);
        return matches ? matches[0] : '';
    }
    
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    destroy() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        this.hideOverlay();
        const styles = document.getElementById('closet-overlay-styles');
        if (styles) styles.remove();
    }
}

// Initialize the overlay system
let closetOverlay = null;

// Only initialize on certain domains or when products are detected
if (window.location.hostname !== 'chrome-extension') {
    closetOverlay = new ClosetOverlay();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (closetOverlay) {
        closetOverlay.destroy();
    }
});
