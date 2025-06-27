// Configuration - Simple free AI with Google Gemini
const AI_CONFIG = {
    provider: 'gemini', // Single provider for both text and images
    
    // API endpoint
    geminiApiUrl: 'https://generativelanguage.googleapis.com/v1beta',
    
    // Model configurations
    models: {
        text: 'gemini-pro',
        vision: 'gemini-pro-vision'
    },
    
    debug: true // Enable detailed logging
};

console.log('🛍️ Shopping Assistant: Background script starting with hybrid AI approach...');

// Development mode - only use this for local testing
// Create dev-config.js with your API key for development (it's gitignored)
let DEV_API_KEY = null;
try {
    // Try to import dev-config.js if it exists
    importScripts('dev-config.js');
    if (typeof DEV_CONFIG !== 'undefined' && DEV_CONFIG.OPENAI_API_KEY) {
        DEV_API_KEY = DEV_CONFIG.OPENAI_API_KEY;
        console.log('🔧 Development mode: Using local API key');
    }
} catch (e) {
    // dev-config.js doesn't exist, which is normal for production
    console.log('🛍️ Shopping Assistant: No dev config found (normal for production)');
}

// Debug logging function
function debugLog(message, data = null) {
    if (AI_CONFIG.debug) {
        console.log(`🛍️ DEBUG: ${message}`, data || '');
    }
}

// Site-specific product selectors
const SITE_SELECTORS = {
    'amazon.com': {
        products: '[data-component-type="s-search-result"], [data-asin]:not([data-asin=""])',
        title: 'h2 a span, [data-cy="title-recipe-title"]',
        price: '.a-price-whole, .a-price .a-offscreen',
        image: '.s-image, [data-a-image-name="landingImage"]',
        link: 'h2 a, [data-cy="title-recipe-title"]'
    },
    'nike.com': {
        products: '[data-testid="product-card"], .product-card',
        title: '[data-testid="product-card-title"], .product-card__title',
        price: '[data-testid="product-price"], .product-price',
        image: '[data-testid="product-card-image"] img, .product-card__hero-image img',
        link: '[data-testid="product-card-link"], .product-card__link-overlay'
    },
    'target.com': {
        products: '[data-test="@web/site-top-of-funnel/ProductCardWrapper"]',
        title: '[data-test="product-title"]',
        price: '[data-test="product-price"]',
        image: 'img[alt*="product"]',
        link: 'a[data-test="product-title"]'
    },
    'walmart.com': {
        products: '[data-automation-id="product-tile"]',
        title: '[data-automation-id="product-title"]',
        price: '[itemprop="price"]',
        image: '[data-testid="productTileImage"]',
        link: 'a[data-automation-id="product-title"]'
    },
    'generic': {
        products: '.product, .item, [data-product], .product-item, .product-card',
        title: 'h2, h3, .title, .product-title, .product-name, .item-name',
        price: '.price, .product-price, .item-price, [class*="price"]',
        image: 'img',
        link: 'a'
    }
};

// Debounce utility to prevent API rate limiting
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

let debouncedHandleChatMessage;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    debugLog('Background received message', { type: request.type, sender: sender.tab?.url });
    
    if (request.type === 'chatMessage') {
        debugLog('Processing chat message', { text: request.text, tabId: sender.tab?.id });
        // Lazily create the debounced function so that handleChatMessage is defined
        if (!debouncedHandleChatMessage) {
            debouncedHandleChatMessage = debounce(handleChatMessage, 500);
        }
        debouncedHandleChatMessage(request, sender, sendResponse);
        return true; // Keep the message channel open for async response
    } else if (request.type === 'imageUpload') {
        debugLog('Processing image upload', { hasImage: !!request.imageData, query: request.query });
        handleImageUpload(request, sender, sendResponse);
        return true;
    } else if (request.type === 'highlightProduct') {
        debugLog('Highlighting product', { selector: request.productSelector });
        highlightProduct(request, sender);
    } else {
        debugLog('Unknown message type', { type: request.type });
    }
});

