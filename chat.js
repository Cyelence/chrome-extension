document.addEventListener('DOMContentLoaded', () => {
    const messagesContainer = document.getElementById('chat-messages');
    const input = document.getElementById('chat-input');
    const sendButton = document.getElementById('chat-send');
    const uploadButton = document.getElementById('chat-upload');

    let isProcessing = false;

    // --- Function to display a message in the chat window ---
    function displayMessage(text, sender, products = []) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`);
        
        // Create message content
        const messageContent = document.createElement('div');
        messageContent.classList.add('message-content');
        messageContent.textContent = text;
        messageDiv.appendChild(messageContent);
        
        // Add product highlights if products are found
        if (products && products.length > 0) {
            const productsDiv = document.createElement('div');
            productsDiv.classList.add('matched-products');
            
            const productsTitle = document.createElement('div');
            productsTitle.classList.add('products-title');
            productsTitle.textContent = 'Found Products:';
            productsDiv.appendChild(productsTitle);
            
            products.forEach(product => {
                const productItem = document.createElement('div');
                productItem.classList.add('product-item');
                productItem.innerHTML = `
                    <div class="product-info">
                        <div class="product-title">${product.title}</div>
                        <div class="product-price">${product.price}</div>
                    </div>
                    <button class="highlight-btn" data-selector="${product.selector}">
                        Show on page
                    </button>
                `;
                productsDiv.appendChild(productItem);
            });
            
            messageDiv.appendChild(productsDiv);
        }
        
        messagesContainer.appendChild(messageDiv);
        
        // Add event listeners to highlight buttons
        messageDiv.querySelectorAll('.highlight-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const selector = e.target.getAttribute('data-selector');
                chrome.runtime.sendMessage({ 
                    type: 'highlightProduct', 
                    productSelector: selector 
                });
            });
        });
        
        // Scroll to the bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // --- Function to send a text message ---
    function sendMessage() {
        if (isProcessing) return;
        
        const text = input.value.trim();
        if (text === '') return;

        displayMessage(text, 'user');
        input.value = '';
        setProcessing(true);

        // Send message to the background script
        chrome.runtime.sendMessage({ type: 'chatMessage', text: text });
    }

    // --- Function to handle image upload ---
    function handleImageUpload() {
        if (isProcessing) return;
        
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        
        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) return;
            
            // Check file size (max 4MB for OpenAI)
            if (file.size > 4 * 1024 * 1024) {
                displayMessage('Image too large. Please select an image smaller than 4MB.', 'bot');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageData = e.target.result;
                
                // Display image in chat
                displayImageMessage(imageData, 'user');
                
                // Ask for optional description
                const query = prompt("Describe what you're looking for (optional):");
                
                setProcessing(true);
                
                // Send to background script
                chrome.runtime.sendMessage({ 
                    type: 'imageUpload', 
                    imageData: imageData,
                    query: query || ''
                });
            };
            
            reader.readAsDataURL(file);
        });
        
        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
    }

    // --- Function to display image message ---
    function displayImageMessage(imageData, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`, 'image-message');
        
        const img = document.createElement('img');
        img.src = imageData;
        img.alt = 'Uploaded image';
        img.style.maxWidth = '200px';
        img.style.maxHeight = '200px';
        img.style.borderRadius = '8px';
        
        messageDiv.appendChild(img);
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // --- Function to set processing state ---
    function setProcessing(processing) {
        isProcessing = processing;
        sendButton.disabled = processing;
        uploadButton.disabled = processing;
        input.disabled = processing;
        
        if (processing) {
            // Show typing indicator
            showTypingIndicator();
        } else {
            // Hide typing indicator
            hideTypingIndicator();
        }
    }

    // --- Typing indicator functions ---
    function showTypingIndicator() {
        const existing = document.getElementById('typing-indicator');
        if (existing) return; // Already showing
        
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typing-indicator';
        typingDiv.classList.add('message', 'bot-message', 'typing');
        typingDiv.innerHTML = `
            <div class="typing-animation">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    // --- Event Listeners ---
    sendButton.addEventListener('click', sendMessage);

    input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });

    uploadButton.addEventListener('click', handleImageUpload);

    // --- Listen for messages from the background script ---
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.type === 'botResponse') {
            hideTypingIndicator();
            displayMessage(request.text, 'bot', request.products);
            setProcessing(false);
        }
    });

    // --- Initial setup ---
    displayMessage("Hi! I'm your AI shopping assistant. I can help you find products on any shopping website.", 'bot');
    displayMessage("Try asking me something like 'help me find a red dress' or upload an image of an item you're looking for!", 'bot');
    
    // Check if free API keys are configured
    chrome.storage.sync.get(['gemini_api_key', 'huggingface_api_key'], (result) => {
        const messages = [];
        
        if (result.gemini_api_key) {
            messages.push("🎉 Gemini API key configured! Best free text and image search available.");
        } else {
            messages.push("💡 For best results: Get a free Gemini API key from Google AI Studio.");
        }
        
        if (result.huggingface_api_key) {
            messages.push("✅ Hugging Face API key configured for additional models.");
        } else {
            messages.push("ℹ️ Hugging Face key is optional - extension works with free tiers.");
        }
        
        messages.push("🖥️ For 100% free local AI, install Ollama with llama2 and llava models.");
        
        displayMessage(messages.join('\n'), 'bot');
    });
});
