// Create the chat button
const chatButton = document.createElement('div');
chatButton.id = 'chat-button';
chatButton.innerHTML = `<div id="chat-icon"></div>`;
document.body.appendChild(chatButton);

// Create the chat window
const chatWindow = document.createElement('div');
chatWindow.id = 'chat-window';

const iframe = document.createElement('iframe');
iframe.src = chrome.runtime.getURL('chat.html');
chatWindow.appendChild(iframe);

document.body.appendChild(chatWindow);

// State management
let isWindowOpen = false;
let hoverTimeout = null;
let isHovering = false;

// --- Show/Hide Functions ---
function showChatWindow() {
    if (!isWindowOpen) {
        chatWindow.style.display = 'flex';
        chatWindow.style.opacity = '0';
        chatWindow.style.transform = 'translateY(20px) scale(0.95)';
        
        // Animate in
        requestAnimationFrame(() => {
            chatWindow.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            chatWindow.style.opacity = '1';
            chatWindow.style.transform = 'translateY(0) scale(1)';
        });
        
        isWindowOpen = true;
        chatButton.classList.add('active');
    }
}

function hideChatWindow() {
    if (isWindowOpen) {
        chatWindow.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        chatWindow.style.opacity = '0';
        chatWindow.style.transform = 'translateY(20px) scale(0.95)';
        
        setTimeout(() => {
            chatWindow.style.display = 'none';
            isWindowOpen = false;
            chatButton.classList.remove('active');
        }, 300);
    }
}

// --- Event Listeners ---

// Button hover behavior (like Honey)
chatButton.addEventListener('mouseenter', () => {
    isHovering = true;
    
    // Clear any existing timeout
    if (hoverTimeout) {
        clearTimeout(hoverTimeout);
    }
    
    // Show window after short delay
    hoverTimeout = setTimeout(() => {
        if (isHovering && !isWindowOpen) {
            showChatWindow();
        }
    }, 300);
    
    // Add hover effect to button
    chatButton.style.transform = 'scale(1.1)';
    chatButton.style.boxShadow = '0 4px 20px rgba(0, 123, 255, 0.4)';
});

chatButton.addEventListener('mouseleave', () => {
    isHovering = false;
    
    // Clear timeout
    if (hoverTimeout) {
        clearTimeout(hoverTimeout);
    }
    
    // Remove hover effect
    chatButton.style.transform = 'scale(1)';
    chatButton.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
});

// Chat window hover behavior
chatWindow.addEventListener('mouseenter', () => {
    isHovering = true;
});

chatWindow.addEventListener('mouseleave', () => {
    isHovering = false;
    
    // Hide window after delay when not hovering
    setTimeout(() => {
        if (!isHovering && isWindowOpen) {
            hideChatWindow();
        }
    }, 500);
});

// Click to toggle (alternative to hover)
chatButton.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isWindowOpen) {
        hideChatWindow();
    } else {
        showChatWindow();
    }
});

// Hide window when clicking outside
document.addEventListener('click', (event) => {
    if (isWindowOpen && 
        !chatButton.contains(event.target) && 
        !chatWindow.contains(event.target)) {
        hideChatWindow();
    }
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'botResponse') {
        // Forward to chat iframe
        iframe.contentWindow.postMessage(request, '*');
    }
});

// Listen for messages from chat iframe
window.addEventListener('message', (event) => {
    if (event.source === iframe.contentWindow) {
        // Forward to background script
        chrome.runtime.sendMessage(event.data);
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (event) => {
    // Ctrl/Cmd + Shift + S to toggle chat
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'S') {
        event.preventDefault();
        if (isWindowOpen) {
            hideChatWindow();
        } else {
            showChatWindow();
        }
    }
    
    // Escape to close
    if (event.key === 'Escape' && isWindowOpen) {
        hideChatWindow();
    }
});

// Prevent chat from interfering with page interactions
chatButton.addEventListener('selectstart', (e) => e.preventDefault());
chatWindow.addEventListener('selectstart', (e) => e.stopPropagation());

// Add smooth scrolling and positioning adjustments on scroll
let scrollTimeout;
window.addEventListener('scroll', () => {
    // Hide button temporarily during fast scrolling
    chatButton.style.opacity = '0.7';
    
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        chatButton.style.opacity = '1';
    }, 150);
});

// Responsive positioning for mobile
function adjustForMobile() {
    if (window.innerWidth <= 768) {
        chatWindow.style.width = '90vw';
        chatWindow.style.height = '70vh';
        chatWindow.style.right = '5vw';
        chatWindow.style.bottom = '90px';
    } else {
        chatWindow.style.width = '350px';
        chatWindow.style.height = '500px';
        chatWindow.style.right = '20px';
        chatWindow.style.bottom = '90px';  
    }
}

// Adjust on load and resize
adjustForMobile();
window.addEventListener('resize', adjustForMobile);