async function handleChatMessage(request, sender, sendResponse) {
    try {
        debugLog('handleChatMessage started', { userMessage: request.text });
        const userMessage = request.text;
        
        // Get current tab info
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const activeTab = tabs[0];
        
        if (!activeTab || !activeTab.id) {
            debugLog('ERROR: No active tab found', { tabs: tabs.length });
            const errorMessage = 'Unable to access the current tab. Please refresh the page and try again.';
            
            // Try to send to sender tab if available
            if (sender.tab && sender.tab.id) {
                chrome.tabs.sendMessage(sender.tab.id, { 
                    type: 'botResponse', 
                    text: errorMessage 
                });
            }
            return;
        }

        debugLog('Active tab found', { url: activeTab.url, id: activeTab.id });

        // Scan the page for products
        debugLog('Scanning page for products...');
        const results = await chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            function: scanPageForProducts,
            args: [activeTab.url]
        });

        if (!results || !results[0] || !results[0].result) {
            debugLog('ERROR: Failed to scan page', { results });
            chrome.tabs.sendMessage(activeTab.id, { 
                type: 'botResponse', 
                text: 'Unable to scan this page for products. Please make sure you\'re on a shopping website.' 
            });
            return;
        }

        const { products, pageContent } = results[0].result;
        debugLog('Page scan complete', { 
            productsFound: products.length, 
            domain: pageContent?.domain,
            pageTitle: pageContent?.title 
        });
        
        // Get AI response using text provider (Anthropic)
        debugLog('Getting AI response using text provider...');
        const aiResponse = await getAIResponse(userMessage, products, pageContent, activeTab.url);
        
        // Send response back to chat
        debugLog('Sending response back to content script', { 
            messageLength: aiResponse.message.length,
            matchedProducts: aiResponse.matchedProducts.length 
        });
        
        chrome.tabs.sendMessage(activeTab.id, { 
            type: 'botResponse', 
            text: aiResponse.message,
            products: aiResponse.matchedProducts 
        });

    } catch (error) {
        debugLog('ERROR in handleChatMessage', { error: error.message, stack: error.stack });
        const errorMessage = `Sorry, I encountered an error: ${error.message}. Please try again.`;
        
        if (sender.tab && sender.tab.id) {
            chrome.tabs.sendMessage(sender.tab.id, { 
                type: 'botResponse', 
                text: errorMessage 
            });
        }
    }
}

async function handleImageUpload(request, sender, sendResponse) {
    try {
        const { imageData, query } = request;
        
        // Get current tab info
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const activeTab = tabs[0];
        
        // Scan page for products
        const results = await chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            function: scanPageForProducts,
            args: [activeTab.url]
        });

        const { products } = results[0].result;
        
        // Get AI response for image similarity
        const aiResponse = await getAIImageResponse(imageData, query, products, activeTab.url);
        
        // Send response back to chat
        chrome.tabs.sendMessage(activeTab.id, { 
            type: 'botResponse', 
            text: aiResponse.message,
            products: aiResponse.matchedProducts 
        });

    } catch (error) {
        console.error('Error handling image upload:', error);
        chrome.tabs.sendMessage(sender.tab.id, { 
            type: 'botResponse', 
            text: 'Sorry, I had trouble processing your image. Please try again.' 
        });
    }
}

