// Lightweight AI Worker for testing and development
// Uses simple text matching and heuristics instead of heavy ML models

class FashionAILite {
    constructor() {
        this.initialized = false;
        this.fashionTerms = {};
        this.colorMap = {};
        this.sizeMap = {};
    }

    async initialize(progressCallback) {
        progressCallback && progressCallback({
            status: 'Initializing lightweight AI...',
            progress: 10
        });

        this._initializeFashionTerms();
        this._initializeColorMap();
        this._initializeSizeMap();

        progressCallback && progressCallback({
            status: 'AI ready - using lightweight mode',
            progress: 100
        });

        this.initialized = true;
    }

    parseQuery(query) {
        const lowerQuery = query.toLowerCase();
        
        return {
            original: query,
            category: this._extractCategory(lowerQuery),
            colors: this._extractColors(lowerQuery),
            materials: this._extractMaterials(lowerQuery),
            styles: this._extractStyles(lowerQuery),
            brands: this._extractBrands(lowerQuery),
            sizes: this._extractSizes(lowerQuery),
            priceRange: this._extractPriceRange(lowerQuery),
            intent: this._analyzeIntent(lowerQuery),
            keywords: this._extractKeywords(query),
            variations: []
        };
    }

    async analyzeProduct(productData, parsedQuery) {
        const textContent = productData.textContent || '';
        const imageUrl = productData.imageUrl;
        
        // Simple text-based analysis
        const textScore = this._analyzeProductTextLite(textContent, parsedQuery);
        const imageScore = imageUrl ? 0.3 : 0; // Basic image presence bonus
        const heuristicScore = this._analyzeProductHeuristics(productData, parsedQuery);
        const categoryScore = this._analyzeCategoryLite(textContent, parsedQuery);
        const styleScore = this._analyzeStyleLite(textContent, parsedQuery);

        const scores = {
            text: textScore,
            image: imageScore,
            heuristic: heuristicScore,
            category: categoryScore,
            style: styleScore
        };

        const finalScore = this._combineScores(scores, parsedQuery);
        const confidence = this._calculateConfidence(scores);

        return {
            score: finalScore,
            confidence: confidence,
            reasoning: this._generateReasoning(scores, parsedQuery),
            breakdown: scores,
            match: finalScore > 0.3,
            cached: false
        };
    }

    _analyzeProductTextLite(textContent, parsedQuery) {
        const text = textContent.toLowerCase();
        let score = 0;

        // Exact query match
        if (text.includes(parsedQuery.original.toLowerCase())) {
            score += 0.8;
        }

        // Keyword matching
        const keywordMatches = parsedQuery.keywords.filter(keyword => 
            text.includes(keyword.toLowerCase())
        );
        score += (keywordMatches.length / parsedQuery.keywords.length) * 0.5;

        // Color matching
        parsedQuery.colors.forEach(color => {
            if (text.includes(color.toLowerCase())) {
                score += 0.1;
            }
        });

        // Material matching
        parsedQuery.materials.forEach(material => {
            if (text.includes(material.toLowerCase())) {
                score += 0.1;
            }
        });

        // Style matching
        parsedQuery.styles.forEach(style => {
            if (text.includes(style.toLowerCase())) {
                score += 0.1;
            }
        });

        return Math.min(1.0, score);
    }

    _analyzeProductHeuristics(productData, parsedQuery) {
        let score = 0;

        // Price range matching
        if (parsedQuery.priceRange && parsedQuery.priceRange.min !== null || parsedQuery.priceRange.max !== null) {
            const price = this._extractPrice(productData.textContent || '');
            if (price && this._matchesPrice(price, parsedQuery.priceRange)) {
                score += 0.3;
            }
        }

        // Image presence bonus
        if (productData.imageUrl) {
            score += 0.1;
        }

        // Title relevance
        const title = productData.title || '';
        if (title && parsedQuery.keywords.some(keyword => 
            title.toLowerCase().includes(keyword.toLowerCase())
        )) {
            score += 0.2;
        }

        return Math.min(1.0, score);
    }

