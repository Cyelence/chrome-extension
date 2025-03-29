/**
 * Content script for Smart Shopping Assistant
 * Runs on product pages to identify and recommend similar products
 */

import { productMatcher, ProductMatch, ImageProductMatcher } from './image-product-matcher';

// DOM Elements
let floatingButton: HTMLDivElement | null = null;
let resultsPanel: HTMLDivElement | null = null;
let isResultsPanelOpen = false;

// Initialize the extension
function initialize(): void {
  // Only run on product pages (this is a basic example - you'd want more robust detection)
  if (!isProductPage()) return;
  
  // Add floating action button
  createFloatingButton();
  
  console.log('Smart Shopping Assistant initialized');
}

// Check if current page is likely a product page
function isProductPage(): boolean {
  // Check URL patterns
  const url = window.location.href.toLowerCase();
  
  // Amazon product page
  if (url.includes('amazon.com') && (url.includes('/dp/') || url.includes('/gp/product/'))) {
    return true;
  }
  
  // Etsy product page
  if (url.includes('etsy.com/listing/')) {
    return true;
  }
  
  // eBay product page
  if (url.includes('ebay.com/itm/')) {
    return true;
  }
  
  // Walmart product page
  if (url.includes('walmart.com/ip/')) {
    return true;
  }
  
  // Fallback: check for common product page elements
  const hasProductImage = !!ImageProductMatcher.getMainProductImage();
  const hasAddToCartButton = !!document.querySelector('[id*="add-to-cart"], [class*="add-to-cart"], [class*="addToCart"]');
  const hasProductTitle = !!document.querySelector('[id*="title"], [class*="title"], h1');
  
  return hasProductImage && (hasAddToCartButton || hasProductTitle);
}

// Create a floating action button
function createFloatingButton(): void {
  if (floatingButton) return;
  
  floatingButton = document.createElement('div');
  floatingButton.className = 'ssa-floating-button';
  floatingButton.innerHTML = `
    <div class="ssa-button-icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="9" cy="21" r="1"></circle>
        <circle cx="20" cy="21" r="1"></circle>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
      </svg>
    </div>
    <span class="ssa-button-text">Find Similar</span>
  `;
  
  // Style the button
  const style = document.createElement('style');
  style.textContent = `
    .ssa-floating-button {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: #4285f4;
      color: white;
      display: flex;
      align-items: center;
      padding: 12px 16px;
      border-radius: 24px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      cursor: pointer;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      transition: transform 0.2s;
    }
    .ssa-floating-button:hover {
      transform: scale(1.05);
    }
    .ssa-button-icon {
      margin-right: 8px;
    }
    .ssa-button-text {
      font-size: 14px;
      font-weight: 500;
    }
    .ssa-results-panel {
      position: fixed;
      top: 0;
      right: 0;
      width: 360px;
      height: 100vh;
      background: white;
      box-shadow: -2px 0 8px rgba(0,0,0,0.1);
      z-index: 10001;
      display: flex;
      flex-direction: column;
      transform: translateX(100%);
      transition: transform 0.3s ease;
    }
    .ssa-results-panel.open {
      transform: translateX(0);
    }
    .ssa-panel-header {
      padding: 16px;
      border-bottom: 1px solid #eee;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .ssa-panel-title {
      font-size: 16px;
      font-weight: 600;
      margin: 0;
    }
    .ssa-close-button {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 20px;
    }
    .ssa-panel-content {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    }
    .ssa-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
    }
    .ssa-product-card {
      border: 1px solid #eee;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 12px;
      display: flex;
      text-decoration: none;
      color: inherit;
    }
    .ssa-product-image {
      width: 80px;
      height: 80px;
      object-fit: contain;
      margin-right: 12px;
      border-radius: 4px;
    }
    .ssa-product-info {
      flex: 1;
    }
    .ssa-product-title {
      font-size: 14px;
      font-weight: 500;
      margin: 0 0 4px 0;
      color: #333;
    }
    .ssa-product-price {
      font-size: 14px;
      font-weight: 600;
      color: #4285f4;
      margin: 4px 0;
    }
    .ssa-product-source {
      font-size: 12px;
      color: #777;
    }
    .ssa-product-similarity {
      font-size: 12px;
      color: #777;
      margin-top: 4px;
    }
  `;
  document.head.appendChild(style);
  
  // Add click event
  floatingButton.addEventListener('click', findSimilarProducts);
  
  // Add to page
  document.body.appendChild(floatingButton);
}