function scanPageForProducts(currentUrl) {
    // Define selectors inside the function since it runs in page context
    const SITE_SELECTORS = {
        'amazon.com': {
            products: '[data-component-type="s-search-result"], [data-asin]:not([data-asin=""])',
            title: 'h2 a span, [data-cy="title-recipe-title"]',
            price: '.a-price-whole, .a-price .a-offscreen',
            image: '.s-image, [data-a-image-name="landingImage"]',
            link: 'h2 a, [data-cy="title-recipe-title"]'
        },
        'nike.com': {
            products: '[data-testid="product-card"], .product-card',
            title: '[data-testid="product-card-title"], .product-card__title',
            price: '[data-testid="product-price"], .product-price',
            image: '[data-testid="product-card-image"] img, .product-card__hero-image img',
            link: '[data-testid="product-card-link"], .product-card__link-overlay'
        },
        'target.com': {
            products: '[data-test="@web/site-top-of-funnel/ProductCardWrapper"]',
            title: '[data-test="product-title"]',
            price: '[data-test="product-price"]',
            image: 'img[alt*="product"]',
            link: 'a[data-test="product-title"]'
        },
        'walmart.com': {
            products: '[data-automation-id="product-tile"]',
            title: '[data-automation-id="product-title"]',
            price: '[itemprop="price"]',
            image: '[data-testid="productTileImage"]',
            link: 'a[data-automation-id="product-title"]'
        },
        'generic': {
            products: '.product, .item, [data-product], .product-item, .product-card',
            title: 'h2, h3, .title, .product-title, .product-name, .item-name',
            price: '.price, .product-price, .item-price, [class*="price"]',
            image: 'img',
            link: 'a'
        }
    };
    
    const domain = new URL(currentUrl).hostname.replace('www.', '');
    let selectors = SITE_SELECTORS[domain] || SITE_SELECTORS.generic;
    
    console.log('🛍️ Scanning for products on:', domain);
    console.log('🛍️ Using selectors:', selectors.products);
    
    // Try multiple selector strategies
    const products = [];
    const productElements = document.querySelectorAll(selectors.products);
    
    console.log('🛍️ Found', productElements.length, 'potential product elements');
    
    productElements.forEach((elem, index) => {
        try {
            const titleEl = elem.querySelector(selectors.title);
            const priceEl = elem.querySelector(selectors.price);
            const imageEl = elem.querySelector(selectors.image);
            const linkEl = elem.querySelector(selectors.link);
            
            const title = titleEl?.textContent?.trim();
            const price = priceEl?.textContent?.trim();
            const imageUrl = imageEl?.src || imageEl?.getAttribute('data-src');
            const productUrl = linkEl?.href;
            
            if (title) {
                products.push({
                    id: `product-${index}`,
                    title,
                    price: price || 'Price not available',
                    imageUrl,
                    productUrl,
                    element: elem.outerHTML.substring(0, 200), // First 200 chars for context
                    selector: `${selectors.products}:nth-child(${index + 1})`
                });
                console.log('🛍️ Found product:', title);
            }
        } catch (e) {
            console.log('🛍️ Error extracting product:', e);
        }
    });
    
    // Get general page content for context
    const pageContent = {
        title: document.title,
        url: currentUrl,
        domain: domain,
        description: document.querySelector('meta[name="description"]')?.content || '',
        productCount: products.length
    };
    
    console.log('🛍️ Scan complete! Found', products.length, 'products');
    
    return { products, pageContent };
}

async function getAIResponse(userMessage, products, pageContent, currentUrl) {
    debugLog('Getting AI response for text search using Gemini', { userMessage, productsCount: products.length });

    const prompt = `You are a helpful shopping assistant. The user is on ${pageContent?.domain || 'a shopping website'} and asked: "${userMessage}"

Available products on this page:
${products.slice(0, 15).map(p => `- ${p.title} (${p.price || 'Price not found'})`).join('\n')}
${products.length > 15 ? `... and ${products.length - 15} more products` : ''}

Based on the user's request, help them find relevant products from this page. If you find matching products, provide their titles and explain why they match. Be conversational and helpful.

If no products match well, suggest what they might look for or ask clarifying questions.`;

    try {
        const aiMessage = await getGeminiResponse(prompt, 'text');
        debugLog('AI message generated', { messageLength: aiMessage.length });

        // Find products mentioned in AI response for highlighting
        const matchedProducts = products.filter(product => {
            const productTitle = product.title.toLowerCase();
            const aiMessageLower = aiMessage.toLowerCase();
            
            // Check if product title (or significant part) is mentioned in AI response
            const titleWords = productTitle.split(' ').filter(word => word.length > 3);
            return titleWords.some(word => aiMessageLower.includes(word));
        });

        debugLog('Product matching complete', { matchedProducts: matchedProducts.length });

        return {
            message: aiMessage,
            matchedProducts: matchedProducts
        };

    } catch (error) {
        debugLog('Gemini API Error', { error: error.message, stack: error.stack });
        return {
            message: "I'm having trouble connecting to Google Gemini. Here's what I found using basic search:\n\n" + 
                    getBasicSearchResponse(userMessage, products),
            matchedProducts: []
        };
    }
}

