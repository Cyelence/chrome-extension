#!/bin/bash

#===================================
# Smart Shopping Assistant Build Script
#===================================

# Exit on any error
set -e

#===================================
# Configuration
#===================================
DIST_DIR="dist"
JS_LIB_DIR="$DIST_DIR/js/lib"
CSS_DIR="$DIST_DIR/css"
IMAGES_DIR="$DIST_DIR/images"

# Library versions and URLs
TENSORFLOW_VERSION="3.18.0"
MOBILENET_VERSION="2.1.0"
CDN_URLS=(
  "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@$TENSORFLOW_VERSION/dist/tf.min.js"
  "https://unpkg.com/@tensorflow/tfjs@$TENSORFLOW_VERSION/dist/tf.min.js"
  "https://cdnjs.cloudflare.com/ajax/libs/tensorflow/$TENSORFLOW_VERSION/tf.min.js"
)
MOBILENET_URLS=(
  "https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@$MOBILENET_VERSION/dist/mobilenet.min.js"
  "https://unpkg.com/@tensorflow-models/mobilenet@$MOBILENET_VERSION/dist/mobilenet.min.js"
)

#===================================
# Helper Functions
#===================================

# Outputs a message with timestamp
log_message() {
  echo "$(date '+%H:%M:%S') $1"
}

