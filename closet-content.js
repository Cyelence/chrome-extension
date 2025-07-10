// Digital Closet Content Script - Item Detection
class ItemDetector {
    constructor() {
        this.productSelectors = [
            // Generic product selectors
            '[data-testid*="product"]',
            '[class*="product-"]',
            '[class*="item-"]',
            '[id*="product"]',
            
            // E-commerce specific
            '.product-card',
            '.product-item',
            '.product-tile',
            '.item-card',
            '.listing-item',
            
            // Schema.org structured data
            '[itemtype*="Product"]',
            '[itemtype*="product"]'
        ];
        
        this.titleSelectors = [
            'h1',
            'h2',
            'h3',
            '[class*="title"]',
            '[class*="name"]',
            '[class*="product-name"]',
            '[data-testid*="title"]',
            '[data-testid*="name"]',
            'title'
        ];
        
        this.priceSelectors = [
            '[class*="price"]',
            '[data-testid*="price"]',
            '[class*="cost"]',
            '[class*="amount"]',
            '.currency',
            '.money'
        ];
        
        this.imageSelectors = [
            'img[src*="product"]',
            'img[alt*="product"]',
            '[class*="product"] img',
            '[class*="item"] img',
            'picture img',
            '.hero-image img',
            '.main-image img'
        ];
        
        this.brandSelectors = [
            '[class*="brand"]',
            '[data-testid*="brand"]',
            '[class*="manufacturer"]',
            '[class*="designer"]'
        ];
        
        this.initialized = false;
        this.init();
    }
    