async function getAIImageResponse(imageData, query, products, currentUrl) {
    debugLog('Getting AI response for image search using Gemini Vision', { hasImage: !!imageData, query, productsCount: products.length });

    const prompt = `You are a shopping assistant helping find products similar to an uploaded image. 
${query ? `The user also said: "${query}"` : ''}

Available products on this page:
${products.slice(0, 15).map(p => `- ${p.title} (${p.price || 'Price not found'})`).join('\n')}
${products.length > 15 ? `... and ${products.length - 15} more products` : ''}

Based on the uploaded image${query ? ' and user query' : ''}, which products from this page are most similar? Explain why they match and suggest the best options.`;

    try {
        const aiMessage = await getGeminiVisionResponse(imageData, prompt);
        debugLog('AI image analysis complete', { messageLength: aiMessage.length });

        const matchedProducts = products.filter(product => {
            const productTitle = product.title.toLowerCase();
            const aiMessageLower = aiMessage.toLowerCase();
            
            // Check if product title (or significant part) is mentioned in AI response
            const titleWords = productTitle.split(' ').filter(word => word.length > 3);
            return titleWords.some(word => aiMessageLower.includes(word));
        });

        debugLog('Image search product matching complete', { matchedProducts: matchedProducts.length });

        return {
            message: aiMessage,
            matchedProducts: matchedProducts
        };

    } catch (error) {
        debugLog('Gemini Vision Error', { error: error.message, stack: error.stack });
        return {
            message: `I had trouble analyzing your image with Google Gemini Vision. Error: ${error.message}\n\nCould you describe what you're looking for instead?`,
            matchedProducts: []
        };
    }
}

function getBasicSearchResponse(query, products) {
    const queryWords = query.toLowerCase().split(' ');
    const matches = products.filter(product => 
        queryWords.some(word => 
            product.title.toLowerCase().includes(word) && word.length > 2
        )
    );

    if (matches.length === 0) {
        return `I found ${products.length} products on this page, but none seem to match "${query}". Try being more specific or browse the available items.`;
    }

    return `I found ${matches.length} potentially matching products:\n\n` + 
           matches.slice(0, 5).map(p => `• ${p.title} - ${p.price}`).join('\n');
}

// Google Gemini AI Functions

