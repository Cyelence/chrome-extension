// Configuration - Users will need to add their own API key
const AI_CONFIG = {
    provider: 'openai', // 'openai' or 'anthropic'
    apiKey: '', // Users need to set this in storage
    baseUrl: 'https://api.openai.com/v1'
};

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
    if (request.type === 'chatMessage') {
        handleChatMessage(request, sender, sendResponse);
        return true; // Keep the message channel open for async response
    } else if (request.type === 'imageUpload') {
        handleImageUpload(request, sender, sendResponse);
        return true;
    } else if (request.type === 'highlightProduct') {
        highlightProduct(request, sender);
    }
});

async function handleChatMessage(request, sender, sendResponse) {
    try {
        const userMessage = request.text;
        
        // Get current tab info
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const activeTab = tabs[0];
        
        if (!activeTab || !activeTab.id) {
            sendResponse({ type: 'botResponse', text: 'Unable to access the current tab.' });
            return;
        }

        // Scan the page for products
        const results = await chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            function: scanPageForProducts,
            args: [activeTab.url]
        });

        const { products, pageContent } = results[0].result;
        
        // Get AI response
        const aiResponse = await getAIResponse(userMessage, products, pageContent, activeTab.url);
        
        // Send response back to chat
        chrome.tabs.sendMessage(activeTab.id, { 
            type: 'botResponse', 
            text: aiResponse.message,
            products: aiResponse.matchedProducts 
        });

    } catch (error) {
        console.error('Error handling chat message:', error);
        chrome.tabs.sendMessage(sender.tab.id, { 
            type: 'botResponse', 
            text: 'Sorry, I encountered an error. Please try again.' 
        });
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
    const domain = new URL(currentUrl).hostname.replace('www.', '');
    let selectors = SITE_SELECTORS[domain] || SITE_SELECTORS.generic;
    
    // Try multiple selector strategies
    const products = [];
    const productElements = document.querySelectorAll(selectors.products);
    
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
            }
        } catch (e) {
            console.log('Error extracting product:', e);
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
    
    return { products, pageContent };
}

async function getAIResponse(userMessage, products, pageContent, currentUrl) {
    const apiKey = await getApiKey();
    if (!apiKey) {
        return {
            message: "To use AI features, please set your OpenAI API key in the extension popup.",
            matchedProducts: []
        };
    }

    const prompt = `You are a helpful shopping assistant. The user is on ${pageContent.domain} and asked: "${userMessage}"

Available products on this page:
${products.map(p => `- ${p.title} (${p.price})`).join('\n')}

Based on the user's request, help them find relevant products from this page. If you find matching products, provide their titles and explain why they match. Be conversational and helpful.

If no products match well, suggest what they might look for or ask clarifying questions.`;

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

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const aiMessage = data.choices[0].message.content;

        // Find products mentioned in AI response for highlighting
        const matchedProducts = products.filter(product => 
            aiMessage.toLowerCase().includes(product.title.toLowerCase().substring(0, 20))
        );

        return {
            message: aiMessage,
            matchedProducts: matchedProducts
        };

    } catch (error) {
        console.error('AI API Error:', error);
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
        const result = await chrome.storage.sync.get(['openai_api_key']);
        return result.openai_api_key;
    } catch (error) {
        console.error('Error getting API key:', error);
        return null;
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