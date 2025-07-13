# Digital Closet Web App

A modern web application for managing your digital wardrobe, inspired by Locker's clean UI/UX design.

## Features

### 🎯 Core Functionality
- **Digital Wardrobe Management**: Track all your fashion items in one place
- **Smart Categorization**: Organize items by type (tops, bottoms, dresses, etc.)
- **Status Tracking**: Mark items as "Want to Buy", "Just Purchased", or "Own It"
- **Visual Grid Layout**: Beautiful card-based interface for easy browsing

### 📱 Modern UI/UX
- **Locker-Inspired Design**: Clean, modern interface with sidebar navigation
- **Responsive Layout**: Works perfectly on desktop and mobile devices
- **Smooth Animations**: Subtle transitions and hover effects
- **Dark/Light Themes**: Professional color scheme

### 🔍 Advanced Features
- **Smart Search**: Find items by brand, color, notes, or title
- **Advanced Filtering**: Filter by price range, category, and status
- **Multiple Sort Options**: Sort by date, price, or brand
- **Grid/List Views**: Choose your preferred viewing style

### 🔐 Authentication & Accounts
- **User Accounts**: Create an account to sync your data across devices
- **Google Sign-In**: Easy authentication with your Google account
- **Profile Management**: Customize your profile and preferences
- **Secure Data**: Your data is protected and private

### 💾 Data Management
- **Cloud Sync**: Data synced across all your devices when signed in
- **Local Storage**: Works offline with local browser storage
- **Import/Export**: Easy data management and backup
- **Chrome Extension Integration**: Seamlessly add items from any website

## Setup

### Google OAuth Configuration (Optional)

To enable Google Sign-In functionality:

1. Follow the detailed setup guide in [`GOOGLE_OAUTH_SETUP.md`](./GOOGLE_OAUTH_SETUP.md)
2. Create a `.env.local` file in the `webapp` directory
3. Add your Google Client ID:
   ```bash
   REACT_APP_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   ```
4. Restart the development server

The app works without Google OAuth, but users won't be able to create accounts or sync data across devices.

## How to Use

### 1. Launch the App
- Click the Digital Closet extension icon in your browser
- Click "Open Closet" to launch the web app in a new tab

### 2. Navigate Your Closet
- Use the **sidebar** to browse different categories and status types
- **All Items**: View your entire wardrobe
- **Wishlist**: Items you want to buy
- **Recent Purchases**: Items you just bought
- **My Closet**: Items you own

### 3. Add Items
- Click the **"+ Add Item"** button in the sidebar
- Fill in the item details (image, brand, price, etc.)
- Choose the appropriate category and status
- Save to add to your closet

### 4. Manage Items
- **Click any item card** to view/edit details
- Update status as items move from wishlist to purchased to owned
- Add notes, update prices, or modify any details
- Delete items you no longer need

### 5. Search & Filter
- Use the **search bar** to find specific items
- Apply **filters** to narrow down your view
- **Sort** items by newest, price, or brand
- Switch between **grid and list views**

## Extension Integration

The web app works seamlessly with the Chrome extension:

1. **Auto-Add Items**: Browse any shopping website and click the extension
2. **Smart Detection**: The extension automatically detects product information
3. **Quick Save**: Items are instantly added to your digital closet
4. **Centralized Management**: All items appear in the web app for easy organization

## Data Storage

### With User Account (Recommended)
- Data is synced securely to the cloud when signed in
- Access your closet from any device with your account
- Automatic backup and sync across all devices
- Enhanced privacy with user-specific data isolation

### Without Account (Guest Mode)
- All data is stored locally in your browser using localStorage
- Data persists between browser sessions on the same device
- No data sharing across devices
- Data is lost if browser storage is cleared

### Privacy & Security
- Google OAuth is used only for authentication, not data access
- Your closet data remains private and secure
- No personal fashion data is shared with third parties

## Browser Compatibility

- **Chrome**: Full support with extension integration
- **Firefox**: Web app works, extension features may vary
- **Safari**: Web app works, extension features may vary
- **Edge**: Full support with extension integration

## Tips for Best Experience

1. **High-Quality Images**: Use good product images for better visual appeal
2. **Consistent Naming**: Use consistent brand and item names
3. **Regular Updates**: Keep your item statuses up to date
4. **Use Categories**: Properly categorize items for easier browsing
5. **Add Notes**: Include useful notes about fit, quality, or styling

## Privacy & Security

- **No Account Required**: Works completely offline
- **Local Data Only**: All information stays on your device
- **No Tracking**: No analytics or user behavior tracking
- **Open Source**: Code is transparent and auditable

## Troubleshooting

### App Not Loading
1. Check if the extension is properly installed
2. Ensure the webapp files are included in the extension
3. Try refreshing the page or restarting the browser

### Items Not Saving
1. Check if your browser allows localStorage
2. Ensure you have sufficient storage space
3. Try clearing browser cache and restarting

### Extension Not Working
1. Make sure the extension is enabled in Chrome
2. Check that you have the latest version installed
3. Try reloading the extension in Chrome's extension manager

## Support

For issues or questions:
1. Check the browser console for error messages
2. Ensure you're using a supported browser
3. Verify the extension is properly installed and enabled

---

**Digital Closet** - Your Fashion Companion 👗✨ 