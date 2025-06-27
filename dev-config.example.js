// Example development configuration
// Copy this to dev-config.js and add your API keys for testing
// dev-config.js is gitignored and won't be committed

const DEV_CONFIG = {
    // Your Google Gemini API key for development testing (optional)
    GEMINI_API_KEY: 'YOUR_GEMINI_API_KEY_HERE',
    
    // Enable development mode features
    DEV_MODE: true,
    
    // Other development settings
    DEBUG_LOGGING: true
};

// Note: In production, the extension will try to use local Ollama first,
// then fall back to Gemini if the user provides a key. 