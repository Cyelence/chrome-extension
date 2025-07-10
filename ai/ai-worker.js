// ai-worker.js - Advanced Fashion AI Worker
import { pipeline, cos_sim } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1';

/**
 * Comprehensive AI system for fashion product matching
 * Uses multiple models and techniques for accurate fashion item detection
 */
class FashionAI {
    constructor() {
        this.models = {
            textEmbedding: null,
            imageEmbedding: null,
            classifier: null,
            sentiment: null
        };
        this.fashionTerms = this._initializeFashionTerms();
        this.colorMap = this._initializeColorMap();
        this.sizeMap = this._initializeSizeMap();
        this.isInitialized = false;
    }

    async initialize(progressCallback) {
        try {
            progressCallback?.({ status: 'Loading text embedding model...', progress: 0.1 });
            this.models.textEmbedding = await pipeline(
                'feature-extraction', 
                'Xenova/all-MiniLM-L6-v2',
                { quantized: true }
            );

            progressCallback?.({ status: 'Loading image embedding model...', progress: 0.4 });
            this.models.imageEmbedding = await pipeline(
                'feature-extraction',
                'Xenova/clip-vit-base-patch32',
                { quantized: true }
            );

            progressCallback?.({ status: 'Loading classification model...', progress: 0.7 });
            this.models.classifier = await pipeline(
                'zero-shot-classification',
                'Xenova/distilbert-base-uncased-mnli',
                { quantized: true }
            );

            progressCallback?.({ status: 'AI models ready!', progress: 1.0 });
            this.isInitialized = true;
        } catch (error) {
            throw new Error(`Failed to initialize AI models: ${error.message}`);
        }
    }

    /**
     * Parse complex fashion queries into structured components
     */
    parseQuery(query) {
        const queryLower = query.toLowerCase();
        const parsed = {
            original: query,
            category: this._extractCategory(queryLower),
            colors: this._extractColors(queryLower),  
            materials: this._extractMaterials(queryLower),
            styles: this._extractStyles(queryLower),
            brands: this._extractBrands(queryLower),
            sizes: this._extractSizes(queryLower),
            priceRange: this._extractPriceRange(queryLower),
            keywords: this._extractKeywords(queryLower),
            intent: this._analyzeIntent(queryLower)
        };

        // Generate semantic variations
        parsed.semanticVariations = this._generateSemanticVariations(parsed);
        
        return parsed;
    }

    /**
     * Analyze product with comprehensive matching
     */
    async analyzeProduct(productData, parsedQuery) {
        if (!this.isInitialized) {
            throw new Error('AI models not initialized');
        }

        const scores = {
            text: 0,
            image: 0,
            heuristic: 0,
            category: 0,
            style: 0,
            final: 0
        };

        // Text analysis
        if (productData.textContent) {
            scores.text = await this._analyzeProductText(productData.textContent, parsedQuery);
        }

        // Image analysis
        if (productData.imageUrl) {
            scores.image = await this._analyzeProductImage(productData.imageUrl, parsedQuery);
        }

        // Heuristic analysis
        scores.heuristic = this._analyzeProductHeuristics(productData, parsedQuery);

        // Category classification
        scores.category = await this._classifyProductCategory(productData, parsedQuery);

        // Style analysis
        scores.style = this._analyzeProductStyle(productData, parsedQuery);

        // Combine scores with weighted approach
        scores.final = this._combineScores(scores, parsedQuery);

        return {
            scores,
            confidence: this._calculateConfidence(scores),
            reasoning: this._generateReasoning(scores, parsedQuery),
            metadata: this._extractProductMetadata(productData)
        };
    }

    async _analyzeProductText(textContent, parsedQuery) {
        try {
            // Semantic similarity using embeddings
            const queryEmbedding = await this.models.textEmbedding(parsedQuery.original, {
                pooling: 'mean',
                normalize: true
            });
            
            const textEmbedding = await this.models.textEmbedding(textContent, {
                pooling: 'mean', 
                normalize: true
            });

            const semanticScore = cos_sim(queryEmbedding.data, textEmbedding.data);

            // Keyword matching with weights
            const keywordScore = this._calculateKeywordScore(textContent, parsedQuery);

            // Exact match bonuses
            const exactMatchScore = this._calculateExactMatches(textContent, parsedQuery);

            // Fashion-specific terminology matching
            const fashionScore = this._calculateFashionTermScore(textContent, parsedQuery);

            return Math.min(1.0, 
                semanticScore * 0.4 + 
                keywordScore * 0.3 + 
                exactMatchScore * 0.2 + 
                fashionScore * 0.1
            );
        } catch (error) {
            console.error('Text analysis failed:', error);
            return 0;
        }
    }