    _analyzeCategoryLite(textContent, parsedQuery) {
        if (!parsedQuery.category) return 0.5;

        const text = textContent.toLowerCase();
        const category = parsedQuery.category.toLowerCase();

        if (text.includes(category)) return 0.9;

        // Check for category synonyms
        const categoryTerms = this.fashionTerms.categories[parsedQuery.category] || [];
        const matches = categoryTerms.filter(term => text.includes(term.toLowerCase()));
        
        return matches.length > 0 ? 0.7 : 0.3;
    }

    _analyzeStyleLite(textContent, parsedQuery) {
        if (parsedQuery.styles.length === 0) return 0.5;

        const text = textContent.toLowerCase();
        const matchedStyles = parsedQuery.styles.filter(style => 
            text.includes(style.toLowerCase())
        );

        return matchedStyles.length > 0 ? 0.8 : 0.3;
    }

    _combineScores(scores, parsedQuery) {
        // Weighted combination
        return (
            scores.text * 0.4 +
            scores.image * 0.1 +
            scores.heuristic * 0.3 +
            scores.category * 0.1 +
            scores.style * 0.1
        );
    }

    _calculateConfidence(scores) {
        const values = Object.values(scores);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / values.length;
        
        return Math.max(0.1, Math.min(0.95, avg * (1 - Math.sqrt(variance))));
    }

    _generateReasoning(scores, parsedQuery) {
        const reasons = [];
        
        if (scores.text > 0.5) {
            reasons.push(`Strong text match (${(scores.text * 100).toFixed(0)}%)`);
        }
        
        if (scores.heuristic > 0.3) {
            reasons.push(`Good product attributes match`);
        }
        
        if (scores.category > 0.7) {
            reasons.push(`Category "${parsedQuery.category}" matches`);
        }

        if (reasons.length === 0) {
            reasons.push('Basic keyword similarity');
        }

        return reasons.join(', ');
    }

    // Simplified extraction methods
    _extractCategory(query) {
        const categories = ['shirt', 'dress', 'pants', 'jacket', 'shoes', 'bag', 'hat', 'skirt', 'shorts', 'sweater'];
        return categories.find(cat => query.includes(cat)) || null;
    }

    _extractColors(query) {
        const colors = ['black', 'white', 'red', 'blue', 'green', 'yellow', 'pink', 'purple', 'brown', 'gray', 'grey', 'orange'];
        return colors.filter(color => query.includes(color));
    }

    _extractMaterials(query) {
        const materials = ['cotton', 'wool', 'silk', 'leather', 'denim', 'polyester', 'linen', 'cashmere'];
        return materials.filter(material => query.includes(material));
    }

    _extractStyles(query) {
        const styles = ['casual', 'formal', 'vintage', 'modern', 'classic', 'trendy', 'elegant', 'sporty'];
        return styles.filter(style => query.includes(style));
    }

    _extractBrands(query) {
        const brands = ['nike', 'adidas', 'zara', 'h&m', 'uniqlo', 'gucci', 'prada'];
        return brands.filter(brand => query.includes(brand));
    }

    _extractSizes(query) {
        const sizes = ['xs', 's', 'm', 'l', 'xl', 'xxl', 'small', 'medium', 'large'];
        return sizes.filter(size => query.includes(size));
    }

    _extractPriceRange(query) {
        const range = { min: null, max: null };
        
        // Under $X
        const underMatch = query.match(/under \$?(\d+)/);
        if (underMatch) {
            range.max = parseInt(underMatch[1]);
        }
        
        // Over $X
        const overMatch = query.match(/over \$?(\d+)/);
        if (overMatch) {
            range.min = parseInt(overMatch[1]);
        }
        
        // $X to $Y or $X-$Y
        const rangeMatch = query.match(/\$?(\d+)[\s-]*(?:to|-)[\s$]*(\d+)/);
        if (rangeMatch) {
            range.min = parseInt(rangeMatch[1]);
            range.max = parseInt(rangeMatch[2]);
        }
        
        return range;
    }

    _extractKeywords(query) {
        const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
        return query.split(/\s+/).filter(word => 
            word.length > 2 && !stopWords.includes(word.toLowerCase())
        );
    }

