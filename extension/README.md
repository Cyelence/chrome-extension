# Smart Shopping Assistant Chrome Extension

A Chrome extension that helps users find visually similar products and get personalized recommendations based on their style preferences.

## Features

- **Image-Based Product Matching**: Uses AI to find visually similar products across multiple retailers
- **Visual Search**: Search for products by image rather than text
- **Cross-Website Compatibility**: Works across major e-commerce sites like Amazon, Etsy, eBay, and more
- **Floating UI**: Non-intrusive UI that appears only when needed

## Implementation Details

### Image-Product-Matcher Module

The core of the extension is the `image-product-matcher.ts` module, which provides:

1. **Image Embedding Generation**: Uses TensorFlow.js with MobileNet to generate vector embeddings from product images
2. **Similarity Calculation**: Computes cosine similarity between image embeddings
3. **Product Matching**: Finds visually similar products across different retailers
4. **Cross-Website Compatibility**: Includes selectors and detection logic for major e-commerce sites
5. **Performance Optimization**: Caches embeddings to avoid redundant calculations

### Technical Stack

- **TypeScript**: For type-safe code and better development experience
- **TensorFlow.js**: For generating image embeddings using pre-trained models
- **Chrome Extension APIs**: For integration with browser functionality
- **Modern ES Modules**: For modular code organization

## Development

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Build the extension:
   ```
   npm run build
   ```

### Loading in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `extension` directory

## Icon Generation

The extension includes a tool to generate icons:

1. Open `extension/save-icons.html` in a browser
2. Icons will be automatically generated and downloaded
3. Move the downloaded icons to the `extension/images` directory

## Future Enhancements

- Server-side API for more powerful image embedding and product matching
- User preference learning for personalized recommendations
- Support for more retailers and product categories
- Enhanced UI with filtering options 