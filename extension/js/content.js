// Listen for messages from the extension popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'scrollToElement') {
    const element = document.getElementById(message.elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight the element temporarily
      const originalBorder = element.style.border;
      element.style.border = '3px solid #4285f4';
      setTimeout(() => {
        element.style.border = originalBorder;
      }, 2000);
    }
  }
});

// Check if we should scan the page
chrome.storage.local.get(['isScanning', 'referenceImage'], async (data) => {
  if (data.isScanning && data.referenceImage) {
    // Reset the scanning flag
    chrome.storage.local.set({ 'isScanning': false });
    
    try {
      // Load TensorFlow.js (we'll use a CDN for the MVP)
      await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs');
      await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet');
      
      // Start scanning the page
      const results = await scanPageForSimilarItems(data.referenceImage);
      
      // Send results back to popup
      chrome.runtime.sendMessage({
        type: 'scanResults',
        results: results
      });
    } catch (error) {
      console.error('Error scanning page:', error);
      chrome.runtime.sendMessage({
        type: 'scanResults',
        results: [],
        error: error.message
      });
    }
  }
});

// Function to dynamically load a script
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Function to scan the page for items similar to the reference image
async function scanPageForSimilarItems(referenceImageDataUrl) {
  // Load MobileNet model for image feature extraction
  const model = await mobilenet.load();
  
  // Convert the reference image data URL to an image element
  const referenceImg = new Image();
  referenceImg.src = referenceImageDataUrl;
  await new Promise(resolve => {
    referenceImg.onload = resolve;
  });
  
  // Get the feature vector for the reference image
  const referenceFeatures = await model.infer(referenceImg, true);
  
  // Find all product images on the page
  const productItems = findProductItems();
  
  // Compare each product image to the reference image
  const results = [];
  for (const item of productItems) {
    try {
      // Skip items without images
      if (!item.image || !item.imageElement) continue;
      
      // Extract features from the product image
      const productFeatures = await model.infer(item.imageElement, true);
      
      // Calculate similarity score (cosine similarity)
      const score = calculateCosineSimilarity(
        await referenceFeatures.data(),
        await productFeatures.data()
      );
      
      // Add to results if score is above threshold
      if (score > 0.5) { // Adjust threshold as needed
        results.push({
          id: item.id,
          image: item.image,
          title: item.title,
          price: item.price,
          score: score
        });
      }
    } catch (error) {
      console.error('Error processing item:', error);
    }
  }
  
  // Sort results by similarity score (highest first)
  results.sort((a, b) => b.score - a.score);
  
  // Return top matches
  return results.slice(0, 10);
}

// Function to find all product items on the page
function findProductItems() {
  const items = [];
  const itemId = 'product-item-';
  let idCounter = 0;
  
  // Common selectors for product listings (we'll improve this over time)
  const productContainers = document.querySelectorAll(
    // Common e-commerce sites selectors
    '.product, .product-item, .product-card, .item, [data-testid="product-card"], ' +
    '.grid-item, .product-grid-item, .product-container, article, .card'
  );
  
  productContainers.forEach(container => {
    // Find image
    const imgElement = container.querySelector('img');
    if (!imgElement || !imgElement.src) return;
    
    // Generate a unique ID for this element if it doesn't have one
    if (!container.id) {
      container.id = itemId + idCounter++;
    }
    
    // Find title
    let title = '';
    const titleElement = container.querySelector('h1, h2, h3, h4, .product-title, .title, .name');
    if (titleElement) {
      title = titleElement.textContent.trim();
    }
    
    // Find price
    let price = '';
    const priceElement = container.querySelector(
      '.price, [data-testid="price"], .product-price, .amount, .current-price'
    );
    if (priceElement) {
      price = priceElement.textContent.trim();
    }
    
    items.push({
      id: container.id,
      image: imgElement.src,
      imageElement: imgElement,
      title: title,
      price: price
    });
  });
  
  return items;
}

// Function to calculate cosine similarity between two feature vectors
function calculateCosineSimilarity(vec1, vec2) {
  if (vec1.length !== vec2.length) {
    throw new Error('Vectors must have the same length');
  }
  
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;
  
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    mag1 += vec1[i] * vec1[i];
    mag2 += vec2[i] * vec2[i];
  }
  
  mag1 = Math.sqrt(mag1);
  mag2 = Math.sqrt(mag2);
  
  if (mag1 === 0 || mag2 === 0) {
    return 0;
  }
  
  return dotProduct / (mag1 * mag2);
} 