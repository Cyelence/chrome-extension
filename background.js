// background.js
console.log('Background script loaded');

// AI Worker instance for the background script
let aiWorker = null;
let workerReady = false;
let pendingRequests = new Map();
let requestIdCounter = 0;

// Initialize AI Worker when background script starts
initializeAIWorker();

async function initializeAIWorker() {
  console.log('🤖 Initializing AI Worker in background script...');
  
  // Broadcast initialization start
  broadcastToAllTabs({
    type: 'AI_INITIALIZATION_PROGRESS',
    payload: { status: '🚀 Starting lightweight AI initialization...' }
  });
  
  try {
    aiWorker = new Worker(chrome.runtime.getURL('ai-worker-lite.js'), { type: 'module' });
    
    aiWorker.onmessage = (event) => {
      const { type, payload } = event.data;
      console.log('Background received worker message:', type);
      
      if (type === 'WORKER_READY') {
        console.log('🔧 AI Worker script loaded, starting initialization...');
        // Worker script is loaded, now initialize it
        aiWorker.postMessage({ type: 'INITIALIZE' });
        return;
      }
      
      if (type === 'READY') {
        workerReady = true;
        console.log('✅ AI Worker fully initialized and ready');
        
        // Broadcast ready status
        broadcastToAllTabs({
          type: 'AI_INITIALIZATION_PROGRESS',
          payload: { status: '✅ Lightweight AI ready! You can now search for fashion items.' }
        });
        return;
      }
      
      if (type === 'INITIALIZATION_PROGRESS') {
        // Broadcast progress to all tabs
        broadcastToAllTabs({
          type: 'AI_INITIALIZATION_PROGRESS',
          payload: payload
        });
        return;
      }
      
      // Handle responses with request IDs
      if (payload && payload.id && pendingRequests.has(payload.id)) {
        const { sendResponse, tabId } = pendingRequests.get(payload.id);
        pendingRequests.delete(payload.id);
        
        // Send response back to the requesting tab via both methods for reliability
        sendResponse({ 
          success: true, 
          type: type,
          payload: payload 
        });
        
        // Also broadcast to tab for direct handler
        chrome.tabs.sendMessage(tabId, {
          type: 'AI_WORKER_RESPONSE',
          originalType: type,
          payload: payload
        }).catch(() => {
          // Ignore errors if tab doesn't exist
        });
      }
    };
    
    aiWorker.onerror = (error) => {
      console.error('❌ AI Worker error in background:', error);
      workerReady = false;
    };
    
    // Don't initialize immediately - wait for WORKER_READY message
    
  } catch (error) {
    console.error('❌ Failed to initialize AI Worker in background:', error);
  }
}

function broadcastToAllTabs(message) {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, message).catch(() => {
        // Ignore errors for tabs that don't have content script
      });
    });
  });
}

// Listens for the user to click the extension's icon.
chrome.action.onClicked.addListener((tab) => {
  console.log('Extension icon clicked', tab);
  if (tab.id) {
    console.log('Sending TOGGLE_UI message to tab', tab.id);
    // Sends a message to the content script in the active tab.
    chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_UI' });
  } else {
    console.log('No tab.id available');
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);
  
  if (request.type === 'AI_WORKER_REQUEST') {
    handleAIWorkerRequest(request, sender, sendResponse);
    return true; // Keep message channel open for async response
  }
  
  if (request.type === 'INJECT_SCRIPT') {
    handleScriptInjection(request, sender, sendResponse);
    return true; // Keep message channel open for async response
  }
});

async function handleAIWorkerRequest(request, sender, sendResponse) {
  try {
    // Wait for worker to be ready with timeout
    if (!aiWorker || !workerReady) {
      console.log('⏳ AI Worker not ready, waiting...');
      
      // Wait up to 30 seconds for worker to be ready (lightweight mode)
      const waitForWorker = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Lightweight AI Worker initialization timeout (30s)'));
        }, 30000);
        
        const checkReady = setInterval(() => {
          if (aiWorker && workerReady) {
            clearTimeout(timeout);
            clearInterval(checkReady);
            console.log('✅ AI Worker is now ready');
            resolve();
          }
        }, 500); // Check every 500ms
      });
      
      try {
        await waitForWorker;
      } catch (error) {
        console.error('❌ AI Worker failed to become ready:', error);
        sendResponse({ 
          success: false, 
          error: error.message
        });
        return;
      }
    }
    
    // Generate unique request ID
    const requestId = ++requestIdCounter;
    
    // Store request for callback
    pendingRequests.set(requestId, {
      sendResponse: sendResponse,
      tabId: sender.tab.id
    });
    
    // Add request ID to payload
    const workerMessage = {
      ...request.workerMessage,
      payload: {
        ...request.workerMessage.payload,
        id: requestId
      }
    };
    
    console.log(`🔄 Forwarding AI request ${requestId} to worker:`, workerMessage.type);
    aiWorker.postMessage(workerMessage);
    
    // Response will be sent when worker responds
    
  } catch (error) {
    console.error('❌ Failed to handle AI worker request:', error);
    sendResponse({ 
      success: false, 
      error: error.message 
    });
  }
}

async function handleScriptInjection(request, sender, sendResponse) {
  try {
    console.log(`🚀 Injecting ${request.src} into main world for tab ${sender.tab.id}`);
    
    // Use chrome.scripting API to inject into main world
    await chrome.scripting.executeScript({
      target: { tabId: sender.tab.id },
      files: [request.src],
      world: 'MAIN' // This is the key - inject into main world context
    });
    
    console.log(`✅ Successfully injected ${request.src} into main world`);
    sendResponse({ success: true });
    
  } catch (error) {
    console.error(`❌ Failed to inject ${request.src}:`, error);
    sendResponse({ 
      success: false, 
      error: error.message 
    });
  }
}