    async _analyzeProductImage(imageUrl, parsedQuery) {
        try {
            // CLIP-based image-text matching
            const queryEmbedding = await this.models.imageEmbedding(parsedQuery.original, {
                pooling: 'mean',
                normalize: true
            });

            const imageEmbedding = await this.models.imageEmbedding(imageUrl, {
                pooling: 'mean',
                normalize: true
            });

            const clipScore = cos_sim(queryEmbedding.data, imageEmbedding.data);

            // Color analysis from query
            let colorBonus = 0;
            if (parsedQuery.colors.length > 0) {
                colorBonus = 0.1; // Assume color matching from visual analysis
            }

            return Math.min(1.0, clipScore + colorBonus);
        } catch (error) {
            console.error('Image analysis failed:', error);
            return 0;
        }
    }

    _analyzeProductHeuristics(productData, parsedQuery) {
        let score = 0;
        const textLower = (productData.textContent || '').toLowerCase();

        // Price matching
        if (parsedQuery.priceRange.min !== null || parsedQuery.priceRange.max !== null) {
            const productPrice = this._extractPrice(textLower);
            if (productPrice) {
                const priceMatch = this._matchesPrice(productPrice, parsedQuery.priceRange);
                score += priceMatch ? 0.3 : -0.2;
            }
        }

        // Brand matching
        if (parsedQuery.brands.length > 0) {
            const brandMatch = parsedQuery.brands.some(brand => 
                textLower.includes(brand.toLowerCase())
            );
            score += brandMatch ? 0.2 : 0;
        }

        // Size matching
        if (parsedQuery.sizes.length > 0) {
            const sizeMatch = parsedQuery.sizes.some(size =>
                textLower.includes(size.toLowerCase())
            );
            score += sizeMatch ? 0.1 : 0;
        }

        // Material matching
        if (parsedQuery.materials.length > 0) {
            const materialMatch = parsedQuery.materials.some(material =>
                textLower.includes(material)
            );
            score += materialMatch ? 0.15 : 0;
        }

        return Math.max(0, Math.min(1.0, score));
    }

    async _classifyProductCategory(productData, parsedQuery) {
        if (!parsedQuery.category) return 0.5;

        try {
            const categories = [
                'clothing', 'shoes', 'accessories', 'bags', 'jewelry',
                'tops', 'bottoms', 'dresses', 'outerwear', 'underwear'
            ];

            const result = await this.models.classifier(
                productData.textContent || '',
                categories
            );

            const targetCategory = parsedQuery.category.toLowerCase();
            const match = result.labels.find(label => 
                label.toLowerCase().includes(targetCategory) ||
                targetCategory.includes(label.toLowerCase())
            );

            return match ? result.scores[result.labels.indexOf(match)] : 0.3;
        } catch (error) {
            console.error('Category classification failed:', error);
            return 0.5;
        }
    }

    _analyzeProductStyle(productData, parsedQuery) {
        if (parsedQuery.styles.length === 0) return 0.5;

        const textLower = (productData.textContent || '').toLowerCase();
        let matchCount = 0;

        parsedQuery.styles.forEach(style => {
            if (textLower.includes(style)) {
                matchCount++;
            }
        });

        return parsedQuery.styles.length > 0 ? 
            matchCount / parsedQuery.styles.length : 0.5;
    }

    _combineScores(scores, parsedQuery) {
        // Dynamic weighting based on query characteristics
        let weights = {
            text: 0.35,
            image: 0.25,
            heuristic: 0.20,
            category: 0.10,
            style: 0.10
        };

        // Adjust weights based on query intent
        if (parsedQuery.intent === 'visual') {
            weights.image += 0.15;
            weights.text -= 0.10;
        } else if (parsedQuery.intent === 'specific') {
            weights.heuristic += 0.15;
            weights.text -= 0.10;
        }

        return (
            scores.text * weights.text +
            scores.image * weights.image +
            scores.heuristic * weights.heuristic +
            scores.category * weights.category +
            scores.style * weights.style
        );
    }

