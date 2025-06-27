// Configuration - Users will need to add their own API key
const AI_CONFIG = {
    provider: 'openai', // 'openai' or 'anthropic'
    apiKey: '', // Users need to set this in storage
    baseUrl: 'https://api.openai.com/v1'
};

console.log('🛍️ Shopping Assistant: Background script starting...');

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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('🛍️ Shopping Assistant: Background received message:', request.type);
    
    if (request.type === 'chatMessage') {
        console.log('🛍️ Shopping Assistant: Processing chat message:', request.text);
        handleChatMessage(request, sender, sendResponse);
        return true; // Keep the message channel open for async response
    } else if (request.type === 'imageUpload') {
        console.log('🛍️ Shopping Assistant: Processing image upload');
        handleImageUpload(request, sender, sendResponse);
        return true;
    } else if (request.type === 'highlightProduct') {
        console.log('🛍️ Shopping Assistant: Highlighting product');
        highlightProduct(request, sender);
    }
});

async function handleChatMessage(request, sender, sendResponse) {
    try {
        console.log('🛍️ Shopping Assistant: handleChatMessage started');
        const userMessage = request.text;
        
        // Get current tab info
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            const activeTab = tabs[0];
        
        if (!activeTab || !activeTab.id) {
            console.error('🛍️ Shopping Assistant: No active tab found');
            sendResponse({ type: 'botResponse', text: 'Unable to access the current tab.' });
            return;
        }

        console.log('🛍️ Shopping Assistant: Active tab:', activeTab.url);

        // Scan the page for products
        console.log('🛍️ Shopping Assistant: Scanning page for products...');
        const results = await chrome.scripting.executeScript({
                    target: { tabId: activeTab.id },
                    function: scanPageForProducts,
            args: [activeTab.url]
        });

        const { products, pageContent } = results[0].result;
        console.log('🛍️ Shopping Assistant: Found', products.length, 'products');
        
        // Get AI response
        console.log('🛍️ Shopping Assistant: Getting AI response...');
        const aiResponse = await getAIResponse(userMessage, products, pageContent, activeTab.url);
        
        // Send response back to chat
        console.log('🛍️ Shopping Assistant: Sending response back to content script');
        chrome.tabs.sendMessage(activeTab.id, { 
            type: 'botResponse', 
            text: aiResponse.message,
            products: aiResponse.matchedProducts 
        });

    } catch (error) {
        console.error('🛍️ Shopping Assistant: Error in handleChatMessage:', error);
        if (sender.tab && sender.tab.id) {
            chrome.tabs.sendMessage(sender.tab.id, { 
                type: 'botResponse', 
                text: 'Sorry, I encountered an error. Please try again.' 
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
    console.log('🛍️ Shopping Assistant: Getting AI response for:', userMessage);
    
    const apiKey = await getApiKey();
    if (!apiKey) {
        console.log('🛍️ Shopping Assistant: No API key found');
        return {
            message: "To use AI features, please set your OpenAI API key in the extension popup.",
            matchedProducts: []
        };
    }

    console.log('🛍️ Shopping Assistant: API key found, length:', apiKey.length);

    const prompt = `You are a helpful shopping assistant. The user is on ${pageContent.domain} and asked: "${userMessage}"

Available products on this page:
${products.map(p => `- ${p.title} (${p.price})`).join('\n')}

Based on the user's request, help them find relevant products from this page. If you find matching products, provide their titles and explain why they match. Be conversational and helpful.

If no products match well, suggest what they might look for or ask clarifying questions.`;

    console.log('🛍️ Shopping Assistant: Making API call to OpenAI...');

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 500,
                temperature: 0.7
            })
        });

        console.log('🛍️ Shopping Assistant: API response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('🛍️ Shopping Assistant: API error response:', errorText);
            throw new Error(`API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('🛍️ Shopping Assistant: API response received');
        
        const aiMessage = data.choices[0].message.content;
        console.log('🛍️ Shopping Assistant: AI message:', aiMessage);

        // Find products mentioned in AI response for highlighting
        const matchedProducts = products.filter(product => 
            aiMessage.toLowerCase().includes(product.title.toLowerCase().substring(0, 20))
        );

        console.log('🛍️ Shopping Assistant: Found', matchedProducts.length, 'matched products');

        return {
            message: aiMessage,
            matchedProducts: matchedProducts
        };

    } catch (error) {
        console.error('🛍️ Shopping Assistant: AI API Error:', error);
        console.error('🛍️ Shopping Assistant: Full error details:', error.message);
        return {
            message: "I'm having trouble connecting to the AI service. Here's what I found using basic search:\n" + 
                    getBasicSearchResponse(userMessage, products),
            matchedProducts: []
        };
    }
}

async function getAIImageResponse(imageData, query, products, currentUrl) {
    const apiKey = await getApiKey();
    if (!apiKey) {
        return {
            message: "To use image search, please set your OpenAI API key in the extension popup.",
            matchedProducts: []
        };
    }

    const prompt = `You are a shopping assistant helping find products similar to an uploaded image. 
${query ? `The user also said: "${query}"` : ''}

Available products on this page:
${products.map(p => `- ${p.title} (${p.price})`).join('\n')}

Based on the uploaded image${query ? ' and user query' : ''}, which products from this page are most similar? Explain why they match and suggest the best options.`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [{
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt },
                        { type: 'image_url', image_url: { url: imageData } }
                    ]
                }],
                max_tokens: 500
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const aiMessage = data.choices[0].message.content;

        const matchedProducts = products.filter(product => 
            aiMessage.toLowerCase().includes(product.title.toLowerCase().substring(0, 20))
        );

        return {
            message: aiMessage,
            matchedProducts: matchedProducts
        };

    } catch (error) {
        console.error('AI Vision API Error:', error);
        return {
            message: "I had trouble analyzing your image. Could you describe what you're looking for instead?",
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

async function getApiKey() {
    try {
        // First try to get user-provided API key (production)
        const result = await chrome.storage.sync.get(['openai_api_key']);
        if (result.openai_api_key) {
            console.log('🛍️ Shopping Assistant: Using user-provided API key');
            return result.openai_api_key;
        }
        
        // Fall back to development key if available (development only)
        if (DEV_API_KEY) {
            console.log('🛍️ Shopping Assistant: Using development API key');
            return DEV_API_KEY;
        }
        
        console.log('🛍️ Shopping Assistant: No API key found');
        return null;
    } catch (error) {
        console.error('🛍️ Shopping Assistant: Error getting API key:', error);
        return DEV_API_KEY; // Fallback to dev key if storage fails
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