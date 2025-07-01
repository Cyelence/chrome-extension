// AI Configuration for Fashion Finder Extension
// Switch between lightweight and heavy AI versions

const AI_CONFIG = {
    // Current AI mode: 'lite' or 'heavy'
    MODE: 'lite',
    
    // AI Worker files
    WORKERS: {
        lite: 'ai-worker-lite.js',
        heavy: 'ai-worker.js'
    },
    
    // Performance settings per mode
    SETTINGS: {
        lite: {
            name: 'Lightweight AI',
            description: 'Fast text-based matching without model downloads',
            modelDownloadSize: '0 MB',
            initializationTime: '< 1 second',
            accuracy: 'Good for basic matching',
            features: ['Text matching', 'Keyword extraction', 'Basic heuristics'],
            timeout: 30000, // 30 seconds
            batchSize: 10,
            concurrency: 3
        },
        heavy: {
            name: 'Advanced AI',
            description: 'Full ML models with semantic understanding',
            modelDownloadSize: '240 MB',
            initializationTime: '30-180 seconds',
            accuracy: 'Excellent semantic matching',
            features: ['Semantic embeddings', 'Image analysis', 'Deep learning'],
            timeout: 180000, // 3 minutes
            batchSize: 5,
            concurrency: 2
        }
    },
    
    // Get current worker file
    getCurrentWorker() {
        return this.WORKERS[this.MODE];
    },
    
    // Get current settings
    getCurrentSettings() {
        return this.SETTINGS[this.MODE];
    },
    
    // Switch mode
    setMode(mode) {
        if (mode in this.WORKERS) {
            this.MODE = mode;
            return true;
        }
        return false;
    },
    
    // Check if heavy mode is available
    isHeavyModeAvailable() {
        // Check if user has fast internet and is willing to wait
        return navigator.connection && 
               navigator.connection.effectiveType === '4g' &&
               navigator.connection.downlink > 5; // > 5 Mbps
    },
    
    // Recommend mode based on user's conditions
    getRecommendedMode() {
        if (this.isHeavyModeAvailable()) {
            return 'heavy';
        }
        return 'lite';
    }
};

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AI_CONFIG;
} else if (typeof window !== 'undefined') {
    window.AI_CONFIG = AI_CONFIG;
} 