    _calculateConfidence(scores) {
        const nonZeroScores = Object.values(scores).filter(s => s > 0).length;
        const averageScore = Object.values(scores).reduce((a, b) => a + b, 0) / 5;
        const variance = this._calculateVariance(Object.values(scores));
        
        // Higher confidence when multiple scoring methods agree
        let confidence = averageScore * (nonZeroScores / 5) * (1 - variance);
        return Math.max(0, Math.min(1, confidence));
    }

    _generateReasoning(scores, parsedQuery) {
        const reasons = [];
        
        if (scores.text > 0.7) reasons.push('Strong text match');
        if (scores.image > 0.7) reasons.push('Visual similarity detected');
        if (scores.heuristic > 0.5) reasons.push('Matching attributes found');
        if (scores.category > 0.8) reasons.push('Correct category');
        if (scores.style > 0.6) reasons.push('Style alignment');

        return reasons.length > 0 ? reasons.join(', ') : 'Low confidence match';
    }

    // Helper methods for fashion-specific processing
    _initializeFashionTerms() {
        return {
            categories: {
                'tops': ['shirt', 'blouse', 'tank', 'tee', 'sweater', 'hoodie', 'cardigan'],
                'bottoms': ['pants', 'jeans', 'trousers', 'shorts', 'skirt', 'leggings'],
                'dresses': ['dress', 'gown', 'frock', 'sundress', 'maxi', 'mini'],
                'outerwear': ['jacket', 'coat', 'blazer', 'vest', 'parka', 'bomber'],
                'shoes': ['sneakers', 'boots', 'heels', 'flats', 'sandals', 'loafers'],
                'accessories': ['bag', 'purse', 'wallet', 'belt', 'scarf', 'hat']
            },
            styles: {
                'casual': ['casual', 'relaxed', 'everyday', 'comfortable'],
                'formal': ['formal', 'dressy', 'elegant', 'sophisticated'],
                'vintage': ['vintage', 'retro', 'classic', 'timeless'],
                'modern': ['modern', 'contemporary', 'trendy', 'current'],
                'minimalist': ['minimalist', 'simple', 'clean', 'basic'],
                'bohemian': ['boho', 'bohemian', 'hippie', 'free-spirited']
            },
            materials: ['cotton', 'wool', 'silk', 'denim', 'leather', 'polyester', 'linen', 'cashmere']
        };
    }

    _initializeColorMap() {
        return {
            'black': ['black', 'ebony', 'charcoal', 'jet'],
            'white': ['white', 'ivory', 'cream', 'off-white'],
            'blue': ['blue', 'navy', 'royal', 'cerulean', 'azure'],
            'red': ['red', 'crimson', 'scarlet', 'burgundy', 'maroon'],
            'green': ['green', 'emerald', 'forest', 'olive', 'sage'],
            'brown': ['brown', 'tan', 'beige', 'khaki', 'camel'],
            'gray': ['gray', 'grey', 'silver', 'slate', 'pewter'],
            'pink': ['pink', 'rose', 'blush', 'coral', 'magenta'],
            'yellow': ['yellow', 'gold', 'amber', 'mustard', 'lemon'],
            'purple': ['purple', 'violet', 'lavender', 'plum', 'indigo']
        };
    }

    _initializeSizeMap() {
        return {
            'xs': ['xs', 'extra small', 'x-small'],
            's': ['s', 'small'],
            'm': ['m', 'medium'],
            'l': ['l', 'large'],
            'xl': ['xl', 'extra large', 'x-large'],
            'xxl': ['xxl', '2xl', 'xx-large']
        };
    }

    // Query parsing helper methods
    _extractCategory(query) {
        for (const [category, terms] of Object.entries(this.fashionTerms.categories)) {
            if (terms.some(term => query.includes(term))) {
                return category;
            }
        }
        return null;
    }