async function getGeminiResponse(prompt, type = 'text') {
    debugLog('Making request to Google Gemini');
    
    const apiKey = await getApiKey('gemini');
    if (!apiKey) {
        throw new Error('Gemini API key required. Get one free from Google AI Studio.');
    }
    
    const model = type === 'text' ? AI_CONFIG.models.gemini.text : AI_CONFIG.models.gemini.vision;
    
    const response = await fetch(`${AI_CONFIG.geminiApiUrl}/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 300
            }
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        debugLog('Gemini API error', { status: response.status, error: errorText });
        throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    debugLog('Gemini response received', { hasCandidates: !!data.candidates });
    
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini';
}

// Vision-specific helper functions

async function getOllamaVisionResponse(imageData, prompt) {
    debugLog('Making vision request to Ollama (local)');
    
    const model = AI_CONFIG.models.ollama.vision;
    
    // Convert base64 image for Ollama
    const base64Data = imageData.split(',')[1];
    
    try {
        const response = await fetch(`${AI_CONFIG.ollamaApiUrl}/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: model,
                prompt: prompt,
                images: [base64Data],
                stream: false,
                options: {
                    temperature: 0.7,
                    num_predict: 300
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama vision not available. Install Ollama and run: ollama pull ${model}`);
        }

        const data = await response.json();
        return data.response || 'No response from Ollama vision';
    } catch (error) {
        if (error.message.includes('fetch')) {
            throw new Error(`Ollama is not running. Please install Ollama and run: ollama pull ${model}`);
        }
        throw error;
    }
}

async function getGeminiVisionResponse(imageData, prompt) {
    debugLog('Making vision request to Google Gemini');
    
    const apiKey = await getApiKey('gemini');
    if (!apiKey) {
        throw new Error('Gemini API key required. Get one free from Google AI Studio.');
    }
    
    const model = AI_CONFIG.models.gemini.vision;
    
    // Convert image data for Gemini
    const base64Data = imageData.split(',')[1];
    const mimeType = imageData.split(';')[0].split(':')[1];
    
    const response = await fetch(`${AI_CONFIG.geminiApiUrl}/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [
                    { text: prompt },
                    {
                        inline_data: {
                            mime_type: mimeType,
                            data: base64Data
                        }
                    }
                ]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 300
            }
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini Vision API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini Vision';
}

async function getHuggingFaceVisionResponse(imageData, prompt) {
    debugLog('Making vision request to Hugging Face');
    
    // Note: Hugging Face vision models are limited and may not work well for shopping
    // This is a basic implementation
    const apiKey = await getApiKey('huggingface');
    const model = 'Salesforce/blip-image-captioning-base'; // Basic image captioning
    
    try {
        // First, get image caption
        const captionResponse = await fetch(`${AI_CONFIG.huggingfaceApiUrl}/${model}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
            },
            body: JSON.stringify({
                inputs: imageData
            })
        });

        if (!captionResponse.ok) {
            throw new Error('Hugging Face vision model not available');
        }

        const captionData = await captionResponse.json();
        const imageCaption = Array.isArray(captionData) ? captionData[0]?.generated_text : captionData.generated_text;
        
        // Then use text model to analyze caption with products
        const analysisPrompt = `${prompt}\n\nImage shows: ${imageCaption}`;
        return await getHuggingFaceResponse(analysisPrompt);
        
    } catch (error) {
        throw new Error(`Hugging Face vision limited. Try describing the image instead. Error: ${error.message}`);
    }
}

async function getApiKey(provider = 'huggingface') {
    try {
        debugLog(`Getting ${provider} API key`);
        
        // Map provider to storage key
        const storageKeys = {
            'huggingface': 'huggingface_api_key',
            'gemini': 'gemini_api_key',
            'openai': 'openai_api_key',
            'anthropic': 'anthropic_api_key'
        };
        
        const storageKey = storageKeys[provider];
        if (!storageKey) {
            debugLog(`No storage key for provider: ${provider}`);
            return null;
        }
        
        const result = await chrome.storage.sync.get([storageKey]);
        
        if (result[storageKey]) {
            debugLog(`Using user-provided ${provider} API key`);
            return result[storageKey];
        }
        
        // Fall back to development key if available (development only)
        if (DEV_API_KEY && provider === 'openai') {
            debugLog('Using development OpenAI API key');
            return DEV_API_KEY;
        }
        
        debugLog(`No ${provider} API key found`);
        return null;
    } catch (error) {
        debugLog(`Error getting ${provider} API key`, { error: error.message });
        return provider === 'openai' ? DEV_API_KEY : null;
    }
}

async function highlightProduct(request, sender) {
    const { productSelector } = request;
    
    try {
        await chrome.scripting.executeScript({
            target: { tabId: sender.tab.id },
            function: (selector) => {
                // Remove previous highlights
                document.querySelectorAll('.shopping-assistant-highlight').forEach(el => {
                    el.classList.remove('shopping-assistant-highlight');
                });
                
                // Add highlight style if not exists
                if (!document.getElementById('shopping-assistant-styles')) {
                    const style = document.createElement('style');
                    style.id = 'shopping-assistant-styles';
                    style.textContent = `
                        .shopping-assistant-highlight {
                            outline: 3px solid #007bff !important;
                            outline-offset: 2px !important;
                            background-color: rgba(0, 123, 255, 0.1) !important;
                            transition: all 0.3s ease !important;
                        }
                    `;
                    document.head.appendChild(style);
                }
                
                // Highlight and scroll to product
                const element = document.querySelector(selector);
                if (element) {
                    element.classList.add('shopping-assistant-highlight');
                    element.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                    });
                    
                    // Remove highlight after 10 seconds
                    setTimeout(() => {
                        element.classList.remove('shopping-assistant-highlight');
                    }, 10000);
                }
            },
            args: [productSelector]
        });
    } catch (error) {
        console.error('Error highlighting product:', error);
    }
}

console.log('🛍️ Shopping Assistant: Background script loaded!');