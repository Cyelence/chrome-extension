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
  
  uploadBtn.addEventListener('click', () => {
    imageUpload.click();
  });
  
  imageUpload.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        imagePreview.src = e.target.result;
        previewContainer.hidden = false;
        // Store the image data in local storage for the content script to access
        chrome.storage.local.set({
          'referenceImage': e.target.result
        });
      };
      reader.readAsDataURL(file);
    }
  });
  
  scanBtn.addEventListener('click', () => {
    // Set scanning flag in storage
    chrome.storage.local.set({ 'isScanning': true }, () => {
      // Execute content script to scan the page
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          files: ['js/content.js']
        });
      });
    });
    
    // Show loading state
    resultsContainer.innerHTML = '<p>Scanning page for similar items...</p>';
    
    // Listen for results from content script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'scanResults') {
        displayResults(message.results);
      }
    });
  });
  
  function displayResults(results) {
    if (results.length === 0) {
      resultsContainer.innerHTML = '<p>No similar items found on this page.</p>';
      return;
    }
    
    resultsContainer.innerHTML = '';
    results.forEach(result => {
      const matchItem = document.createElement('div');
      matchItem.className = 'match-item';
      
      matchItem.innerHTML = `
        <img src="${result.image}" alt="Product image">
        <div class="match-details">
          <div class="match-score">${Math.round(result.score * 100)}% match</div>
          <p>${result.title || 'Unknown product'}</p>
          <p>${result.price || ''}</p>
        </div>
      `;
      
      matchItem.addEventListener('click', () => {
        // Get the current active tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          // Send a message to the content script to scroll to the element
          chrome.tabs.sendMessage(
            tabs[0].id,
            { type: 'scrollToElement', elementId: result.id }
          );
        });
      });
      
      resultsContainer.appendChild(matchItem);
    });
  }
}); 