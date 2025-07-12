// Digital Closet Floating Icon (Like Locker)
class ClosetFloatingIcon {
    constructor() {
        this.floatingIcon = null;
        this.closetPopup = null;
        this.isPopupOpen = false;
        this.isInitialized = false;
        
        this.init();
    }
    
    init() {
        // Only initialize on certain domains (not chrome extension pages)
        if (window.location.hostname === 'chrome-extension') {
            return;
        }
        
        // Wait for page to load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.createFloatingIcon());
        } else {
            this.createFloatingIcon();
        }
        
        // Handle page navigation
        this.watchForUrlChanges();
    }
    
    createFloatingIcon() {
        if (this.isInitialized) return;
        
        // Create floating icon
        this.floatingIcon = document.createElement('div');
        this.floatingIcon.className = 'closet-floating-icon';
        this.floatingIcon.innerHTML = `
            <div class="closet-icon-button">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 2C4.89 2 4 2.9 4 4V20C4 21.11 4.89 22 6 22H18C19.11 22 20 21.11 20 20V8L14 2H6Z" fill="currentColor"/>
                    <path d="M14 2V8H20" fill="none" stroke="white" stroke-width="2"/>
                    <path d="M8 12H16M8 16H16" stroke="white" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <span class="closet-icon-tooltip">My Closet</span>
            </div>
        `;
        
        // Add styles
        this.addFloatingIconStyles();
        
        // Add event listeners
        this.floatingIcon.addEventListener('click', () => this.toggleClosetPopup());
        
        // Add to page
        document.body.appendChild(this.floatingIcon);
        
        // Animate in
        setTimeout(() => {
            this.floatingIcon.classList.add('closet-floating-icon-show');
        }, 500);
        
        this.isInitialized = true;
        console.log('🎯 Digital Closet floating icon initialized');
    }
    
    addFloatingIconStyles() {
        if (document.getElementById('closet-floating-icon-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'closet-floating-icon-styles';
        styles.textContent = `
            .closet-floating-icon {
                position: fixed;
                right: 20px;
                top: 50%;
                transform: translateY(-50%) translateX(100px);
                z-index: 2147483646;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                opacity: 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            }
            
            .closet-floating-icon-show {
                transform: translateY(-50%) translateX(0);
                opacity: 1;
            }
            
            .closet-icon-button {
                position: relative;
                width: 50px;
                height: 50px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
                transition: all 0.2s ease;
                border: 2px solid rgba(255, 255, 255, 0.2);
            }
            
            .closet-icon-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 25px rgba(102, 126, 234, 0.4);
                border-color: rgba(255, 255, 255, 0.3);
            }
            
            .closet-icon-button:active {
                transform: translateY(0);
            }
            
            .closet-icon-button svg {
                color: white;
                transition: all 0.2s ease;
            }
            
            .closet-icon-button:hover svg {
                transform: scale(1.1);
            }
            
            .closet-icon-tooltip {
                position: absolute;
                right: 60px;
                top: 50%;
                transform: translateY(-50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                white-space: nowrap;
                opacity: 0;
                visibility: hidden;
                transition: all 0.2s ease;
                pointer-events: none;
            }
            
            .closet-icon-tooltip::after {
                content: '';
                position: absolute;
                left: 100%;
                top: 50%;
                transform: translateY(-50%);
                border: 6px solid transparent;
                border-left-color: rgba(0, 0, 0, 0.8);
            }
            
            .closet-icon-button:hover .closet-icon-tooltip {
                opacity: 1;
                visibility: visible;
                right: 55px;
            }
            
            .closet-popup-container {
                position: fixed;
                right: 80px;
                top: 50%;
                transform: translateY(-50%) translateX(100px);
                width: 420px;
                height: 600px;
                background: white;
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
                z-index: 2147483645;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                border: 1px solid rgba(102, 126, 234, 0.1);
                overflow: hidden;
            }
            
            .closet-popup-container.open {
                transform: translateY(-50%) translateX(0);
                opacity: 1;
                visibility: visible;
            }
            
            .closet-popup-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 16px 20px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .closet-popup-header h3 {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
            }
            
            .closet-popup-close {
                background: none;
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
                padding: 4px;
                line-height: 1;
                border-radius: 4px;
                transition: all 0.2s ease;
            }
            
            .closet-popup-close:hover {
                background: rgba(255, 255, 255, 0.1);
            }
            
            .closet-popup-content {
                height: calc(100% - 70px);
                overflow: hidden;
            }
            
            .closet-popup-iframe {
                width: 100%;
                height: 100%;
                border: none;
                background: white;
            }
            
            @media (max-width: 768px) {
                .closet-floating-icon {
                    right: 15px;
                }
                
                .closet-popup-container {
                    right: 15px;
                    left: 15px;
                    width: auto;
                    height: 80vh;
                    top: 10vh;
                    transform: translateY(100vh);
                }
                
                .closet-popup-container.open {
                    transform: translateY(0);
                }
            }
        `;
        
        document.head.appendChild(styles);
    }
    
    toggleClosetPopup() {
        if (this.isPopupOpen) {
            this.closeClosetPopup();
        } else {
            this.openClosetPopup();
        }
    }
    
    openClosetPopup() {
        if (!this.closetPopup) {
            this.createClosetPopup();
        }
        
        this.closetPopup.classList.add('open');
        this.isPopupOpen = true;
        
        // Update icon state
        this.floatingIcon.classList.add('active');
        
        console.log('📱 Closet popup opened');
    }
    
    closeClosetPopup() {
        if (this.closetPopup) {
            this.closetPopup.classList.remove('open');
        }
        
        this.isPopupOpen = false;
        
        // Update icon state
        this.floatingIcon.classList.remove('active');
        
        console.log('📱 Closet popup closed');
    }
    
    createClosetPopup() {
        this.closetPopup = document.createElement('div');
        this.closetPopup.className = 'closet-popup-container';
        this.closetPopup.innerHTML = `
            <div class="closet-popup-header">
                <h3>Digital Closet - Open Web App</h3>
                <button class="closet-popup-close">&times;</button>
            </div>
            <div class="closet-popup-content">
                <div style="padding: 20px; text-align: center;">
                    <h2>🎉 Your Digital Closet Web App</h2>
                    <p>Experience your closet in a modern React app with advanced features!</p>
                    <button id="openWebApp" style="
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                        font-size: 16px;
                        margin: 10px;
                        transition: transform 0.2s;
                    ">Open Web App</button>
                    <br>
                    <button id="useExtension" style="
                        background: #6c757d;
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 6px;
                        font-size: 14px;
                        cursor: pointer;
                        margin: 5px;
                    ">Use Extension Popup</button>
                </div>
            </div>
        `;
        
        // Add event listeners
        this.closetPopup.querySelector('.closet-popup-close').addEventListener('click', () => this.closeClosetPopup());
        this.closetPopup.querySelector('#openWebApp').addEventListener('click', () => {
            window.open('http://localhost:3000', '_blank');
            this.closeClosetPopup();
        });
        this.closetPopup.querySelector('#useExtension').addEventListener('click', () => {
            this.closetPopup.innerHTML = `
                <div class="closet-popup-header">
                    <h3>Digital Closet Extension</h3>
                    <button class="closet-popup-close">&times;</button>
                </div>
                <div class="closet-popup-content">
                    <iframe class="closet-popup-iframe" src="${chrome.runtime.getURL('closet/closet-popup.html')}"></iframe>
                </div>
            `;
            this.closetPopup.querySelector('.closet-popup-close').addEventListener('click', () => this.closeClosetPopup());
        });
        
        // Close on outside click
        document.addEventListener('click', (e) => {
            if (this.isPopupOpen && 
                !this.closetPopup.contains(e.target) && 
                !this.floatingIcon.contains(e.target)) {
                this.closeClosetPopup();
            }
        });
        
        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isPopupOpen) {
                this.closeClosetPopup();
            }
        });
        
        document.body.appendChild(this.closetPopup);
    }
    
    watchForUrlChanges() {
        let currentUrl = window.location.href;
        
        const checkForUrlChange = () => {
            if (window.location.href !== currentUrl) {
                currentUrl = window.location.href;
                // Close popup on navigation
                this.closeClosetPopup();
            }
        };
        
        // Check for URL changes
        setInterval(checkForUrlChange, 1000);
        
        // Listen for popstate events
        window.addEventListener('popstate', checkForUrlChange);
    }
    
    destroy() {
        if (this.floatingIcon && this.floatingIcon.parentNode) {
            this.floatingIcon.parentNode.removeChild(this.floatingIcon);
        }
        
        if (this.closetPopup && this.closetPopup.parentNode) {
            this.closetPopup.parentNode.removeChild(this.closetPopup);
        }
        
        const styles = document.getElementById('closet-floating-icon-styles');
        if (styles) {
            styles.remove();
        }
        
        this.isInitialized = false;
    }
}

// Initialize the floating icon
let closetFloatingIcon = null;

// Only initialize on regular web pages (not chrome extension pages)
if (window.location.hostname !== 'chrome-extension') {
    closetFloatingIcon = new ClosetFloatingIcon();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (closetFloatingIcon) {
        closetFloatingIcon.destroy();
    }
}); 