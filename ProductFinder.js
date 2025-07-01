// ProductFinder.js - Advanced Fashion Product Detection & Analysis System

// Immediate export check and protection
if (window.ProductFinder) {
    console.log('ProductFinder already available, script execution complete');
} else {
    console.log('Loading ProductFinder classes for the first time...');

class ProductFinder {
    constructor(statusCallback) {
        this.statusCallback = statusCallback || (() => {});
        this.worker = null;
        
        // Advanced caching system
        this.productCache = new Map();
        this.imageCache = new Map();
        this.queryCache = new Map();
        
        // Performance optimization
        this.observer = null;
        this.mutationObserver = null;
        this.throttleTimer = null;
        this.batchProcessor = null;
        
        // State management
        this.currentQuery = null;
        this.parsedQuery = null;
        this.isProcessing = false;
        this.processedElements = new WeakSet();
        this.pendingAnalysis = new Map();
        
        // Settings
        this.settings = {
            useOllama: false,
            maxConcurrent: 5,
            batchSize: 10,
            confidenceThreshold: 0.25,
            performanceMode: 'balanced' // 'fast', 'balanced', 'accurate'
        };

        // Advanced product detection
        this.productDetector = new ProductDetector();
        this.performanceMonitor = new PerformanceMonitor();
    }

    async initialize() {
        this.statusCallback('Initializing AI Fashion Finder...');
        
        await this._loadSettings();
        await this._initializeWorker();
        await this._setupDynamicObservers();
        
        this.statusCallback('Fashion AI ready!');
    }

    async _loadSettings() {
        return new Promise(resolve => {
            chrome.storage.sync.get([
                'useOllama', 
                'maxConcurrent', 
                'confidenceThreshold',
                'performanceMode'
            ], (result) => {
                Object.assign(this.settings, result);
                resolve();
            });
        });
    }

    async _initializeWorker() {
        // Set up messaging to background script instead of direct worker
        this.workerReady = false;
        this.pendingWorkerRequests = new Map();
        
        // Listen for messages from background script
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.type === 'AI_INITIALIZATION_PROGRESS') {
                this.statusCallback(request.payload.status);
            } else if (request.type === 'AI_WORKER_RESPONSE') {
                this._handleWorkerResponse(request.originalType, request.payload);
            }
        });
        
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('AI Worker initialization timeout (30s)'));
            }, 180000); // 3 minutes for heavy AI model downloads

            // Check if worker is already ready by sending a test message
            this._sendWorkerMessage({ type: 'INITIALIZE' })
                .then(() => {
                    clearTimeout(timeout);
                    this.workerReady = true;
                    resolve();
                })
                .catch((error) => {
                    clearTimeout(timeout);
                    reject(error);
                });
        });
    }
    
    async _sendWorkerMessage(message) {
        return new Promise((resolve, reject) => {
            // Extended timeout for AI initialization
            const timeout = setTimeout(() => {
                reject(new Error('Worker message timeout (3m) - AI models may still be loading'));
            }, 180000); // 3 minutes for heavy AI model downloads
            
            chrome.runtime.sendMessage({
                type: 'AI_WORKER_REQUEST',
                workerMessage: message
            }, (response) => {
                clearTimeout(timeout);
                if (response && response.success !== false) {
                    resolve(response);
                } else {
                    const errorMsg = response?.error || 'Worker communication failed';
                    console.error('Worker communication error:', errorMsg);
                    reject(new Error(errorMsg));
                }
            });
        });
    }
    
    _handleWorkerResponse(type, payload) {
        console.log('ProductFinder received worker response:', type, payload);
        
        switch (type) {
            case 'READY':
                this.workerReady = true;
                break;
                
            case 'QUERY_PARSED':
                this._handleQueryParsed(payload);
                break;
                
            case 'ANALYSIS_COMPLETE':
                this._handleAnalysisComplete(payload);
                break;
                
            case 'ERROR':
                console.error('Worker error:', payload);
                this.statusCallback(`AI Error: ${payload.message}`);
                break;
        }
    }

    async _setupDynamicObservers() {
        // Intersection observer for visible products
        this.observer = new IntersectionObserver(
            (entries) => this._handleVisibleProducts(entries),
            { 
                rootMargin: '50px',
                threshold: [0.1, 0.5]
            }
        );

        // Mutation observer for dynamic content
        this.mutationObserver = new MutationObserver(
            (mutations) => this._handleDOMChanges(mutations)
        );

        this.mutationObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false
        });
    }

    async findMatchingProducts(query) {
        if (this.isProcessing) {
            this.statusCallback('Processing previous query...');
            return;
        }

        this.isProcessing = true;
        this.currentQuery = query;
        this.performanceMonitor.startTiming('totalSearch');

        try {
            // Clear previous results
            this._cleanupPreviousSearch();
            
            this.statusCallback('Parsing query...');
            
            // Check query cache
            if (this.queryCache.has(query)) {
                this.parsedQuery = this.queryCache.get(query);
                this._proceedWithCachedQuery();
            } else {
                // Parse query with AI via background script
                this.statusCallback('🤖 Initializing AI models (first time may take 30s)...');
                try {
                    await this._sendWorkerMessage({
                        type: 'PARSE_QUERY',
                        payload: { query, id: 'main' }
                    });
                } catch (error) {
                    console.error('Failed to send query parsing request:', error);
                    
                    if (error.message.includes('timeout') || error.message.includes('not ready')) {
                        this.statusCallback('❌ AI models still loading. Please wait and try again in a few moments.');
                    } else {
                        this.statusCallback('❌ Failed to parse query: ' + error.message);
                    }
                    this.isProcessing = false;
                }
            }
            
        } catch (error) {
            console.error('Search error:', error);
            this.statusCallback('Search failed: ' + error.message);
            this.isProcessing = false;
        }
    }

    _handleQueryParsed({ parsed, id }) {
        if (id === 'main') {
            this.parsedQuery = parsed;
            this.queryCache.set(this.currentQuery, parsed);
            this._proceedWithParsedQuery();
        }
    }

    async _proceedWithParsedQuery() {
        this.statusCallback('Detecting products on page...');
        
        // Advanced product detection
        const candidates = await this.productDetector.detectProducts();
        
        this.statusCallback(`Found ${candidates.length} potential products. Analyzing...`);
        
        if (candidates.length === 0) {
            this.statusCallback('No products found on this page.');
            this.isProcessing = false;
            return;
        }

        // Sort by priority (visible first, then by size)
        const prioritizedCandidates = this._prioritizeProducts(candidates);
        
        // Start batch processing
        this._processCandidatesBatch(prioritizedCandidates);
    }

    _proceedWithCachedQuery() {
        this.statusCallback('Using cached query analysis...');
        this._proceedWithParsedQuery();
    }

    _prioritizeProducts(candidates) {
        return candidates
            .map(el => ({
                element: el,
                rect: el.getBoundingClientRect(),
                isVisible: this._isElementVisible(el),
                priority: this._calculateElementPriority(el)
            }))
            .sort((a, b) => {
                if (a.isVisible && !b.isVisible) return -1;
                if (!a.isVisible && b.isVisible) return 1;
                return b.priority - a.priority;
            })
            .map(item => item.element);
    }

    _calculateElementPriority(element) {
        const rect = element.getBoundingClientRect();
        const area = rect.width * rect.height;
        const hasImage = !!element.querySelector('img');
        const hasPrice = /\$\d+/.test(element.textContent);
        
        return area * (hasImage ? 1.5 : 1) * (hasPrice ? 1.3 : 1);
    }

    async _processCandidatesBatch(candidates) {
        const batchSize = this.settings.batchSize;
        let processed = 0;
        
        for (let i = 0; i < candidates.length; i += batchSize) {
            const batch = candidates.slice(i, i + batchSize);
            
            // Process visible items first
            const visibleBatch = batch.filter(el => this._isElementVisible(el));
            const hiddenBatch = batch.filter(el => !this._isElementVisible(el));
            
            // Process visible items immediately
            if (visibleBatch.length > 0) {
                await this._processBatch(visibleBatch);
                processed += visibleBatch.length;
                this.statusCallback(`Analyzed ${processed}/${candidates.length} products...`);
            }
            
            // Set up intersection observer for hidden items
            hiddenBatch.forEach(el => {
                if (!this.processedElements.has(el)) {
                    this.observer.observe(el);
                }
            });

            // Throttle to prevent UI blocking
            if (i + batchSize < candidates.length) {
                await this._sleep(50);
            }
        }

        this.performanceMonitor.endTiming('totalSearch');
        const timing = this.performanceMonitor.getTimings();
        
        this.statusCallback(
            `Search complete! Found matches in ${timing.totalSearch.toFixed(0)}ms. ` +
            `${this._getResultsSummary()}`
        );
        
        this.isProcessing = false;
    }

    async _processBatch(elements) {
        const promises = elements.map(el => this._processElement(el));
        
        // Limit concurrent processing
        if (promises.length > this.settings.maxConcurrent) {
            for (let i = 0; i < promises.length; i += this.settings.maxConcurrent) {
                const chunk = promises.slice(i, i + this.settings.maxConcurrent);
                await Promise.allSettled(chunk);
            }
        } else {
            await Promise.allSettled(promises);
        }
    }

    async _processElement(element) {
        if (this.processedElements.has(element)) return;
        
        this.processedElements.add(element);
        
        const productData = this.productDetector.extractProductData(element);
        const cacheKey = this._generateCacheKey(productData);
        
        // Check cache
        if (this.productCache.has(cacheKey)) {
            const cached = this.productCache.get(cacheKey);
            this._updateProductHighlight(element, cached);
            return;
        }

        // Fallback to Ollama if configured and available
        if (this.settings.useOllama && productData.imageUrl) {
            try {
                const ollamaResult = await this._analyzeWithOllama(productData);
                this._handleAnalysisResult(element, ollamaResult, cacheKey);
                return;
            } catch (error) {
                console.warn('Ollama failed, using built-in AI:', error);
            }
        }

        // Use built-in AI via background script
        const analysisId = Math.random().toString(36).substr(2, 9);
        this.pendingAnalysis.set(analysisId, { element, cacheKey });
        
        try {
            await this._sendWorkerMessage({
                type: 'ANALYZE_PRODUCT',
                payload: {
                    id: analysisId,
                    productData,
                    parsedQuery: this.parsedQuery
                }
            });
        } catch (error) {
            console.error('Failed to analyze product:', error);
            this.pendingAnalysis.delete(analysisId);
        }
    }

    _handleAnalysisComplete(payload) {
        const { id, scores, confidence, reasoning, metadata } = payload;
        
        if (!this.pendingAnalysis.has(id)) return;
        
        const { element, cacheKey } = this.pendingAnalysis.get(id);
        this.pendingAnalysis.delete(id);
        
        const result = {
            scores,
            confidence,
            reasoning,
            metadata,
            finalScore: scores.final
        };
        
        this._handleAnalysisResult(element, result, cacheKey);
    }

    _handleAnalysisResult(element, result, cacheKey) {
        // Cache the result
        this.productCache.set(cacheKey, result);
        
        // Update UI
        this._updateProductHighlight(element, result);
    }

    _updateProductHighlight(element, result) {
        const { finalScore, confidence, reasoning } = result;
        
        // Only highlight if above threshold
        if (finalScore < this.settings.confidenceThreshold) {
            return;
        }

        // Remove existing highlight
        const existingOverlay = element.querySelector('.fashion-ai-highlight');
        if (existingOverlay) {
            existingOverlay.remove();
        }

        // Create new highlight
        const overlay = document.createElement('div');
        overlay.className = 'fashion-ai-highlight';
        
        // Position overlay
        element.style.position = element.style.position || 'relative';
        
        // Style based on confidence and score
        const color = this._getHighlightColor(finalScore, confidence);
        const matchPercentage = Math.round(finalScore * 100);
        
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: ${color};
            display: flex;
            align-items: center;
            justify-content: center;
            color: #000;
            font-weight: bold;
            font-size: 16px;
            text-shadow: 0 0 3px rgba(255,255,255,0.8);
            border-radius: inherit;
            pointer-events: none;
            z-index: 1000;
            border: 2px solid ${this._getBorderColor(finalScore)};
            box-shadow: 0 0 10px rgba(0,0,0,0.3);
        `;
        
        // Add content with match percentage and confidence indicator
        overlay.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 18px; margin-bottom: 2px;">
                    ${matchPercentage}% Match
                </div>
                <div style="font-size: 12px; opacity: 0.8;">
                    ${this._getConfidenceLabel(confidence)}
                </div>
            </div>
        `;
        
        // Add tooltip with reasoning
        overlay.title = `Match: ${matchPercentage}%\nConfidence: ${this._getConfidenceLabel(confidence)}\nReason: ${reasoning}`;
        
        element.appendChild(overlay);

        // Add click handler for detailed info
        overlay.addEventListener('click', (e) => {
            e.stopPropagation();
            this._showProductDetails(element, result);
        });
    }

    _getHighlightColor(score, confidence) {
        const alpha = Math.min(0.8, confidence + 0.3);
        
        if (score >= 0.8) return `rgba(50, 205, 50, ${alpha})`; // Green - Excellent match
        if (score >= 0.6) return `rgba(255, 215, 0, ${alpha})`; // Gold - Good match  
        if (score >= 0.4) return `rgba(255, 165, 0, ${alpha})`; // Orange - Fair match
        return `rgba(255, 255, 0, ${alpha})`; // Yellow - Low match
    }

    _getBorderColor(score) {
        if (score >= 0.8) return '#32CD32';
        if (score >= 0.6) return '#FFD700';
        if (score >= 0.4) return '#FFA500';
        return '#FFFF00';
    }

    _getConfidenceLabel(confidence) {
        if (confidence >= 0.8) return 'High';
        if (confidence >= 0.6) return 'Medium';
        if (confidence >= 0.4) return 'Low';
        return 'Very Low';
    }

    async _analyzeWithOllama(productData) {
        const imageData = await this._getBase64FromUrl(productData.imageUrl);
        
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llava',
                prompt: `Analyze this fashion product image and text for the query: "${this.currentQuery}".
                
Product text: "${productData.textContent}"

Rate the match from 0.0 to 1.0 and provide reasoning. Format: SCORE|REASONING`,
                images: [imageData],
                stream: false
            })
        });
        
        if (!response.ok) throw new Error('Ollama request failed');
        
        const data = await response.json();
        const [scoreStr, reasoning] = data.response.split('|');
        const score = parseFloat(scoreStr);
        
        if (isNaN(score)) throw new Error('Invalid Ollama response');
        
        return {
            finalScore: score,
            confidence: 0.8,
            reasoning: reasoning || 'Ollama analysis',
            scores: { final: score }
        };
    }

    async _getBase64FromUrl(url) {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            return new Promise(resolve => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result.split(',')[1]);
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            throw new Error('Failed to fetch image: ' + error.message);
        }
    }

    _handleVisibleProducts(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting && !this.processedElements.has(entry.target)) {
                this.observer.unobserve(entry.target);
                this._processElement(entry.target);
            }
        });
    }

    _handleDOMChanges(mutations) {
        if (!this.currentQuery || this.isProcessing) return;
        
        // Throttle DOM change processing
        if (this.throttleTimer) clearTimeout(this.throttleTimer);
        
        this.throttleTimer = setTimeout(() => {
            const newProducts = [];
            
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const products = this.productDetector.detectProductsInElement(node);
                        newProducts.push(...products);
                    }
                });
            });
            
            if (newProducts.length > 0) {
                this.statusCallback(`Found ${newProducts.length} new products...`);
                this._processCandidatesBatch(newProducts);
            }
        }, 1000);
    }

    _cleanupPreviousSearch() {
        // Remove existing highlights
        document.querySelectorAll('.fashion-ai-highlight').forEach(el => el.remove());
        
        // Clear processed elements
        this.processedElements = new WeakSet();
        
        // Clear pending analysis
        this.pendingAnalysis.clear();
        
        // Disconnect observers
        if (this.observer) {
            this.observer.disconnect();
            this._setupDynamicObservers();
        }
    }

    _generateCacheKey(productData) {
        const key = [
            productData.imageUrl || '',
            productData.textContent?.substring(0, 100) || '',
            this.currentQuery
        ].join('|');
        
        return btoa(key).substring(0, 32);
    }

    _isElementVisible(element) {
        const rect = element.getBoundingClientRect();
        return rect.top < window.innerHeight && rect.bottom > 0 && 
               rect.left < window.innerWidth && rect.right > 0 &&
               rect.width > 0 && rect.height > 0;
    }

    _getResultsSummary() {
        const highlights = document.querySelectorAll('.fashion-ai-highlight');
        if (highlights.length === 0) return 'No matches found.';
        
        const excellent = Array.from(highlights).filter(h => h.textContent.includes('Match') && 
            parseInt(h.textContent.match(/(\d+)%/)[1]) >= 80).length;
        const good = highlights.length - excellent;
        
        return `${excellent} excellent matches, ${good} good matches.`;
    }

    _showProductDetails(element, result) {
        // Create detailed popup with analysis results
        const popup = document.createElement('div');
        popup.className = 'fashion-ai-details-popup';
        popup.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 2px solid #007bff;
            border-radius: 8px;
            padding: 20px;
            max-width: 400px;
            z-index: 10000;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        `;
        
        popup.innerHTML = `
            <h3>Product Analysis</h3>
            <p><strong>Overall Match:</strong> ${Math.round(result.finalScore * 100)}%</p>
            <p><strong>Confidence:</strong> ${this._getConfidenceLabel(result.confidence)}</p>
            <p><strong>Reasoning:</strong> ${result.reasoning}</p>
            <h4>Detailed Scores:</h4>
            <ul>
                <li>Text Match: ${Math.round(result.scores.text * 100)}%</li>
                <li>Image Match: ${Math.round(result.scores.image * 100)}%</li>
                <li>Attributes: ${Math.round(result.scores.heuristic * 100)}%</li>
                <li>Category: ${Math.round(result.scores.category * 100)}%</li>
                <li>Style: ${Math.round(result.scores.style * 100)}%</li>
            </ul>
            <button onclick="this.parentElement.remove()" style="margin-top: 10px; padding: 5px 15px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
        `;
        
        document.body.appendChild(popup);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (popup.parentElement) popup.remove();
        }, 10000);
    }

    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Public API methods
    clearHighlights() {
        this._cleanupPreviousSearch();
        this.statusCallback('Highlights cleared.');
    }

    updateSettings(newSettings) {
        Object.assign(this.settings, newSettings);
        chrome.storage.sync.set(newSettings);
    }

    getPerformanceStats() {
        return this.performanceMonitor.getAllStats();
    }
}

/**
 * Advanced Product Detection System
 * Dynamically identifies products across different e-commerce sites
 */
class ProductDetector {
    constructor() {
        this.selectors = this._initializeSelectors();
        this.heuristics = this._initializeHeuristics();
    }

    async detectProducts() {
        const candidates = new Set();
        
        // Multi-strategy detection
        this._detectBySelectors().forEach(el => candidates.add(el));
        this._detectByHeuristics().forEach(el => candidates.add(el));
        this._detectByLayout().forEach(el => candidates.add(el));
        
        // Filter and validate candidates
        return Array.from(candidates).filter(el => this._isValidProduct(el));
    }

    detectProductsInElement(element) {
        const candidates = new Set();
        
        // Search within the element
        this.selectors.product.forEach(selector => {
            element.querySelectorAll(selector).forEach(el => candidates.add(el));
        });
        
        return Array.from(candidates).filter(el => this._isValidProduct(el));
    }

    extractProductData(element) {
        return {
            element,
            imageUrl: this._extractImage(element),
            textContent: this._extractText(element),
            price: this._extractPrice(element),
            brand: this._extractBrand(element),
            title: this._extractTitle(element),
            category: this._extractCategory(element),
            attributes: this._extractAttributes(element)
        };
    }

    _initializeSelectors() {
        return {
            product: [
                // Generic product selectors
                '.product', '.product-item', '.product-card', '.product-tile',
                '[data-testid*="product"]', '[class*="product"]',
                
                // E-commerce specific
                '.s-result-item', '[data-component-type="s-product-card"]', // Amazon
                '.product-item', '.ProductItem', // General
                '.c-product-tile', '.m-product-tile', // Nike/Adidas style
                '.product-summary', '.productSummary', // Various
                '.product-wrap', '.product-wrapper',
                
                // Layout-based
                'article', 'li[class*="grid"]', 'li[class*="item"]',
                '[class*="tile"]', '[class*="card"]',
                
                // Data attributes
                '[data-product-id]', '[data-sku]', '[data-item-id]'
            ],
            
            image: [
                'img[src*="product"]', 'img[alt*="product"]',
                'img[class*="product"]', 'img[data-src]',
                '.product-image img', '.product-photo img'
            ],
            
            title: [
                '.product-title', '.product-name', 'h1', 'h2', 'h3',
                '[class*="title"]', '[class*="name"]',
                'a[title]', '[data-testid*="title"]'
            ],
            
            price: [
                '.price', '[class*="price"]', '.cost', '[class*="cost"]',
                '[data-testid*="price"]', '.amount', '[class*="amount"]'
            ]
        };
    }

    _initializeHeuristics() {
        return {
            minSize: { width: 100, height: 100 },
            maxSize: { width: 2000, height: 2000 },
            requiredElements: ['img'],
            textIndicators: ['$', 'price', 'buy', 'add to cart', 'shop'],
            excludeSelectors: ['.advertisement', '.ad', '.sponsored', '.nav', '.footer', '.header']
        };
    }

    _detectBySelectors() {
        const products = [];
        
        this.selectors.product.forEach(selector => {
            try {
                document.querySelectorAll(selector).forEach(el => {
                    if (this._isValidProduct(el)) products.push(el);
                });
            } catch (e) {
                // Invalid selector, skip
            }
        });
        
        return products;
    }

    _detectByHeuristics() {
        const products = [];
        const allElements = document.querySelectorAll('*');
        
        Array.from(allElements).forEach(el => {
            if (this._matchesProductHeuristics(el)) {
                products.push(el);
            }
        });
        
        return products;
    }

    _detectByLayout() {
        const products = [];
        
        // Look for grid layouts that might contain products
        const gridContainers = document.querySelectorAll('[class*="grid"], [class*="row"], [class*="flex"]');
        
        gridContainers.forEach(container => {
            const children = Array.from(container.children);
            
            // If container has many similar children with images, likely products
            if (children.length >= 3) {
                const withImages = children.filter(child => child.querySelector('img'));
                
                if (withImages.length >= children.length * 0.7) {
                    withImages.forEach(child => {
                        if (this._isValidProduct(child)) products.push(child);
                    });
                }
            }
        });
        
        return products;
    }

    _matchesProductHeuristics(element) {
        const rect = element.getBoundingClientRect();
        const text = element.textContent?.toLowerCase() || '';
        
        // Size check
        if (rect.width < this.heuristics.minSize.width || 
            rect.height < this.heuristics.minSize.height) return false;
        
        // Must have image
        if (!element.querySelector('img')) return false;
        
        // Check for product indicators
        const hasProductText = this.heuristics.textIndicators.some(indicator => 
            text.includes(indicator)
        );
        
        // Check for price pattern
        const hasPrice = /\$\d+|\d+\.\d{2}|USD|EUR|GBP/.test(text);
        
        return hasProductText || hasPrice;
    }

    _isValidProduct(element) {
        if (!element || this.heuristics.excludeSelectors.some(sel => element.matches(sel))) {
            return false;
        }
        
        const rect = element.getBoundingClientRect();
        
        // Size validation
        if (rect.width < this.heuristics.minSize.width ||
            rect.height < this.heuristics.minSize.height ||
            rect.width > this.heuristics.maxSize.width ||
            rect.height > this.heuristics.maxSize.height) {
            return false;
        }
        
        // Must have required elements
        return this.heuristics.requiredElements.every(req => element.querySelector(req));
    }

    _extractImage(element) {
        const img = element.querySelector('img');
        if (!img) return null;
        
        // Get highest quality image
        return img.dataset.src || img.src || null;
    }

    _extractText(element) {
        // Get meaningful text, exclude noise
        const clone = element.cloneNode(true);
        
        // Remove scripts, styles, etc.
        clone.querySelectorAll('script, style, .price, .rating').forEach(el => el.remove());
        
        return clone.textContent?.trim().replace(/\s+/g, ' ') || '';
    }

    _extractPrice(element) {
        const priceElements = element.querySelectorAll(this.selectors.price.join(', '));
        
        for (const priceEl of priceElements) {
            const match = priceEl.textContent.match(/\$?(\d+(?:\.\d{2})?)/);
            if (match) return parseFloat(match[1]);
        }
        
        return null;
    }

    _extractTitle(element) {
        const titleElements = element.querySelectorAll(this.selectors.title.join(', '));
        
        for (const titleEl of titleElements) {
            const text = titleEl.textContent?.trim();
            if (text && text.length > 5 && text.length < 200) {
                return text;
            }
        }
        
        return null;
    }

    _extractBrand(element) {
        const text = element.textContent.toLowerCase();
        const brands = ['nike', 'adidas', 'zara', 'h&m', 'uniqlo', 'gap', 'levi'];
        
        return brands.find(brand => text.includes(brand)) || null;
    }

    _extractCategory(element) {
        const text = element.textContent.toLowerCase();
        const categories = {
            'shoes': ['shoe', 'sneaker', 'boot', 'sandal'],
            'tops': ['shirt', 'blouse', 'sweater', 'hoodie'],
            'bottoms': ['pants', 'jeans', 'shorts', 'skirt'],
            'dresses': ['dress', 'gown'],
            'accessories': ['bag', 'purse', 'wallet', 'belt', 'hat']
        };
        
        for (const [category, terms] of Object.entries(categories)) {
            if (terms.some(term => text.includes(term))) {
                return category;
            }
        }
        
        return null;
    }

    _extractAttributes(element) {
        const text = element.textContent.toLowerCase();
        
        return {
            colors: this._extractColors(text),
            materials: this._extractMaterials(text),
            sizes: this._extractSizes(text)
        };
    }

    _extractColors(text) {
        const colors = ['black', 'white', 'red', 'blue', 'green', 'yellow', 'brown', 'gray', 'pink', 'purple'];
        return colors.filter(color => text.includes(color));
    }

    _extractMaterials(text) {
        const materials = ['cotton', 'wool', 'silk', 'denim', 'leather', 'polyester'];
        return materials.filter(material => text.includes(material));
    }

    _extractSizes(text) {
        const sizes = ['xs', 's', 'm', 'l', 'xl', 'xxl'];
        return sizes.filter(size => text.includes(size));
    }
}

/**
 * Performance Monitoring System
 */
class PerformanceMonitor {
    constructor() {
        this.timings = {};
        this.counters = {};
    }

    startTiming(label) {
        this.timings[label] = { start: performance.now() };
    }

    endTiming(label) {
        if (this.timings[label]) {
            this.timings[label].duration = performance.now() - this.timings[label].start;
        }
    }

    getTimings() {
        const result = {};
        Object.entries(this.timings).forEach(([label, timing]) => {
            result[label] = timing.duration || 0;
        });
        return result;
    }

    incrementCounter(label) {
        this.counters[label] = (this.counters[label] || 0) + 1;
    }

    getAllStats() {
        return {
            timings: this.getTimings(),
            counters: this.counters,
            memory: performance.memory ? {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)
            } : null
        };
    }
}

    // Export immediately after class definition
    window.ProductFinder = ProductFinder;
    console.log('ProductFinder class successfully exported to window');

} // End of class definitions and export

// Verify export worked
console.log('ProductFinder availability check:', !!window.ProductFinder);