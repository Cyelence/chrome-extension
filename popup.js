document.addEventListener('DOMContentLoaded', () => {
    const apiKeyInput = document.getElementById('api-key');
    const saveKeyBtn = document.getElementById('save-key');
    const testKeyBtn = document.getElementById('test-key');
    const keyStatus = document.getElementById('key-status');

    // Load existing API key
    chrome.storage.sync.get(['openai_api_key'], (result) => {
        if (result.openai_api_key) {
            apiKeyInput.value = result.openai_api_key;
            showStatus('API key loaded', 'success');
        }
    });

    // Save API key
    saveKeyBtn.addEventListener('click', () => {
        const apiKey = apiKeyInput.value.trim();
        
        if (!apiKey) {
            showStatus('Please enter an API key', 'error');
            return;
        }

        if (!apiKey.startsWith('sk-') || apiKey.length < 20) {
            showStatus('Invalid API key format', 'error');
            return;
        }

        chrome.storage.sync.set({ openai_api_key: apiKey }, () => {
            showStatus('API key saved successfully!', 'success');
        });
    });

    // Test API key
    testKeyBtn.addEventListener('click', async () => {
        const apiKey = apiKeyInput.value.trim();
        
        if (!apiKey) {
            showStatus('Please enter an API key first', 'error');
            return;
        }

        testKeyBtn.disabled = true;
        testKeyBtn.textContent = 'Testing...';
        
        try {
            const response = await fetch('https://api.openai.com/v1/models', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                showStatus('✅ API key is valid and working!', 'success');
            } else if (response.status === 401) {
                showStatus('❌ Invalid API key', 'error');
            } else if (response.status === 429) {
                showStatus('⚠️ API key valid but rate limited', 'success');
            } else {
                showStatus(`❌ API error: ${response.status}`, 'error');
            }
        } catch (error) {
            showStatus('❌ Network error. Check your connection.', 'error');
        }

        testKeyBtn.disabled = false;
        testKeyBtn.textContent = 'Test';
    });

    // Show status message
    function showStatus(message, type) {
        keyStatus.textContent = message;
        keyStatus.className = `status ${type}`;
        
        // Clear status after 5 seconds for success messages
        if (type === 'success') {
            setTimeout(() => {
                keyStatus.textContent = '';
                keyStatus.className = '';
            }, 5000);
        }
    }

    // Enter key support
    apiKeyInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            saveKeyBtn.click();
        }
    });
}); 