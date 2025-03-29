#!/bin/bash

# Exit on any error
set -e

echo "🚀 Building Smart Shopping Assistant extension (running from ./extension/)..."

# Create necessary directories relative to the current (extension) directory
echo "🔧 Creating directories..."
mkdir -p dist/js dist/css dist/images

# Install dependencies if node_modules doesn't exist in the current directory
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
else
  echo "✅ Dependencies already installed"
fi

# Compile TypeScript with skipLibCheck to avoid third-party library type errors
echo "🔨 Compiling TypeScript..."
# Run tsc from the current directory (extension)
npx tsc --skipLibCheck || { echo "❌ TypeScript compilation failed"; exit 1; }

# Copy key files from current directory to dist
echo "📋 Copying files to dist..."
cp manifest.json dist/
cp popup.html dist/ 2>/dev/null || :
cp save-icons.html dist/ 2>/dev/null || :

# Copy CSS files
echo "🎨 Copying CSS..."
cp -r css/* dist/css/ 2>/dev/null || :

# Copy images if they exist
if [ -d "images" ]; then
  echo "🖼️ Copying images..."
  cp -r images/* dist/images/ 2>/dev/null || :
fi

# Copy JavaScript files from js/ to dist/js
echo "📜 Copying JavaScript..."
# Ensure the source js directory exists
if [ -d "js" ]; then
  cp -r js/* dist/js/ 2>/dev/null || :
else
  echo "⚠️ Source directory 'js' not found."
fi

# Verify essential files exist in dist
required_files=(
    "dist/js/content.js"
    "dist/js/popup.js"
    "dist/manifest.json"
)

echo "🔍 Verifying essential files..."
for file in "${required_files[@]}"; do
    # Path relative to current directory (extension)
    if [ -f "$file" ]; then
        filesize=$(du -h "$file" | cut -f1)
        echo "✅ Found: $file ($filesize)"
    else
        echo "❌ Missing required file: $file (Working directory: $(pwd))"
        # List contents of dist for debugging
        echo "--- Contents of dist/ ---"
        ls -l dist/
        echo "--- Contents of dist/js/ ---"
        ls -l dist/js/
        exit 1
    fi
done

echo "✨ Build completed successfully!"
echo "📝 Instructions:"
echo "1. Open Chrome and go to chrome://extensions/"
echo "2. Enable 'Developer mode' (toggle in the top right)"
echo "3. Click 'Load unpacked' and select the 'dist' directory (inside the 'extension' folder)"
echo "4. Navigate to a product page and try the extension" 