    _extractColors(query) {
        const colors = [];
        for (const [color, variations] of Object.entries(this.colorMap)) {
            if (variations.some(variation => query.includes(variation))) {
                colors.push(color);
            }
        }
        return colors;
    }

    _extractMaterials(query) {
        return this.fashionTerms.materials.filter(material => 
            query.includes(material)
        );
    }

    _extractStyles(query) {
        const styles = [];
        for (const [style, terms] of Object.entries(this.fashionTerms.styles)) {
            if (terms.some(term => query.includes(term))) {
                styles.push(style);
            }
        }
        return styles;
    }

    _extractBrands(query) {
        // Common fashion brands - can be expanded
        const brands = ['nike', 'adidas', 'zara', 'h&m', 'uniqlo', 'gap', 'levi', 'gucci', 'prada'];
        return brands.filter(brand => query.includes(brand));
    }

    _extractSizes(query) {
        const sizes = [];
        for (const [size, variations] of Object.entries(this.sizeMap)) {
            if (variations.some(variation => query.includes(variation))) {
                sizes.push(size);
            }
        }
        return sizes;
    }

    _extractPriceRange(query) {
        const priceRegex = /(?:under|below|less than|<)\s*\$?(\d+)|(?:over|above|more than|>)\s*\$?(\d+)|\$(\d+)-\$?(\d+)/gi;
        let match;
        const range = { min: null, max: null };

        while ((match = priceRegex.exec(query)) !== null) {
            if (match[1]) range.max = parseInt(match[1]);
            if (match[2]) range.min = parseInt(match[2]);
            if (match[3] && match[4]) {
                range.min = parseInt(match[3]);
                range.max = parseInt(match[4]);
            }
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

    _generateSemanticVariations(parsed) {
        const variations = [parsed.original];
        
        // Add category-specific variations
        if (parsed.category) {
            const categoryTerms = this.fashionTerms.categories[parsed.category] || [];
            categoryTerms.forEach(term => {
                variations.push(parsed.original.replace(parsed.category, term));
            });
        }

        return variations;
    }

    _calculateKeywordScore(text, parsedQuery) {
        const textWords = text.toLowerCase().split(/\s+/);
        const queryWords = parsedQuery.keywords;
        
        const matches = queryWords.filter(word => 
            textWords.some(textWord => textWord.includes(word.toLowerCase()))
        );

        return queryWords.length > 0 ? matches.length / queryWords.length : 0;
    }

    _calculateExactMatches(text, parsedQuery) {
        const textLower = text.toLowerCase();
        let score = 0;

        // Exact phrase matching
        if (textLower.includes(parsedQuery.original.toLowerCase())) {
            score += 0.5;
        }

        // Color matches
        parsedQuery.colors.forEach(color => {
            if (textLower.includes(color)) score += 0.1;
        });

        // Style matches  
        parsedQuery.styles.forEach(style => {
            if (textLower.includes(style)) score += 0.1;
        });

        return Math.min(1.0, score);
    }

    _calculateFashionTermScore(text, parsedQuery) {
        const textLower = text.toLowerCase();
        let score = 0;

        // Check for fashion-specific terminology
        Object.values(this.fashionTerms.categories).flat().forEach(term => {
            if (textLower.includes(term) && parsedQuery.original.toLowerCase().includes(term)) {
                score += 0.05;
            }
        });

        return Math.min(1.0, score);
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

    _extractProductMetadata(productData) {
        return {
            hasImage: !!productData.imageUrl,
            textLength: (productData.textContent || '').length,
            estimatedCategory: this._extractCategory((productData.textContent || '').toLowerCase()),
            timestamp: new Date().toISOString()
        };
    }

    _calculateVariance(scores) {
        const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
        const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
        return Math.sqrt(variance);
    }
}

// Worker message handling
let fashionAI = null;
let isInitializing = false;

self.onmessage = async (event) => {
    try {
        const { type, payload } = event.data;

        if (type === 'INITIALIZE') {
            // Prevent multiple initialization
            if (isInitializing || fashionAI) {
                console.log('AI already initializing or initialized');
                self.postMessage({ type: 'READY' });
                return;
            }
            
            isInitializing = true;
            try {
                fashionAI = new FashionAI();
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