    init() {
        // Listen for messages from popup
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.type === 'DETECT_ITEM') {
                this.detectItem().then(item => {
                    sendResponse({ success: true, item: item });
                }).catch(error => {
                    console.error('Item detection failed:', error);
                    sendResponse({ success: false, error: error.message });
                });
                return true; // Keep message channel open for async response
            }
        });
        
        this.initialized = true;
        console.log('🔍 Digital Closet item detector initialized');
    }
    
    async detectItem() {
        console.log('🔍 Detecting item on current page...');
        
        const detectedData = {
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
        
        console.log('📋 Detected item data:', detectedData);
        return detectedData;
    }
    
    detectTitle() {
        // Try multiple strategies to find product title
        let title = '';
        
        // Strategy 1: Page title
        title = document.title;
        
        // Strategy 2: Meta property
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle && ogTitle.content) {
            title = ogTitle.content;
        }
        
        // Strategy 3: Schema.org structured data
        const schemaTitle = document.querySelector('[itemprop="name"]');
        if (schemaTitle) {
            title = schemaTitle.textContent || schemaTitle.innerText;
        }
        
        // Strategy 4: Common title selectors
        for (const selector of this.titleSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                const text = element.textContent.trim();
                if (text.length > 10 && text.length < 200) {
                    title = text;
                    break;
                }
            }
        }
        
        // Clean up title
        title = title.replace(/\s+/g, ' ').trim();
        
        // Remove common site suffixes
        const siteName = window.location.hostname.replace('www.', '');
        const cleanPatterns = [
            new RegExp(`\\s*[\\|\\-]\\s*${siteName}.*$`, 'i'),
            new RegExp(`\\s*[\\|\\-]\\s*buy.*$`, 'i'),
            new RegExp(`\\s*[\\|\\-]\\s*shop.*$`, 'i'),
            /\s*[\|\-]\s*.*store.*$/i,
            /\s*[\|\-]\s*.*amazon.*$/i
        ];
        
        for (const pattern of cleanPatterns) {
            title = title.replace(pattern, '');
        }
        
        return title.trim() || 'Untitled Item';
    }
    
    detectPrice() {
        let price = '';
        
        // Strategy 1: Schema.org structured data
        const schemaPrice = document.querySelector('[itemprop="price"]');
        if (schemaPrice) {
            price = schemaPrice.textContent || schemaPrice.getAttribute('content');
        }
        
        // Strategy 2: Meta property
        const ogPrice = document.querySelector('meta[property="product:price:amount"]');
        if (ogPrice && ogPrice.content) {
            price = ogPrice.content;
        }
        
        // Strategy 3: Common price selectors
        if (!price) {
            for (const selector of this.priceSelectors) {
                const element = document.querySelector(selector);
                if (element && element.textContent) {
                    const text = element.textContent.trim();
                    const priceMatch = text.match(/\$[\d,]+\.?\d*/);
                    if (priceMatch) {
                        price = priceMatch[0];
                        break;
                    }
                }
            }
        }
        
        // Strategy 4: Find any price-like text on page
        if (!price) {
            const priceRegex = /\$[\d,]+\.?\d*/g;
            const bodyText = document.body.textContent;
            const matches = bodyText.match(priceRegex);
            if (matches && matches.length > 0) {
                // Try to find the most likely price (not too small, not too large)
                const validPrices = matches.filter(p => {
                    const num = parseFloat(p.replace(/[$,]/g, ''));
                    return num >= 1 && num <= 10000;
                });
                if (validPrices.length > 0) {
                    price = validPrices[0];
                }
            }
        }
        
        // Clean up price
        if (price) {
            price = price.replace(/[^\d.,]/g, '');
            if (price.includes('.')) {
                price = parseFloat(price).toFixed(2);
            }
        }
        
        return price || '';
    }
    
    detectImage() {
        let imageUrl = '';
        
        // Strategy 1: Meta property
        const ogImage = document.querySelector('meta[property="og:image"]');
        if (ogImage && ogImage.content) {
            imageUrl = ogImage.content;
        }
        
        // Strategy 2: Schema.org structured data
        const schemaImage = document.querySelector('[itemprop="image"]');
        if (schemaImage) {
            imageUrl = schemaImage.src || schemaImage.getAttribute('content');
        }
        
        // Strategy 3: Common image selectors
        if (!imageUrl) {
            for (const selector of this.imageSelectors) {
                const img = document.querySelector(selector);
                if (img && img.src && !img.src.includes('data:')) {
                    imageUrl = img.src;
                    break;
                }
            }
        }
        
        // Strategy 4: Largest image on page
        if (!imageUrl) {
            const images = Array.from(document.querySelectorAll('img'));
            const validImages = images.filter(img => 
                img.src && 
                !img.src.includes('data:') &&
                img.naturalWidth > 100 &&
                img.naturalHeight > 100
            );
            
            if (validImages.length > 0) {
                // Sort by size and pick largest
                validImages.sort((a, b) => 
                    (b.naturalWidth * b.naturalHeight) - (a.naturalWidth * a.naturalHeight)
                );
                imageUrl = validImages[0].src;
            }
        }
        
        // Make sure URL is absolute
        if (imageUrl && !imageUrl.startsWith('http')) {
            imageUrl = new URL(imageUrl, window.location.href).href;
        }
        
        return imageUrl || '';
    }
    
    detectBrand() {
        let brand = '';
        
        // Strategy 1: Schema.org structured data
        const schemaBrand = document.querySelector('[itemprop="brand"]');
        if (schemaBrand) {
            brand = schemaBrand.textContent || schemaBrand.getAttribute('content');
        }
        
        // Strategy 2: Meta property
        const ogBrand = document.querySelector('meta[property="product:brand"]');
        if (ogBrand && ogBrand.content) {
            brand = ogBrand.content;
        }
        
        // Strategy 3: Common brand selectors
        if (!brand) {
            for (const selector of this.brandSelectors) {
                const element = document.querySelector(selector);
                if (element && element.textContent.trim()) {
                    brand = element.textContent.trim();
                    break;
                }
            }
        }
        
        // Strategy 4: Extract from title or URL
        if (!brand) {
            const title = document.title.toLowerCase();
            const url = window.location.hostname.toLowerCase();
            
            const commonBrands = [
                'nike', 'adidas', 'zara', 'h&m', 'uniqlo', 'amazon', 'target',
                'walmart', 'nordstrom', 'macy', 'gap', 'old navy', 'banana republic',
                'j.crew', 'anthropologie', 'urban outfitters', 'forever 21',
                'asos', 'boohoo', 'shein', 'fashion nova'
            ];
            
            for (const brandName of commonBrands) {
                if (title.includes(brandName) || url.includes(brandName)) {
                    brand = brandName.charAt(0).toUpperCase() + brandName.slice(1);
                    break;
                }
            }
        }
        
        return brand || '';
    }
    
    detectColor() {
        let color = '';
        
        // Look for color keywords in text
        const colorKeywords = [
            'black', 'white', 'red', 'blue', 'green', 'yellow', 'pink', 'purple',
            'brown', 'gray', 'grey', 'orange', 'navy', 'beige', 'tan', 'gold',
            'silver', 'burgundy', 'maroon', 'olive', 'teal', 'coral', 'mint'
        ];
        
        const pageText = document.body.textContent.toLowerCase();
        
        for (const colorWord of colorKeywords) {
            if (pageText.includes(colorWord)) {
                color = colorWord.charAt(0).toUpperCase() + colorWord.slice(1);
                break;
            }
        }
        
        return color || '';
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
        let size = '';
        
        const pageText = document.body.textContent;
        const sizeRegex = /\b(XXS|XS|S|M|L|XL|XXL|XXXL|Small|Medium|Large|Extra Large|\d+|\d+\.\d+)\b/gi;
        const matches = pageText.match(sizeRegex);
        
        if (matches && matches.length > 0) {
            // Filter out numbers that are likely not sizes
            const validSizes = matches.filter(match => {
                const num = parseFloat(match);
                return isNaN(num) || (num >= 2 && num <= 50);
            });
            
            if (validSizes.length > 0) {
                size = validSizes[0];
            }
        }
        
        return size || '';
    }
}

// Initialize the item detector
const itemDetector = new ItemDetector(); 