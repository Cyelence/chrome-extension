document.addEventListener('DOMContentLoaded', () => {
    const geminiKeyInput = document.getElementById('gemini-key');
    const huggingfaceKeyInput = document.getElementById('huggingface-key');
    const saveKeysBtn = document.getElementById('save-keys');
    const testKeysBtn = document.getElementById('test-keys');
    const keyStatus = document.getElementById('key-status');

    // Load existing API keys
    chrome.storage.sync.get(['gemini_api_key', 'huggingface_api_key'], (result) => {
        if (result.gemini_api_key) {
            geminiKeyInput.value = result.gemini_api_key;
        }
        if (result.huggingface_api_key) {
            huggingfaceKeyInput.value = result.huggingface_api_key;
        }
        if (result.gemini_api_key || result.huggingface_api_key) {
            showStatus('Free API keys loaded', 'success');
        } else {
            showStatus('💡 Extension works with free tiers! Hugging Face key is optional.', 'success');
        }
    });

    // Save API keys
    saveKeysBtn.addEventListener('click', () => {
        const geminiKey = geminiKeyInput.value.trim();
        const huggingfaceKey = huggingfaceKeyInput.value.trim();
        
        const keysToSave = {};
        let hasValidKey = false;

        if (geminiKey) {
            if (geminiKey.length < 10) {
                showStatus('Invalid Gemini API key format', 'error');
                return;
            }
            keysToSave.gemini_api_key = geminiKey;
            hasValidKey = true;
        }

        if (huggingfaceKey) {
            if (!huggingfaceKey.startsWith('hf_') || huggingfaceKey.length < 20) {
                showStatus('Invalid Hugging Face API key format', 'error');
                return;
            }
            keysToSave.huggingface_api_key = huggingfaceKey;
            hasValidKey = true;
        }

        // Save keys (even if empty - user can try without keys)
        chrome.storage.sync.set(keysToSave, () => {
            if (hasValidKey) {
                showStatus('Free API keys saved successfully!', 'success');
            } else {
                showStatus('Settings saved! Extension will try free tiers without keys.', 'success');
            }
        });
    });

    // Test API keys
    testKeysBtn.addEventListener('click', async () => {
        const geminiKey = geminiKeyInput.value.trim();
        const huggingfaceKey = huggingfaceKeyInput.value.trim();

        testKeysBtn.disabled = true;
        testKeysBtn.textContent = 'Testing...';
        
        let results = [];

        // Test Gemini key
        if (geminiKey) {
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: 'Hello' }]
                        }],
                        generationConfig: {
                            maxOutputTokens: 10
                        }
                    })
                });

                if (response.ok) {
                    results.push('✅ Gemini key working');
                } else if (response.status === 401 || response.status === 403) {
                    results.push('❌ Invalid Gemini key');
                } else if (response.status === 429) {
                    results.push('⚠️ Gemini key valid but rate limited');
                } else {
                    results.push(`❌ Gemini error: ${response.status}`);
                }
            } catch (error) {
                results.push('❌ Gemini network error');
            }
        } else {
            results.push('⚠️ No Gemini key (recommended)');
        }

        // Test Hugging Face key (optional)
        if (huggingfaceKey) {
            try {
                const response = await fetch('https://api-inference.huggingface.co/models/gpt2', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${huggingfaceKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        inputs: 'Hello',
                        parameters: { max_length: 10 }
                    })
                });

                if (response.ok) {
                    results.push('✅ Hugging Face key working');
                } else if (response.status === 401) {
                    results.push('❌ Invalid Hugging Face key');
                } else if (response.status === 429) {
                    results.push('⚠️ HF key valid but rate limited');
                } else {
                    results.push(`❌ HF error: ${response.status}`);
                }
            } catch (error) {
                results.push('❌ HF network error');
            }
        } else {
            results.push('ℹ️ No HF key (will use free tier)');
        }

        // Test Ollama (local)
        try {
            const response = await fetch('http://localhost:11434/api/tags', {
                method: 'GET'
            });

            if (response.ok) {
                const data = await response.json();
                const hasLlama = data.models?.some(m => m.name.includes('llama'));
                if (hasLlama) {
                    results.push('✅ Ollama running with models');
                } else {
                    results.push('⚠️ Ollama running but no models');
                }
            } else {
                results.push('❌ Ollama not responding');
            }
        } catch (error) {
            results.push('ℹ️ Ollama not installed (optional)');
        }

        showStatus(results.join(' | '), results.some(r => r.includes('❌')) ? 'error' : 'success');

        testKeysBtn.disabled = false;
        testKeysBtn.textContent = 'Test';
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
    geminiKeyInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            saveKeysBtn.click();
        }
    });
    
    huggingfaceKeyInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            saveKeysBtn.click();
        }
    });
}); 