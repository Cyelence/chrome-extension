// settings.js
document.addEventListener('DOMContentLoaded', () => {
    const ollamaToggle = document.getElementById('ollama-toggle');
    const statusDiv = document.getElementById('status');

    // Load current setting
    chrome.storage.sync.get(['useOllama'], (result) => {
        ollamaToggle.checked = !!result.useOllama;
    });

    // Save setting on change
    ollamaToggle.addEventListener('change', () => {
        const useOllama = ollamaToggle.checked;
        chrome.storage.sync.set({ useOllama }, () => {
            statusDiv.textContent = 'Settings saved!';
            setTimeout(() => statusDiv.textContent = '', 2000);
        });
    });
});