# Outputs a header message
log_header() {
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🔷 $1"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Creates directories if they don't exist
create_directories() {
  log_message "Creating directory structure..."
  mkdir -p "$JS_LIB_DIR" "$CSS_DIR" "$IMAGES_DIR"
  log_message "✅ Directories created"
}

# Downloads a file with retry logic
download_file() {
  local url="$1"
  local output="$2"
  local attempt=1
  local max_attempts=3
  
  log_message "Downloading: $url"
  
  while [ $attempt -le $max_attempts ]; do
    if curl -L --fail -s "$url" -o "$output"; then
      if [ -s "$output" ]; then
        log_message "✅ Successfully downloaded $(du -h "$output" | cut -f1) to $output"
        return 0
      else
        log_message "⚠️ Warning: Downloaded file is empty: $output (attempt $attempt/$max_attempts)"
        rm -f "$output"
      fi
    else
      log_message "⚠️ Warning: Failed to download $url (attempt $attempt/$max_attempts)"
    fi
    
    attempt=$((attempt + 1))
    [ $attempt -le $max_attempts ] && log_message "Retrying in 2 seconds..." && sleep 2
  done
  
  return 1
}

# Try multiple URLs to download a file
try_multiple_urls() {
  if [ $# -lt 2 ]; then
    log_message "❌ Error: try_multiple_urls requires at least 2 arguments (URLs and output path)"
    return 1
  fi
  
  # The last argument is the output path
  local output="${@: -1}"
  local url_count=$(($# - 1))
  
  # Try each URL until one succeeds
  for i in $(seq 1 $url_count); do
    local url="${!i}"
    log_message "Trying URL $i/$url_count: $url"
    
    if download_file "$url" "$output"; then
      return 0
    fi
  done
  
  log_message "❌ Failed to download from any source to $output"
  return 1
}

# Install dependencies if needed
install_dependencies() {
  if [ ! -d "node_modules" ]; then
    log_header "Installing dependencies"
    npm install
  else
    log_message "✅ Dependencies already installed"
  fi
}

# Compile TypeScript files
compile_typescript() {
  log_header "Compiling TypeScript"
  npx tsc --project tsconfig.json || { log_message "❌ TypeScript compilation failed"; exit 1; }
  log_message "✅ TypeScript compilation successful"
}

# Copy files to dist directory
copy_files() {
  log_header "Copying files to dist"
  
  # Copy manifest and HTML files
  log_message "Copying manifest and HTML files..."
  cp manifest.json "$DIST_DIR/"
  cp popup.html "$DIST_DIR/" 2>/dev/null || :
  cp save-icons.html "$DIST_DIR/" 2>/dev/null || :
  
  # Copy CSS files
  log_message "Copying CSS files..."
  if [ -d "css" ]; then
    cp -r css/* "$CSS_DIR/" 2>/dev/null || :
  fi
  
  # Copy image files
  log_message "Copying image files..."
  if [ -d "images" ]; then
    cp -r images/* "$IMAGES_DIR/" 2>/dev/null || :
  fi
  
  # Copy JavaScript files
  log_message "Copying JavaScript files..."
  if [ -d "js" ]; then
    cp -r js/* "$DIST_DIR/js/" 2>/dev/null || :
  else
    log_message "⚠️ Source directory 'js' not found"
  fi
  
  # Copy module files
  log_message "Copying module files..."
  if [ -d "js/modules" ]; then
    cp -r js/modules/* "$DIST_DIR/js/modules/" 2>/dev/null || :
  fi
  
  log_message "✅ Files copied to dist directory"
}

# Download required library files
download_libraries() {
  log_header "Downloading required libraries"
  
  # Ensure the lib directory exists
  mkdir -p "$JS_LIB_DIR"
  
  # Check write permissions
  if [ ! -w "$JS_LIB_DIR" ]; then
    log_message "❌ Error: Cannot write to $JS_LIB_DIR directory. Check permissions."
    exit 1
  fi
  
  # Download TensorFlow.js
  log_message "Downloading TensorFlow.js..."
  try_multiple_urls \
    "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@$TENSORFLOW_VERSION/dist/tf.min.js" \
    "https://unpkg.com/@tensorflow/tfjs@$TENSORFLOW_VERSION/dist/tf.min.js" \
    "https://cdnjs.cloudflare.com/ajax/libs/tensorflow/$TENSORFLOW_VERSION/tf.min.js" \
    "$JS_LIB_DIR/tf.min.js" || exit 1
  
  # Double-check file was downloaded correctly
  if [ ! -s "$JS_LIB_DIR/tf.min.js" ]; then
    log_message "❌ Error: TensorFlow.js file is empty or missing after download"
    exit 1
  else
    log_message "✅ TensorFlow.js verified ($(du -h "$JS_LIB_DIR/tf.min.js" | cut -f1))"
  fi
  
  # Download MobileNet
  log_message "Downloading MobileNet..."
  try_multiple_urls \
    "https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@$MOBILENET_VERSION/dist/mobilenet.min.js" \
    "https://unpkg.com/@tensorflow-models/mobilenet@$MOBILENET_VERSION/dist/mobilenet.min.js" \
    "$JS_LIB_DIR/mobilenet.min.js" || exit 1
  
  # Double-check file was downloaded correctly
  if [ ! -s "$JS_LIB_DIR/mobilenet.min.js" ]; then
    log_message "❌ Error: MobileNet file is empty or missing after download"
    exit 1
  else
    log_message "✅ MobileNet verified ($(du -h "$JS_LIB_DIR/mobilenet.min.js" | cut -f1))"
  fi
  
  # List directory contents for verification
  log_message "Contents of $JS_LIB_DIR:"
  ls -la "$JS_LIB_DIR/"
}

# Verify all required files exist
verify_files() {
  log_header "Verifying required files"
  
  local required_files=(
    "$JS_LIB_DIR/tf.min.js"
    "$JS_LIB_DIR/mobilenet.min.js"
    "$DIST_DIR/js/content.js"
    "$DIST_DIR/js/popup.js"
    "$DIST_DIR/manifest.json"
  )
  
  local all_files_exist=true
  
  for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
      local filesize=$(du -h "$file" | cut -f1)
      log_message "✅ Found: $file ($filesize)"
      
      # For JS files, check if they're not empty
      if [[ "$file" == *.js ]] && [ ! -s "$file" ]; then
        log_message "⚠️ Warning: $file exists but is empty!"
      fi
    else
      log_message "❌ Missing required file: $file"
      all_files_exist=false
    fi
  done
  
  if [ "$all_files_exist" = false ]; then
    log_message "Some required files are missing. Listing directory contents for debugging:"
    
    log_message "Contents of $DIST_DIR/:"
    ls -la "$DIST_DIR/"
    
    log_message "Contents of $DIST_DIR/js/:"
    ls -la "$DIST_DIR/js/"
    
    log_message "Contents of $JS_LIB_DIR/:"
    ls -la "$JS_LIB_DIR/" 2>/dev/null || log_message "Library directory does not exist"
    
    exit 1
  fi
  
  # Check if manifest.json has web_accessible_resources properly configured
  log_message "Verifying manifest.json configuration..."
  if [ -f "$DIST_DIR/manifest.json" ]; then
    if grep -q "web_accessible_resources" "$DIST_DIR/manifest.json" && grep -q "js/lib" "$DIST_DIR/manifest.json"; then
      log_message "✅ manifest.json appears to have web_accessible_resources configured"
    else
      log_message "⚠️ Warning: manifest.json might not have web_accessible_resources properly configured"
      log_message "Here's the current manifest content:"
      cat "$DIST_DIR/manifest.json"
    fi
  fi
  
  # Print the full extension directory structure for verification
  log_message "Complete extension directory structure:"
  find "$DIST_DIR" -type f | sort | while read -r file; do
    filesize=$(du -h "$file" | cut -f1)
    log_message "  - $file ($filesize)"
  done
}

# Display completion message and instructions
show_completion_message() {
  log_header "Build completed successfully!"
  echo ""
  echo "📝 Installation Instructions:"
  echo "1. Open Chrome and go to chrome://extensions/"
  echo "2. Enable 'Developer mode' (toggle in the top right)"
  echo "3. Click 'Load unpacked' and select the '$DIST_DIR' directory"
  echo "4. ⚠️  IMPORTANT: Make sure you select the '$DIST_DIR' directory, not the 'extension' directory"
  echo "5. Navigate to a product page and try the extension"
  echo ""
  
  # Add a test command to verify the extension
  echo "To verify your extension installation, go to any product page (like Amazon/eBay),"
  echo "click the extension icon, and upload an image to scan for similar products."
  echo "If you encounter errors, check the console (F12 > Console) for detailed logs."
  echo ""
}

#===================================
# Main Build Process
#===================================
log_header "Building Smart Shopping Assistant extension"

# Step 1: Create directory structure
create_directories

# Step 2: Install dependencies if needed
install_dependencies

# Step 3: Compile TypeScript
compile_typescript

# Step 4: Copy files to dist directory
copy_files

# Step 5: Download required libraries
download_libraries

# Step 6: Verify all required files exist
verify_files

# Step 7: Show completion message and instructions
show_completion_message 