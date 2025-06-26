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

// --- Event Listeners ---

// Show/Hide chat window on button click
chatButton.addEventListener('click', () => {
    const isDisplayed = chatWindow.style.display === 'flex';
    chatWindow.style.display = isDisplayed ? 'none' : 'flex';
});

// Optional: Hide window if user clicks outside of it
document.addEventListener('click', (event) => {
    // If the chat window is open and the click is not on the button or inside the window
    if (chatWindow.style.display === 'flex' && !chatButton.contains(event.target) && !chatWindow.contains(event.target)) {
        chatWindow.style.display = 'none';
    }
});
