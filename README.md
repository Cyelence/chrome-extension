# Smart Shopping Assistant Chrome Extension

A Chrome extension that helps you shop online by finding visually similar items to an uploaded image and providing personalized style recommendations.

## Features

### MVP (Current Version)
- **Image Matching**: Upload an image and find similar items on the current shopping page
- Simple UI with tab navigation
- Real-time scanning of product listings

### Planned Features
- **Style Assistant**: AI-powered recommendations based on your style preferences
- User "wardrobe" to store favorite items and styles
- More accurate image matching with advanced machine learning models
- Support for more e-commerce websites

## Installation (Development Mode)

1. Clone this repository or download the ZIP file and extract it
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" by toggling the switch in the top right corner
4. Click "Load unpacked" and select the `extension` folder from this project
5. The Smart Shopping Assistant extension should now appear in your extensions list

## Usage

1. Navigate to any shopping website
2. Click the Smart Shopping Assistant icon in your browser toolbar
3. In the popup, click the "Upload Image" button
4. Select an image of a product you're interested in
5. Click "Scan Page for Matches"
6. The extension will analyze the product listings on the page and show items that visually match your uploaded image
7. Click on any result to be taken directly to that item on the page

## Technical Implementation

The extension uses TensorFlow.js and MobileNet for image feature extraction and comparison. It works by:

1. Extracting feature vectors from the reference image (your uploaded image)
2. Finding product listings on the current page
3. Extracting feature vectors from each product image
4. Calculating similarity scores using cosine similarity
5. Ranking and displaying the most similar items

## Development

This is an MVP (Minimum Viable Product) with basic functionality. Contributions are welcome!

### Project Structure
```
extension/
├── css/
│   └── popup.css
├── images/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── js/
│   ├── content.js
│   └── popup.js
├── manifest.json
└── popup.html
```

## License

MIT 