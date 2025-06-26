# 🛍️ Personal Shopping Assistant Chrome Extension

An AI-powered Chrome extension that acts as your personal shopping assistant, similar to Honey but with advanced AI capabilities for intelligent product search and image-based item matching.

## ✨ Features

- **AI-Powered Product Search**: Ask natural language questions like "help me find a red dress for a cocktail party"
- **Image-Based Item Matching**: Upload images to find similar or exact items on the current website
- **Smart Site Recognition**: Optimized selectors for popular shopping sites (Amazon, Nike, Target, Walmart, etc.)
- **Visual Product Highlighting**: Automatically highlights and scrolls to matching products on the page
- **Hover-to-Open Interface**: Honey-style floating button that opens on hover
- **Cross-Site Compatibility**: Works on virtually any shopping website

## 🚀 Installation

### Option 1: Load Unpacked Extension (Development)

1. **Clone or Download** this repository to your local machine
2. **Open Chrome** and navigate to `chrome://extensions/`
3. **Enable Developer Mode** (toggle in the top right)
4. **Click "Load unpacked"** and select the extension directory
5. **Pin the extension** to your toolbar for easy access

### Option 2: Chrome Web Store (Coming Soon)
*Extension will be published to the Chrome Web Store once fully tested*

## ⚙️ Setup

### 1. Configure OpenAI API Key

1. **Get an API Key**:
   - Visit [OpenAI Platform](https://platform.openai.com/api-keys)
   - Create an account and generate an API key
   - Copy your API key (starts with `sk-`)

2. **Set Up the Extension**:
   - Click the extension icon in your browser toolbar
   - Paste your API key in the configuration field
   - Click "Save Key" and then "Test" to verify it works

### 2. Start Shopping!

1. **Visit any shopping website** (Amazon, Nike, Target, etc.)
2. **Hover over the floating blue button** in the bottom-right corner
3. **Ask questions** like:
   - "Find me running shoes under $100"
   - "Show me red dresses for a wedding"
   - "Help me find a laptop for college"
4. **Upload images** to find similar items on the current page

## 🎯 How It Works

### Text-Based Search
- Type your request in natural language
- AI analyzes available products on the current page
- Matching items are highlighted with "Show on page" buttons
- Click to automatically scroll and highlight products

### Image-Based Search
- Click the "Upload Image" button
- Select an image of the item you're looking for
- AI compares the image with products on the current page
- Similar items are identified and can be highlighted

### Supported Websites
- **Amazon** - Full product detection and highlighting
- **Nike** - Optimized for product cards and details
- **Target** - Complete integration with product listings
- **Walmart** - Advanced product recognition
- **Generic Sites** - Fallback selectors for most shopping sites

## 🔧 Technical Details

### Architecture
- **Content Script**: Manages the floating button and chat interface
- **Background Script**: Handles AI API calls and product detection
- **Chat Interface**: Embedded iframe for seamless user interaction
- **Site-Specific Selectors**: Optimized CSS selectors for major shopping sites

### AI Integration
- **OpenAI GPT-4**: For intelligent text-based product recommendations
- **OpenAI Vision**: For image analysis and similarity matching
- **Fallback System**: Basic keyword matching when AI is unavailable

### Privacy & Security
- **Local Processing**: Product data is processed locally, not stored
- **Secure API Calls**: All AI requests are made directly to OpenAI
- **No Tracking**: Extension doesn't collect or store personal data

## 🛠️ Development

### Project Structure
```
chrome-extension/
├── manifest.json          # Extension configuration
├── background.js          # Service worker and AI logic
├── content.js            # Page interaction and UI
├── chat.html/js/css      # Chat interface
├── popup.html/js         # Extension popup
├── styles.css            # Main styling
└── images/               # Extension icons
```

### Key Technologies
- **Chrome Extensions API v3**
- **OpenAI GPT-4 & Vision APIs**
- **Modern JavaScript (ES6+)**
- **CSS3 with animations**
- **Responsive design**

## 🔑 Keyboard Shortcuts
- **Ctrl/Cmd + Shift + S**: Toggle chat window
- **Escape**: Close chat window
- **Enter**: Send message in chat

## 🐛 Troubleshooting

### Extension Not Working
1. Check if API key is properly configured
2. Refresh the webpage after installing
3. Ensure extension has proper permissions

### AI Not Responding
1. Verify API key in extension popup
2. Check internet connection
3. Try the "Test" button in settings

### Products Not Highlighting
1. Make sure you're on a supported shopping site
2. Try refreshing the page
3. Check browser console for errors

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For support or questions, please open an issue on GitHub.

---

**Note**: This extension requires an OpenAI API key to function. API usage costs are minimal for typical personal use (usually under $1/month). 