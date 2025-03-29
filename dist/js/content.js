// Store global variables for tracking scan state
let isScanning = false;
let hasScanned = false;

// Performance monitoring
let scanStartTime = 0;
const OVERALL_TIMEOUT = 60000; // 60 seconds max for the entire process

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
    return true; // Keep the message channel open for sendResponse
  }
  
  // Handle scan requests from popup
  if (message.type === 'startScan') {
    console.log('Received scan request with reference image');
    
    // Check if we're already scanning to avoid duplicate scans
    if (isScanning) {
      console.log('Scan already in progress, rejecting new scan request');
      sendResponse({ success: false, error: 'Scan already in progress' });
      return true;
    }
    
    isScanning = true;
    scanStartTime = performance.now();
    console.log('Scan started at:', new Date().toISOString());
    
    // Progress tracking
    const sendProgressUpdate = (stage) => {
      chrome.runtime.sendMessage({
        type: 'scanProgress',
        stage: stage,
        timestamp: new Date().toISOString()
      });
    };
    
    // Get the reference image from the message
    const referenceImage = message.referenceImage;
    
    if (!referenceImage) {
      console.error('No reference image provided in scan request');
      isScanning = false;
      sendResponse({ success: false, error: 'No reference image provided' });
      return true;
    }
    
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Image scanning process timed out. The page might be too complex.')), OVERALL_TIMEOUT);
    });
    
    // Perform the scan with timeout
    Promise.race([
      scanPageForSimilarItems(referenceImage, sendProgressUpdate),
      timeoutPromise
    ])
      .then(results => {
        isScanning = false;
        hasScanned = true;
        const scanDuration = Math.round(performance.now() - scanStartTime);
        console.log(`Scan completed in ${scanDuration}ms with ${results.length} results`);
        
        // Send results back to popup
        chrome.runtime.sendMessage({
          type: 'scanResults',
          results: results,
          scanDuration: scanDuration
        });
        
        sendResponse({ success: true });
      })
      .catch(error => {
        console.error('Error scanning page:', error);
        isScanning = false;
        
        // Extract a more specific error message if available
        let errorMessage = error.message || 'Unknown error occurred during scanning';
        if (errorMessage.length > 100) {
          // Truncate very long error messages for readability
          errorMessage = errorMessage.substring(0, 100) + '...';
        }
        
        chrome.runtime.sendMessage({
          type: 'scanResults',
          results: [],
          error: errorMessage,
          scanDuration: Math.round(performance.now() - scanStartTime)
        });
        
        sendResponse({ success: false, error: errorMessage });
      });
    
    // Keep the message channel open for async response
    return true;
  }
});

