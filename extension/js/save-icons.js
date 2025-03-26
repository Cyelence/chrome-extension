// Function to save base64 data URL to a file
async function saveBase64ToFile(base64Data, filename) {
    // Remove the data URL prefix
    const base64Content = base64Data.split(',')[1];
    
    // Convert base64 to blob
    const byteCharacters = atob(base64Content);
    const byteArrays = [];
    
    for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
        const slice = byteCharacters.slice(offset, offset + 1024);
        const byteNumbers = new Array(slice.length);
        
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }
    
    const blob = new Blob(byteArrays, { type: 'image/png' });
    
    // Create download link with the correct path
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `images/${filename}`; // Save directly to images folder
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Function to create and save icons
async function createAndSaveIcons() {
    const sizes = [16, 48, 128];
    
    for (const size of sizes) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Draw background
        ctx.fillStyle = '#4285f4';
        ctx.fillRect(0, 0, size, size);
        
        // Draw shopping bag
        ctx.fillStyle = 'white';
        const padding = size * 0.2;
        const bagWidth = size - (padding * 2);
        const bagHeight = size - (padding * 2);
        
        // Bag body
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding + bagWidth, padding);
        ctx.lineTo(padding + bagWidth, padding + bagHeight);
        ctx.lineTo(padding, padding + bagHeight);
        ctx.closePath();
        ctx.fill();
        
        // Bag handles
        const handleWidth = bagWidth * 0.4;
        const handleHeight = bagHeight * 0.2;
        ctx.beginPath();
        ctx.moveTo(padding + (bagWidth - handleWidth) / 2, padding);
        ctx.quadraticCurveTo(
            padding + bagWidth / 2,
            padding - handleHeight,
            padding + (bagWidth + handleWidth) / 2,
            padding
        );
        ctx.strokeStyle = 'white';
        ctx.lineWidth = size * 0.1;
        ctx.stroke();
        
        // Save the icon with lowercase name
        const dataUrl = canvas.toDataURL('image/png');
        await saveBase64ToFile(dataUrl, `icon${size}.png`);
    }
}

// Create and save icons when the page loads
window.addEventListener('load', createAndSaveIcons); 