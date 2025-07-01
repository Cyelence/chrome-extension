# 👗 Digital Closet - Wardrobe Tracker Extension

A Chrome extension that helps you build and manage your digital wardrobe by saving fashion items from any website and tracking your purchases.

## ✨ Features

### 🛍️ **Smart Item Detection**
- Automatically detects product information from any e-commerce website
- Extracts title, price, brand, color, size, and images
- Works on major retailers like Amazon, Zara, H&M, Nordstrom, and more

### 📊 **Status Tracking**
- **❤️ Want**: Items you're interested in purchasing
- **🛒 Purchased**: Recently bought items
- **✅ Owned**: Items in your current wardrobe

### 🗂️ **Smart Organization**
- **Categories**: Tops, Bottoms, Outerwear, Dresses, Shoes, Accessories
- **Search**: Find items by name, brand, color, or notes
- **Filters**: Filter by category, status, or sort by date/price
- **Timeline**: Track how long you've owned items

### 📈 **Wardrobe Analytics**
- Total item count and wardrobe value
- Purchase history and ownership duration
- Visual statistics and insights

## 🚀 Getting Started

### Installation
1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The Digital Closet icon will appear in your toolbar

### First Use
1. Click the Digital Closet icon to open your wardrobe
2. Browse to any product page (clothing, shoes, accessories)
3. Click "Add Item" to save it to your closet
4. Set the status (Want/Purchased/Owned) and category
5. The item will appear in your digital closet!

## 🖥️ How to Use

### Adding Items
1. **From Any Website**: Navigate to a product page and click the extension icon
2. **Quick Add**: Click the "+" button to add the current page
3. **Manual Entry**: Add items manually with custom details

### Managing Your Closet
- **View Items**: Browse your wardrobe in a beautiful card layout
- **Edit Details**: Click any item to edit price, brand, size, color, and notes
- **Update Status**: Move items from "Want" to "Purchased" to "Owned"
- **Delete Items**: Remove items you no longer want to track

### Organization Features
- **Search**: Type to find specific items
- **Filter by Category**: View only shirts, pants, shoes, etc.
- **Filter by Status**: See only items you want, own, or recently purchased
- **Sort Options**: Organize by date, price, or brand

## 🎯 Use Cases

### 👥 **Fashion Enthusiasts**
- Track your style evolution over time
- Avoid buying duplicate items
- Plan future purchases with a wishlist

### 💰 **Budget Conscious Shoppers**
- Monitor your spending on clothing
- Track the cost-per-wear of expensive items
- Make informed purchasing decisions

### 🧹 **Minimalists**
- Maintain awareness of what you own
- Identify items you never wear
- Build a capsule wardrobe intentionally

### 🛒 **Online Shoppers**
- Save items from multiple websites in one place
- Compare prices across retailers
- Track items through sales and restocks

## 🔧 Technical Features

### 🤖 **Intelligent Detection**
- Uses multiple strategies to detect product information
- Supports Schema.org structured data
- Falls back to heuristic analysis for any website

### 💾 **Local Storage**
- All data stored locally in your browser
- No external servers or accounts required
- Complete privacy and control over your data

### 🎨 **Modern UI**
- Beautiful card-based layout
- Responsive design works on any screen size
- Smooth animations and professional styling

### ⚡ **Performance**
- Lightweight and fast
- Minimal memory usage
- Works on thousands of items

## 📂 File Structure

```
├── closet-popup.html          # Main closet interface
├── closet-popup.js            # Closet logic and UI management
├── closet-styles.css          # Beautiful closet styling
├── closet-content.js          # Item detection on websites
├── closet-background.js       # Extension background script
├── manifest.json              # Chrome extension configuration
└── images/                    # Extension icons
```

## 🛠️ Development

### Architecture
- **Popup Interface**: Main wardrobe management UI
- **Content Script**: Detects items on product pages
- **Background Script**: Handles extension lifecycle and storage
- **Chrome Storage API**: Persistent local data storage

### Adding New Features
1. **New Detection Rules**: Edit `closet-content.js` to support more websites
2. **UI Enhancements**: Modify `closet-popup.html` and `closet-styles.css`
3. **Data Fields**: Extend the item schema in `closet-popup.js`

## 🎨 Screenshots

### Main Closet Interface
Beautiful card layout showing your wardrobe with status indicators, categories, and purchase dates.

### Item Details Modal
Comprehensive item editing with all metadata, purchase tracking, and original links.

### Quick Add Dialog
Smart detection of product information with one-click adding to your closet.

## 🆚 Comparison with Similar Tools

| Feature | Digital Closet | Other Apps |
|---------|---------------|------------|
| **Browser Extension** | ✅ | ❌ |
| **Any Website** | ✅ | Limited |
| **Offline/Local** | ✅ | ❌ |
| **Free** | ✅ | Freemium |
| **No Account Required** | ✅ | ❌ |
| **Auto-Detection** | ✅ | Manual |

## 🔮 Future Enhancements

- **Export/Import**: Backup and sync your closet data
- **Style Analytics**: AI-powered outfit recommendations
- **Price Tracking**: Monitor price drops on wanted items
- **Social Features**: Share favorite items or outfits
- **Mobile App**: Companion mobile app for on-the-go access

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

## 📄 License

This project is open source and available under the MIT License.

---

**Built with ❤️ for fashion lovers and organized shoppers everywhere!** 