// Create results panel
function createResultsPanel(): void {
  if (resultsPanel) return;
  
  resultsPanel = document.createElement('div');
  resultsPanel.className = 'ssa-results-panel';
  resultsPanel.innerHTML = `
    <div class="ssa-panel-header">
      <h2 class="ssa-panel-title">Similar Products</h2>
      <button class="ssa-close-button">&times;</button>
    </div>
    <div class="ssa-panel-content">
      <div class="ssa-loading">
        <p>Loading similar products...</p>
      </div>
    </div>
  `;
  
  // Add close event
  const closeButton = resultsPanel.querySelector('.ssa-close-button');
  if (closeButton) {
    closeButton.addEventListener('click', toggleResultsPanel);
  }
  
  // Add to page
  document.body.appendChild(resultsPanel);
}

// Toggle results panel visibility
function toggleResultsPanel(): void {
  if (!resultsPanel) {
    createResultsPanel();
  }
  
  isResultsPanelOpen = !isResultsPanelOpen;
  
  if (isResultsPanelOpen) {
    resultsPanel?.classList.add('open');
  } else {
    resultsPanel?.classList.remove('open');
  }
}

// Find similar products using the product matcher
async function findSimilarProducts(): Promise<void> {
  // Create and open results panel
  if (!resultsPanel) {
    createResultsPanel();
  }
  
  if (!isResultsPanelOpen) {
    toggleResultsPanel();
  }
  
  // Clear previous results and show loading
  const contentElement = resultsPanel?.querySelector('.ssa-panel-content');
  if (contentElement) {
    contentElement.innerHTML = `
      <div class="ssa-loading">
        <p>Finding similar products...</p>
      </div>
    `;
  }
  
  try {
    // Get main product image
    const productImage = ImageProductMatcher.getMainProductImage();
    
    if (!productImage) {
      if (contentElement) {
        contentElement.innerHTML = `
          <div class="ssa-loading">
            <p>No product image found on this page</p>
          </div>
        `;
      }
      return;
    }
    
    // Generate embedding
    const embedding = await productMatcher.generateEmbedding(productImage);
    
    // Find similar products
    const matches = await productMatcher.findSimilarProducts(embedding, {
      minSimilarityScore: 0.7,
      maxResults: 10
    });
    
    // Display results
    displayResults(matches);
    
  } catch (error) {
    console.error('Error finding similar products:', error);
    if (contentElement) {
      contentElement.innerHTML = `
        <div class="ssa-loading">
          <p>Error finding similar products. Please try again.</p>
        </div>
      `;
    }
  }
}

// Display product matches in the panel
function displayResults(products: ProductMatch[]): void {
  const contentElement = resultsPanel?.querySelector('.ssa-panel-content');
  if (!contentElement) return;
  
  if (products.length === 0) {
    contentElement.innerHTML = `
      <div class="ssa-loading">
        <p>No similar products found</p>
      </div>
    `;
    return;
  }
  
  // Create HTML for results
  const productsHtml = products.map(product => `
    <a href="${product.productUrl}" target="_blank" class="ssa-product-card">
      <img src="${product.imageUrl}" alt="${product.title}" class="ssa-product-image">
      <div class="ssa-product-info">
        <h3 class="ssa-product-title">${product.title}</h3>
        <p class="ssa-product-price">${product.price}</p>
        <span class="ssa-product-source">From ${product.source}</span>
        <div class="ssa-product-similarity">Similarity: ${Math.round(product.similarityScore * 100)}%</div>
      </div>
    </a>
  `).join('');
  
  contentElement.innerHTML = productsHtml;
}

// Initialize when the DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
} 