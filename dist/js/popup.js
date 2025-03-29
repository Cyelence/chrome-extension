document.addEventListener('DOMContentLoaded', function() {
  // Tab switching functionality
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons and contents
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Add active class to clicked button and corresponding content
      button.classList.add('active');
      const tabId = button.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
    });
  });
  
  // Image upload functionality
  const uploadBtn = document.getElementById('upload-btn');
  const imageUpload = document.getElementById('image-upload');
  const imagePreview = document.getElementById('image-preview');
  const previewContainer = document.getElementById('preview-container');
  const scanBtn = document.getElementById('scan-btn');
  const resultsContainer = document.getElementById('results-container');
  
  // Store the current reference image
  let currentReferenceImage = null;
  let isScanning = false;
  let scanTimeout = null;
  
  // SVG placeholder for image fallback
  const imagePlaceholderSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80" fill="none">
      <rect width="80" height="80" fill="#f0f0f0"/>
      <path d="M32 26C34.2091 26 36 24.2091 36 22C36 19.7909 34.2091 18 32 18C29.7909 18 28 19.7909 28 22C28 24.2091 29.7909 26 32 26Z" fill="#ccc"/>
      <path d="M20 56L30 42L40 52L50 38L60 56H20Z" fill="#ccc"/>
    </svg>
  `;
  
  // Function to show error messages
  function showError(message, isWarning = false) {
    const errorClass = isWarning ? 'warning-message' : 'error-message';
    resultsContainer.innerHTML = `<div class="${errorClass}">${message}</div>`;
  }
  
  // Function to set scanning state
  function setScanningState(scanning, progressStage = '') {
    isScanning = scanning;
    scanBtn.disabled = scanning;
    scanBtn.textContent = scanning ? 'Scanning...' : 'Scan Page for Matches';
    
    // Clear any previous timeout
    if (scanTimeout) {
      clearTimeout(scanTimeout);
      scanTimeout = null;
    }
    
    if (scanning) {
      // Set a timeout to show a message if scanning takes too long
      scanTimeout = setTimeout(() => {
        const progressEl = document.querySelector('.progress-message');
        if (progressEl) {
          progressEl.innerHTML += '<div class="progress-note">This is taking longer than usual. Complex pages may require more time to analyze.</div>';
        }
      }, 15000); // 15 seconds
      
      // Show more detailed progress information
      const stageText = progressStage ? `<span class="progress-stage">${progressStage}</span>` : '';
      resultsContainer.innerHTML = `
        <div class="progress-message">
          <div class="loading-spinner"></div>
          <div class="progress-text">Scanning page${stageText ? ':' : ''}${stageText}</div>
        </div>
      `;
    }
  }
  
  // Function to update progress
  function updateProgressStage(stage) {
    const stageEl = document.querySelector('.progress-stage');
    if (stageEl) {
      stageEl.textContent = stage;
    } else {
      setScanningState(true, stage);
    }
  }
  
  uploadBtn.addEventListener('click', () => {
    imageUpload.click();
  });
  
  imageUpload.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file type
      if (!file.type.match('image.*')) {
        showError('Please select an image file (JPEG, PNG, etc.)');
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showError('Image too large. Please select an image under 5MB.');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target.result;
        imagePreview.src = imageData;
        previewContainer.hidden = false;
        currentReferenceImage = imageData;
        
        // Clear previous results
        resultsContainer.innerHTML = '';
        
        // Enable scan button
        scanBtn.disabled = false;
      };
      reader.onerror = () => {
        showError('Error reading the image file. Please try another image.');
      };
      reader.readAsDataURL(file);
    }
  });
  
  scanBtn.addEventListener('click', () => {
    if (isScanning) {
      return; // Prevent multiple simultaneous scans
    }
    
    if (!currentReferenceImage) {
      showError('Please upload an image first.');
      return;
    }
    
    // Set scanning state
    setScanningState(true, 'Initializing');
    
    // Track start time for performance monitoring
    const scanStartTime = performance.now();
    
    // Get the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      
      // Check if we can run the scan on this page
      const url = activeTab.url || '';
      if (!url || url.startsWith('chrome://') || url.startsWith('chrome-extension://') || url.startsWith('about:')) {
        setScanningState(false);
        showError('Cannot scan this page. Please try on a regular website.');
        return;
      }
      
      // Make sure the content script is injected
      chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        files: ['js/content.js']
      }).then(() => {
        console.log('Content script injected, starting scan');
        
        // Wait a moment to ensure script is fully loaded
        setTimeout(() => {
          // Send message to content script to start scanning
          chrome.tabs.sendMessage(
            activeTab.id,
            { 
              type: 'startScan',
              referenceImage: currentReferenceImage
            },
            (response) => {
              if (chrome.runtime.lastError) {
                console.error('Error sending message:', chrome.runtime.lastError);
                setScanningState(false);
                showError('Cannot communicate with the page. Please try reloading the page and trying again.');
              } else if (response && !response.success) {
                setScanningState(false);
                showError(response.error || 'Unknown error occurred during scanning.');
              }
              // If successful, we'll wait for the results message
            }
          );
        }, 500);
      }).catch(err => {
        console.error('Error injecting content script:', err);
        setScanningState(false);
        showError('Could not scan the page. The site might be restricting content scripts.');
      });
    });
  });
  
  // Listen for scan results and progress updates
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'scanResults') {
      // Calculate elapsed time
      const scanDuration = message.scanDuration || 'unknown';
      console.log(`Scan completed in: ${scanDuration}ms`);
      
      setScanningState(false);
      displayResults(message.results, message.error, scanDuration);
      return true;
    }
    
    if (message.type === 'scanProgress') {
      updateProgressStage(message.stage);
      return true;
    }
  });
  
  function displayResults(results, error, scanDuration) {
    if (error) {
      showError(`Error: ${error}`);
      return;
    }
    
    if (!results || results.length === 0) {
      resultsContainer.innerHTML = `
        <div class="no-results">
          <p>No similar items found on this page.</p>
          <p class="scan-stats">Scan completed in ${typeof scanDuration === 'number' ? `${scanDuration}ms` : 'unknown time'}.</p>
          <p class="suggestion">Try a different image or visit a page with more products.</p>
        </div>
      `;
      return;
    }
    
    resultsContainer.innerHTML = `
      <h3>Found Similar Items</h3>
      <p class="scan-stats">Found ${results.length} item${results.length !== 1 ? 's' : ''} in ${typeof scanDuration === 'number' ? `${(scanDuration / 1000).toFixed(1)} seconds` : 'unknown time'}.</p>
      <div class="results-grid"></div>
    `;
    
    const resultsGrid = resultsContainer.querySelector('.results-grid');
    
    results.forEach(result => {
      const matchItem = document.createElement('div');
      matchItem.className = 'match-item';
      
      // Use a container for the image to handle fallbacks
      const imageHTML = `
        <div class="match-image-container">
          <img 
            src="${result.image}" 
            alt="${result.title || 'Product image'}" 
            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
          >
          <div class="image-placeholder" style="display:none;">
            ${imagePlaceholderSVG}
          </div>
        </div>
      `;
      
      matchItem.innerHTML = `
        ${imageHTML}
        <div class="match-details">
          <div class="match-score">${Math.round(result.score * 100)}% match</div>
          <p class="match-title">${result.title || 'Unknown product'}</p>
          ${result.price ? `<p class="match-price">${result.price}</p>` : ''}
        </div>
        <div class="match-cta">Click to highlight</div>
      `;
      
      matchItem.addEventListener('click', () => {
        // Visual feedback that we're acting on the click
        matchItem.classList.add('match-item-active');
        
        // Get the current active tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          // Send a message to the content script to scroll to the element
          chrome.tabs.sendMessage(
            tabs[0].id,
            { type: 'scrollToElement', elementId: result.id }
          );
          
          // Close the popup after clicking
          setTimeout(() => window.close(), 300);
        });
      });
      
      resultsGrid.appendChild(matchItem);
    });
  }
  
  // Check if the extension was just installed or updated
  chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
      // Show welcome message on install
      showError('Welcome! Upload an image of a product to find similar items on this page.', true);
    }
  });
  
  // Initial state setup
  if (!currentReferenceImage) {
    // Show initial help message
    resultsContainer.innerHTML = '<p class="help-message">Upload an image to find similar products on this page.</p>';
  }
}); 