    _analyzeIntent(query) {
        if (query.includes('like') || query.includes('similar')) return 'visual';
        if (query.includes('$') || query.includes('price') || query.includes('cheap')) return 'price';
        if (query.includes('brand') || query.includes('size')) return 'specific';
        return 'general';
    }

    _extractPrice(text) {
        const priceRegex = /\$(\d+(?:\.\d{2})?)/;
        const match = text.match(priceRegex);
        return match ? parseFloat(match[1]) : null;
    }

    _matchesPrice(price, priceRange) {
        if (priceRange.min !== null && price < priceRange.min) return false;
        if (priceRange.max !== null && price > priceRange.max) return false;
        return true;
    }

    _initializeFashionTerms() {
        this.fashionTerms = {
            categories: {
                'shirt': ['blouse', 'top', 'tee', 't-shirt', 'polo'],
                'dress': ['gown', 'frock', 'sundress'],
                'pants': ['trousers', 'jeans', 'slacks', 'chinos'],
                'jacket': ['blazer', 'coat', 'cardigan', 'hoodie'],
                'shoes': ['sneakers', 'boots', 'heels', 'flats', 'sandals']
            }
        };
    }

    _initializeColorMap() {
        this.colorMap = {
            'black': ['ebony', 'jet', 'charcoal', 'onyx'],
            'white': ['ivory', 'cream', 'pearl', 'snow'],
            'blue': ['navy', 'royal', 'sky', 'denim'],
            'red': ['crimson', 'scarlet', 'burgundy', 'wine']
        };
    }

    _initializeSizeMap() {
        this.sizeMap = {
            'xs': ['extra small', 'xsmall'],
            's': ['small'],
            'm': ['medium', 'med'],
            'l': ['large'],
            'xl': ['extra large', 'xlarge']
        };
    }
}

// Worker message handling
let fashionAI = null;
let isInitializing = false;

self.onmessage = async (event) => {
    try {
        const { type, payload } = event.data;

        if (type === 'INITIALIZE') {
            if (isInitializing || fashionAI) {
                console.log('AI already initializing or initialized');
                self.postMessage({ type: 'READY' });
                return;
            }
            
            isInitializing = true;
            try {
                fashionAI = new FashionAILite();
                await fashionAI.initialize((progress) => {
                    self.postMessage({ 
                        type: 'INITIALIZATION_PROGRESS', 
                        payload: progress 
                    });
                });
                isInitializing = false;
                self.postMessage({ type: 'READY' });
            } catch (initError) {
                isInitializing = false;
                fashionAI = null;
                self.postMessage({
                    type: 'ERROR',
                    payload: {
                        message: `Initialization failed: ${initError.message}`,
                        stack: initError.stack,
                        type: 'INITIALIZATION_ERROR'
                    }
                });
            }
            return;
        }

        if (type === 'PARSE_QUERY') {
            if (!fashionAI) {
                throw new Error('AI not initialized - please wait for initialization to complete');
            }
            const parsed = fashionAI.parseQuery(payload.query);
            self.postMessage({ 
                type: 'QUERY_PARSED', 
                payload: { parsed, id: payload.id } 
            });
            return;
        }

        if (type === 'ANALYZE_PRODUCT') {
            if (!fashionAI) {
                throw new Error('AI not initialized - please wait for initialization to complete');
            }
            if (!payload.productData || !payload.parsedQuery) {
                throw new Error('Invalid analysis request - missing required data');
            }
            
            const { productData, parsedQuery, id } = payload;
            
            const result = await fashionAI.analyzeProduct(productData, parsedQuery);
            
            self.postMessage({
                type: 'ANALYSIS_COMPLETE',
                payload: { ...result, id }
            });
            return;
        }

    } catch (error) {
        console.error('Worker error:', error);
        self.postMessage({
            type: 'ERROR',
            payload: { 
                message: error.message,
                stack: error.stack,
                type: event?.data?.type || 'unknown'
            }
        });
    }
};

// Initialize immediately
self.postMessage({ type: 'WORKER_READY' }); 