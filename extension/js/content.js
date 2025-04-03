/**
 * Smart Shopping Assistant Content Script
 * 
 * This script runs on web pages to analyze product images and find visual matches.
 * It uses TensorFlow.js and MobileNet for image feature extraction and similarity comparison.
 */

import { CONFIG } from './modules/config.js';
import { State } from './modules/state.js';
import { loadRequiredLibraries } from './modules/libraryLoader.js';
import { findProductItems } from './modules/productDetector.js';
import { loadImageFromDataUrl, processProductBatch } from './modules/imageProcessor.js';
import { checkBrowserCompatibility } from './modules/browserCompatibility.js';

// ===== Message Handling =====
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle element scrolling
  if (message.type === 'scrollToElement') {
    return handleScrollToElement(message, sendResponse);
  }
  
  // Handle scan requests
  if (message.type === 'startScan') {
    return handleScanRequest(message, sendResponse);
  }
  
  return false;
});

/**
 * Handles scrolling to an element on the page
 */
function handleScrollToElement(message, sendResponse) {
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

/**
 * Handles a request to scan the page for similar items
 */
function handleScanRequest(message, sendResponse) {
  console.log('Received scan request with reference image');
  
  // Check if we're already scanning to avoid duplicate scans
  if (State.isScanning) {
    console.log('Scan already in progress, rejecting new scan request');
    sendResponse({ success: false, error: 'Scan already in progress' });
    return true;
  }
  
  State.startScan();
  
  // Progress tracking callback
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
    State.isScanning = false;
    sendResponse({ success: false, error: 'No reference image provided' });
    return true;
  }
  
  // Create a timeout promise
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Image scanning process timed out. The page might be too complex.')), CONFIG.SCAN_TIMEOUT);
  });
  
  // Perform the scan with timeout
  Promise.race([
    scanPageForSimilarItems(referenceImage, sendProgressUpdate),
    timeoutPromise
  ])
    .then(results => {
      const scanDuration = State.endScan();
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
      State.isScanning = false;
      
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
        scanDuration: State.getElapsedTime()
      });
      
      sendResponse({ success: false, error: errorMessage });
    });
  
  // Keep the message channel open for async response
  return true;
}

/**
 * Scans the page for items similar to the reference image
 * @param {string} referenceImageDataUrl - Data URL of reference image
 * @param {Function} progressCallback - Callback for progress updates
 * @returns {Promise<Array>} - Array of matching products
 */
async function scanPageForSimilarItems(referenceImageDataUrl, progressCallback = null) {
  // Initialize performance tracking
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
    // Step 1: Check browser compatibility
    console.log('Checking browser compatibility...');
    checkBrowserCompatibility();
    updateProgress('Checking compatibility');
    
    // Step 2: Load required libraries
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
    
    // Step 3: Verify libraries are available
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
    
    // Step 4: Load MobileNet model
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
    
    // Step 5: Load and process reference image
    let referenceImg;
    try {
      referenceImg = await loadImageFromDataUrl(referenceImageDataUrl);
      console.log('Reference image loaded successfully');
      logPerformance('Reference image loading');
    } catch (imgError) {
      console.error('Reference image loading error:', imgError);
      throw new Error('Could not process the uploaded image. Try a different image format or size.');
    }
    
    // Step 6: Extract features from reference image
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
    
    // Step 7: Find product items on the page
    console.log('Finding product items on page...');
    updateProgress('Finding products on page');
    const productItems = findProductItems();
    console.log(`Found ${productItems.length} potential product items`);
    logPerformance('Product items detection');
    
    if (productItems.length === 0) {
      return []; // No products found
    }
    
    updateProgress('Comparing products');
    
    // Step 8: Process products in batches
    const results = [];
    const totalItems = productItems.length;
    let processedItems = 0;
    
    // Process items in batches to avoid blocking the UI
    for (let i = 0; i < productItems.length; i += CONFIG.BATCH_SIZE) {
      const batch = productItems.slice(i, i + CONFIG.BATCH_SIZE);
      
      // Process batch
      const batchResults = await processProductBatch(batch, referenceFeatures, model);
      results.push(...batchResults);
      
      // Update progress count
      processedItems += batch.length;
      if (processedItems % 10 === 0 || processedItems === totalItems) {
        updateProgress(`Analyzed ${processedItems}/${totalItems} items`);
      }
      
      // Small delay between batches to let the UI breathe
      if (i + CONFIG.BATCH_SIZE < productItems.length) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    
    logPerformance('Product comparison');
    
    // Step 9: Clean up resources
    referenceFeatures.dispose();
    
    // Step 10: Sort and finalize results
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

// Log that the content script has loaded
console.log('Smart Shopping Assistant content script loaded', { timestamp: new Date().toISOString() }); 