// Function to dynamically load a script
function loadScript(src) {
  console.log(`Starting to load script: ${src}`);
  return new Promise((resolve, reject) => {
    // Check if script is already loaded
    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (existingScript) {
      console.log(`Script already loaded: ${src}`);
      console.log('Script element:', existingScript);
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    
    // Add error handling
    script.onerror = (e) => {
      console.error(`Failed to load script: ${src}`, e);
      console.error('Error details:', {
        type: e.type,
        target: e.target,
        currentTarget: e.currentTarget
      });
      reject(new Error(`Failed to load required script: ${src}`));
    };
    
    // Add load handling
    script.onload = () => {
      console.log(`Script loaded successfully: ${src}`);
      console.log('Script element:', script);
      script.setAttribute('loaded', 'true');
      resolve();
    };
    
    // Add to document
    console.log('Adding script to document head');
    document.head.appendChild(script);
    
    // Add a timeout as a backup
    setTimeout(() => {
      if (!script.hasAttribute('loaded')) {
        console.warn(`Script load timeout: ${src}`);
        console.warn('Script element state:', {
          loaded: script.hasAttribute('loaded'),
          readyState: script.readyState,
          parentNode: script.parentNode
        });
        reject(new Error(`Timeout loading script: ${src}`));
      }
    }, 15000); // 15 second timeout
  });
}

// Function to load required libraries with fallbacks
async function loadRequiredLibraries() {
  console.log('Starting library loading process...');
  
  // Helper function to verify script loading
  const verifyScript = async (scriptUrl, globalVar, timeout = 5000) => {
    return new Promise((resolve, reject) => {
      console.log(`Creating script element for: ${scriptUrl}`);
      const script = document.createElement('script');
      script.src = scriptUrl;
      script.async = false; // Load scripts in order
      script.defer = false; // We want immediate loading
      
      const timeoutId = setTimeout(() => {
        console.error(`Timeout loading ${scriptUrl}`);
        reject(new Error(`Timeout loading ${scriptUrl}`));
      }, timeout);
      
      script.onload = () => {
        console.log(`Script loaded successfully: ${scriptUrl}`);
        clearTimeout(timeoutId);
        // Verify the global variable is actually defined
        console.log(`Checking if ${globalVar} is defined:`, typeof window[globalVar] !== 'undefined');
        if (typeof window[globalVar] === 'undefined') {
          console.error(`${globalVar} not defined after loading ${scriptUrl}`);
          reject(new Error(`${globalVar} not defined after loading ${scriptUrl}`));
          return;
        }
        resolve();
      };
      
      script.onerror = (error) => {
        console.error(`Error loading ${scriptUrl}:`, error);
        clearTimeout(timeoutId);
        reject(new Error(`Error loading ${scriptUrl}: ${error.type}`));
      };
      
      console.log(`Appending script to document head: ${scriptUrl}`);
      document.head.appendChild(script);
    });
  };
  
  try {
    // Load TensorFlow.js first
    const tfUrl = chrome.runtime.getURL('/js/lib/tf.min.js');
    console.log('>>> DEBUG: Generated TensorFlow.js URL:', tfUrl);
    console.log('Loading TensorFlow.js from:', tfUrl);
    await verifyScript(tfUrl, 'tf');
    console.log('TensorFlow.js loaded successfully:', tf.version);
    
    // Load MobileNet after TensorFlow.js
    const mobilenetUrl = chrome.runtime.getURL('/js/lib/mobilenet.min.js');
    console.log('>>> DEBUG: Generated MobileNet URL:', mobilenetUrl);
    console.log('Loading MobileNet from:', mobilenetUrl);
    await verifyScript(mobilenetUrl, 'mobilenet');
    console.log('MobileNet loaded successfully');
    
    // Final verification
    if (typeof tf === 'undefined' || typeof mobilenet === 'undefined') {
      throw new Error('Libraries not properly initialized after loading');
    }
    
    // Initialize TensorFlow.js backend
    await tf.ready();
    console.log('TensorFlow.js backend initialized:', tf.getBackend());
    
  } catch (error) {
    console.error('Error in loadRequiredLibraries:', error);
    throw new Error(`Failed to initialize AI libraries: ${error.message}`);
  }
}

// Function to check for required browser features
function checkBrowserCompatibility() {
  // Check for WebAssembly (needed for TensorFlow.js)
  if (typeof WebAssembly === 'undefined') {
    throw new Error('Your browser does not support WebAssembly, which is required for image analysis.');
  }
  
  // Check for Canvas API (needed for image processing)
  const canvas = document.createElement('canvas');
  if (!canvas || !canvas.getContext || !canvas.getContext('2d')) {
    throw new Error('Your browser does not support Canvas API, which is required for image analysis.');
  }
  
  // Check for other required APIs
  if (!window.Blob || !window.URL || !window.FileReader) {
    throw new Error('Your browser does not support required APIs for image analysis.');
  }
  
  console.log('Browser compatibility check passed');
  return true;
}

// Function to scan the page for items similar to the reference image
async function scanPageForSimilarItems(referenceImageDataUrl, progressCallback = null) {
  // Start performance monitoring
  const startTime = performance.now();
  const logPerformance = (operation) => {
    console.log(`${operation} completed in ${Math.round(performance.now() - startTime)}ms`);
  };
  
  const updateProgress = (stage) => {
    if (progressCallback) progressCallback(stage);
    console.log(`Progress: ${stage}`);
  };
  
  console.log('Starting to scan page for similar items');
  console.log('Current page URL:', window.location.href);
  console.log('Reference image data URL length:', referenceImageDataUrl.length);
  updateProgress('Starting scan');
  
  try {
    // Check browser compatibility
    console.log('Checking browser compatibility...');
    checkBrowserCompatibility();
    updateProgress('Checking compatibility');
    
    // Load required libraries with improved error handling
    try {
      updateProgress('Loading AI libraries');
      console.log('Starting library loading process...');
      await loadRequiredLibraries();
      console.log('Libraries loaded successfully');
      logPerformance('Library loading');
    } catch (error) {
      console.error('Error loading libraries:', error);
      console.error('Error stack:', error.stack);
      throw new Error('Failed to load required AI libraries. This may be due to network issues or content restrictions on this site.');
    }
    
    // Check if MobileNet is available
    console.log('Checking MobileNet availability...');
    if (typeof mobilenet === 'undefined') {
      console.error('MobileNet not available after loading script');
      console.error('Global variables state:', {
        tf: typeof tf,
        mobilenet: typeof mobilenet,
        window: Object.keys(window)
      });
      throw new Error('Failed to initialize the image analysis model. This feature may not be supported on this website.');
    }
    
    updateProgress('Loading AI model');
    
    // Load MobileNet model for image feature extraction
    let model;
    try {
      console.log('Loading MobileNet model...');
      model = await mobilenet.load();
      console.log('Model loaded successfully');
      logPerformance('Model loading');
    } catch (modelError) {
      console.error('Standard model loading failed:', modelError);
      
      try {
        console.log('Attempting to load lighter model variant...');
        updateProgress('Trying alternative model');
        // Try a lighter model version
        model = await mobilenet.load({version: 1, alpha: 0.25});
        console.log('Lighter model loaded successfully');
        logPerformance('Lighter model loading');
      } catch (lightModelError) {
        console.error('Lighter model loading also failed:', lightModelError);
        throw new Error('Failed to load the image analysis model. Try on a different page or with a different image.');
      }
    }
    
    updateProgress('Processing reference image');
    
    // Convert the reference image data URL to an image element
    const referenceImg = new Image();
    referenceImg.crossOrigin = 'anonymous';
    
    try {
      // Load the reference image
      const imageLoadPromise = new Promise((resolve, reject) => {
        referenceImg.onload = resolve;
        referenceImg.onerror = (e) => reject(new Error(`Failed to load reference image: ${e.type}`));
        // Set a timeout in case the image never loads
        setTimeout(() => reject(new Error('Timeout loading reference image')), 10000);
      });
      
      referenceImg.src = referenceImageDataUrl;
      await imageLoadPromise;
      console.log('Reference image loaded successfully');
      logPerformance('Reference image loading');
    } catch (imgError) {
      console.error('Reference image loading error:', imgError);
      throw new Error('Could not process the uploaded image. Try a different image format or size.');
    }
    
    // Get the feature vector for the reference image
    let referenceFeatures;
    try {
      console.log('Extracting features from reference image...');
      updateProgress('Analyzing reference image');
      referenceFeatures = await model.infer(referenceImg, true);
      console.log('Reference features extracted successfully');
      logPerformance('Reference feature extraction');
    } catch (featureError) {
      console.error('Error extracting features from reference image:', featureError);
      throw new Error('Could not analyze the reference image. The image may be too complex or in an unsupported format.');
    }
    
    // Find all product images on the page
    console.log('Finding product items on page...');
    updateProgress('Finding products on page');
    const productItems = findProductItems();
    console.log(`Found ${productItems.length} potential product items`);
    logPerformance('Product items detection');
    
    if (productItems.length === 0) {
      return []; // No products found
    }
    
    updateProgress('Comparing products');
    
    // Compare each product image to the reference image
    const results = [];
    const totalItems = productItems.length;
    let processedItems = 0;
    
    // Process items in batches to avoid blocking the UI
    const BATCH_SIZE = 5;
    
    for (let i = 0; i < productItems.length; i += BATCH_SIZE) {
      const batch = productItems.slice(i, i + BATCH_SIZE);
      
      // Process batch
      await Promise.all(batch.map(async (item) => {
        try {
          // Skip items without images
          if (!item.image || !item.imageElement) return;
          
          // Skip images that are too small
          if (item.imageElement.naturalWidth < 30 || item.imageElement.naturalHeight < 30) return;
          
          console.log(`Processing product: ${item.title || 'Unnamed product'}`);
          
          // Extract features from the product image
          const productFeatures = await model.infer(item.imageElement, true);
          
          // Calculate similarity score (cosine similarity)
          const score = calculateCosineSimilarity(
            await referenceFeatures.data(),
            await productFeatures.data()
          );
          
          console.log(`Similarity score: ${score.toFixed(2)} for ${item.title || 'Unnamed product'}`);
          
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
        } catch (itemError) {
          console.error('Error processing item:', itemError);
          // Continue with other items
        }
        
        // Update progress count
        processedItems++;
        if (processedItems % 10 === 0 || processedItems === totalItems) {
          updateProgress(`Analyzed ${processedItems}/${totalItems} items`);
        }
      }));
      
      // Small delay between batches to let the UI breathe
      if (i + BATCH_SIZE < productItems.length) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    
    logPerformance('Product comparison');
    
    // Sort results by similarity score (highest first)
    results.sort((a, b) => b.score - a.score);
    
    console.log(`Found ${results.length} matching items`);
    updateProgress('Finalizing results');
    
    // Return top matches
    return results.slice(0, 10);
  } catch (error) {
    console.error('Error in scanPageForSimilarItems:', error);
    throw error;
  }
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
    '.grid-item, .product-grid-item, .product-container, article, .card, ' +
    // Amazon specific
    '.s-result-item, .s-search-result, ' +
    // Etsy specific
    '.listing-link, .v2-listing-card, ' +
    // eBay specific
    '.s-item, .s-item__pl-on-bottom, ' + 
    // Generic e-commerce
    '[data-component-type="s-search-result"], [data-item-id]'
  );
  
  productContainers.forEach(container => {
    // Find image
    const imgElement = container.querySelector('img');
    if (!imgElement || !imgElement.src) return;
    
    // Skip tiny images (likely not product images)
    if (imgElement.naturalWidth < 50 || imgElement.naturalHeight < 50) return;
    
    // Skip data URI images (often placeholders)
    if (imgElement.src.startsWith('data:')) return;
    
    // Generate a unique ID for this element if it doesn't have one
    if (!container.id) {
      container.id = itemId + idCounter++;
    }
    
    // Find title
    let title = '';
    const titleElement = container.querySelector('h1, h2, h3, h4, .product-title, .title, .name, .a-text-normal');
    if (titleElement) {
      title = titleElement.textContent.trim();
    }
    
    // Find price
    let price = '';
    const priceElement = container.querySelector(
      '.price, [data-testid="price"], .product-price, .amount, .current-price, .a-price'
    );
    if (priceElement) {
      price = priceElement.textContent.trim();
    }
    
    items.push({
      id: container.id,
      image: imgElement.src,
      imageElement: imgElement,
      title: title,
      price: price,
      element: container
    });
  });
  
  console.log(`Found ${items.length} products using container selectors`);
  
  // If no product containers were found, try a more general approach
  if (items.length === 0) {
    // Get all images on the page that are reasonably sized
    document.querySelectorAll('img').forEach(img => {
      // Skip inappropriate images
      if (img.naturalWidth < 100 || img.naturalHeight < 100) return;
      if (!img.src || img.src.startsWith('data:')) return;
      
      // Skip likely non-product images
      if (img.src.includes('logo') || img.src.includes('icon') || img.src.includes('banner')) return;
      
      // Find a parent container
      let container = img.parentElement;
      for (let i = 0; i < 3 && container; i++) {
        if (!container.id) {
          container.id = itemId + idCounter++;
        }
        
        // Try to find title and price near the image
        let title = '';
        let price = '';
        
        // Look for text nearby that might be a title
        const nearbyText = container.textContent.trim();
        if (nearbyText && nearbyText.length < 200) {
          title = nearbyText;
        }
        
        // Look for price pattern
        const priceMatch = nearbyText.match(/\$\d+(\.\d{2})?/);
        if (priceMatch) {
          price = priceMatch[0];
        }
        
        items.push({
          id: container.id,
          image: img.src,
          imageElement: img,
          title: title,
          price: price,
          element: container
        });
        
        break;
      }
    });
  }
  
  console.log(`Total products found: ${items.length}`);
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

// Log that the content script has loaded
console.log('Smart Shopping Assistant content script loaded', { timestamp: new Date().toISOString() }); 