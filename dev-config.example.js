// dev-config.example.js - Development Configuration Template
// Copy this to dev-config.js and customize for your development environment

const DEV_CONFIG = {
    // Development mode settings
    DEBUG_MODE: true,
    VERBOSE_LOGGING: true,
    PERFORMANCE_MONITORING: true,
    
    // AI Model Configuration
    MODELS: {
        // Text embedding model for semantic analysis
        TEXT_EMBEDDING: {
            name: 'Xenova/all-MiniLM-L6-v2',
            quantized: true,
            cache: true
        },
        
        // Image-text matching model
        IMAGE_EMBEDDING: {
            name: 'Xenova/clip-vit-base-patch32', 
            quantized: true,
            cache: true
        },
        
        // Classification model for categories
        CLASSIFIER: {
            name: 'Xenova/distilbert-base-uncased-mnli',
            quantized: true,
            cache: true
        }
    },
    
    // Performance Settings
    PERFORMANCE: {
        // Maximum concurrent AI analyses
        MAX_CONCURRENT: 5,
        
        // Products processed in each batch
        BATCH_SIZE: 10,
        
        // Minimum confidence to show highlights
        CONFIDENCE_THRESHOLD: 0.25,
        
        // Cache expiration in milliseconds (1 hour)
        CACHE_EXPIRATION: 60 * 60 * 1000,
        
        // Maximum cache size (number of items)
        MAX_CACHE_SIZE: 1000
    },
    
    // UI Configuration
    UI: {
        // Extension positioning
        POSITION: 'top-right', // 'top-right', 'top-left', 'bottom-right', 'bottom-left'
        
        // Auto-show on e-commerce sites
        AUTO_SHOW_ON_ECOMMERCE: false,
        
        // Show notifications
        SHOW_NOTIFICATIONS: true,
        
        // Animation settings
        ANIMATIONS: {
            enabled: true,
            duration: 300,
            easing: 'ease-out'
        }
    },
    
    // Product Detection Settings  
    PRODUCT_DETECTION: {
        // Minimum product size (pixels)
        MIN_SIZE: { width: 100, height: 100 },
        
        // Maximum product size (pixels)
        MAX_SIZE: { width: 2000, height: 2000 },
        
        // Required elements for product validation
        REQUIRED_ELEMENTS: ['img'],
        
        // Text indicators that suggest products
        PRODUCT_INDICATORS: ['$', 'price', 'buy', 'add to cart', 'shop', 'purchase'],
        
        // Selectors to exclude from detection
        EXCLUDE_SELECTORS: [
            '.advertisement', '.ad', '.sponsored', 
            '.nav', '.navbar', '.footer', '.header',
            '.menu', '.sidebar', '.popup', '.modal'
        ]
    },
    
    // Fashion-Specific Configuration
    FASHION: {
        // Supported categories
        CATEGORIES: [
            'tops', 'bottoms', 'dresses', 'outerwear', 
            'shoes', 'accessories', 'bags', 'jewelry'
        ],
        
        // Color mappings for better recognition
        COLORS: {
            'black': ['black', 'ebony', 'charcoal', 'jet', 'onyx'],
            'white': ['white', 'ivory', 'cream', 'off-white', 'pearl'],
            'blue': ['blue', 'navy', 'royal', 'cerulean', 'azure', 'cobalt'],
            'red': ['red', 'crimson', 'scarlet', 'burgundy', 'maroon', 'cherry'],
            'green': ['green', 'emerald', 'forest', 'olive', 'sage', 'mint'],
            'brown': ['brown', 'tan', 'beige', 'khaki', 'camel', 'chocolate'],
            'gray': ['gray', 'grey', 'silver', 'slate', 'pewter', 'graphite'],
            'pink': ['pink', 'rose', 'blush', 'coral', 'magenta', 'fuchsia'],
            'yellow': ['yellow', 'gold', 'amber', 'mustard', 'lemon', 'cream'],
            'purple': ['purple', 'violet', 'lavender', 'plum', 'indigo', 'mauve']
        },
        
        // Material keywords
        MATERIALS: [
            'cotton', 'wool', 'silk', 'denim', 'leather', 
            'polyester', 'linen', 'cashmere', 'velvet', 'suede'
        ],
        
        // Style classifications
        STYLES: {
            'casual': ['casual', 'relaxed', 'everyday', 'comfortable', 'laid-back'],
            'formal': ['formal', 'dressy', 'elegant', 'sophisticated', 'business'],
            'vintage': ['vintage', 'retro', 'classic', 'timeless', 'antique'],
            'modern': ['modern', 'contemporary', 'trendy', 'current', 'fashionable'],
            'minimalist': ['minimalist', 'simple', 'clean', 'basic', 'understated'],
            'bohemian': ['boho', 'bohemian', 'hippie', 'free-spirited', 'artistic']
        }
    },
    
    // Testing Configuration
    TESTING: {
        // Test websites for development
        TEST_SITES: [
            'https://www.zara.com/us/',
            'https://www.hm.com/us/',
            'https://www.uniqlo.com/us/en/',
            'https://www.amazon.com/',
            'https://www.nike.com/',
            'https://www2.hm.com/en_us/index.html'
        ],
        
        // Sample queries for testing
        TEST_QUERIES: [
            'black leather jacket',
            'white sneakers under $100',
            'red summer dress',
            'vintage denim jeans',
            'formal navy blazer',
            'casual brown boots',
            'minimalist white shirt',
            'oversized hoodie'
        ],
        
        // Mock data for offline testing
        MOCK_PRODUCTS: [
            {
                title: 'Black Leather Jacket',
                price: '$149.99',
                image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                description: 'Classic black leather jacket with zipper closure'
            },
            {
                title: 'White Canvas Sneakers',
                price: '$79.99',
                image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                description: 'Comfortable white canvas sneakers for everyday wear'
            }
        ]
    },
    
    // Error Handling
    ERROR_HANDLING: {
        // Retry attempts for failed operations
        MAX_RETRIES: 3,
        
        // Timeout for AI operations (milliseconds)
        AI_TIMEOUT: 30000,
        
        // Fallback behavior when AI fails
        FALLBACK_TO_KEYWORDS: true,
        
        // Show error notifications to user
        SHOW_ERROR_NOTIFICATIONS: true
    },
    
    // Analytics (Local only - no external tracking)
    ANALYTICS: {
        // Track usage statistics locally
        TRACK_USAGE: true,
        
        // Track performance metrics
        TRACK_PERFORMANCE: true,
        
        // Maximum log entries to keep
        MAX_LOG_ENTRIES: 1000,
        
        // Metrics to collect
        METRICS: [
            'search_count',
            'avg_processing_time',
            'cache_hit_rate',
            'error_rate',
            'most_searched_terms'
        ]
    },
    
    // External Integrations
    INTEGRATIONS: {
        // Ollama configuration for advanced users
        OLLAMA: {
            enabled: false,
            endpoint: 'http://localhost:11434',
            model: 'llava',
            timeout: 30000
        },
        
        // Future integrations can be added here
        // OPENAI: { enabled: false, apiKey: '' },
        // CUSTOM_API: { enabled: false, endpoint: '' }
    }
};

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DEV_CONFIG;
} else if (typeof window !== 'undefined') {
    window.DEV_CONFIG = DEV_CONFIG;
}

// Development utilities
const DEV_UTILS = {
    // Log with different levels
    log: (level, message, data = null) => {
        if (!DEV_CONFIG.DEBUG_MODE) return;
        
        const timestamp = new Date().toISOString();
        const prefix = `[Fashion AI ${level.toUpperCase()}] ${timestamp}:`;
        
        switch (level) {
            case 'error':
                console.error(prefix, message, data);
                break;
            case 'warn':
                console.warn(prefix, message, data);
                break;
            case 'info':
                console.info(prefix, message, data);
                break;
            case 'debug':
            default:
                if (DEV_CONFIG.VERBOSE_LOGGING) {
                    console.log(prefix, message, data);
                }
                break;
        }
    },
    
    // Performance timing
    time: (label) => {
        if (DEV_CONFIG.PERFORMANCE_MONITORING) {
            console.time(`Fashion AI: ${label}`);
        }
    },
    
    timeEnd: (label) => {
        if (DEV_CONFIG.PERFORMANCE_MONITORING) {
            console.timeEnd(`Fashion AI: ${label}`);
        }
    },
    
    // Memory usage reporting
    getMemoryUsage: () => {
        if (performance.memory) {
            return {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            };
        }
        return null;
    },
    
    // Test query generator
    generateTestQuery: () => {
        const colors = Object.keys(DEV_CONFIG.FASHION.COLORS);
        const materials = DEV_CONFIG.FASHION.MATERIALS;
        const categories = DEV_CONFIG.FASHION.CATEGORIES;
        
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        const randomMaterial = materials[Math.floor(Math.random() * materials.length)];
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        
        return `${randomColor} ${randomMaterial} ${randomCategory}`;
    },
    
    // Configuration validator
    validateConfig: () => {
        const errors = [];
        
        // Check required fields
        if (!DEV_CONFIG.MODELS.TEXT_EMBEDDING.name) {
            errors.push('Text embedding model name is required');
        }
        
        if (!DEV_CONFIG.MODELS.IMAGE_EMBEDDING.name) {
            errors.push('Image embedding model name is required');
        }
        
        if (DEV_CONFIG.PERFORMANCE.CONFIDENCE_THRESHOLD < 0 || 
            DEV_CONFIG.PERFORMANCE.CONFIDENCE_THRESHOLD > 1) {
            errors.push('Confidence threshold must be between 0 and 1');
        }
        
        if (DEV_CONFIG.PERFORMANCE.MAX_CONCURRENT < 1) {
            errors.push('Max concurrent must be at least 1');
        }
        
        if (errors.length > 0) {
            console.error('Configuration validation errors:', errors);
            return false;
        }
        
        console.log('Configuration validation passed');
        return true;
    }
};

// Export utilities
if (typeof module !== 'undefined' && module.exports) {
    module.exports.DEV_UTILS = DEV_UTILS;
} else if (typeof window !== 'undefined') {
    window.DEV_UTILS = DEV_UTILS;
}

// Auto-validate configuration in development
if (DEV_CONFIG.DEBUG_MODE) {
    DEV_UTILS.validateConfig();
    DEV_UTILS.log('info', 'Development configuration loaded', {
        models: Object.keys(DEV_CONFIG.MODELS),
        performance: DEV_CONFIG.PERFORMANCE,
        ui: DEV_CONFIG.UI
    });
} 