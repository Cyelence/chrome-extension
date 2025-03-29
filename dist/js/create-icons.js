// Function to create a canvas with the specified dimensions
function createIconCanvas(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  // Draw background
  ctx.fillStyle = '#4285f4';
  ctx.fillRect(0, 0, size, size);
  
  // Draw shopping bag
  const padding = size * 0.2;
  const bagWidth = size - (padding * 2);
  const bagHeight = size - (padding * 2);
  
  // Bag body
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding + bagWidth, padding);
  ctx.lineTo(padding + bagWidth, padding + bagHeight);
  ctx.lineTo(padding, padding + bagHeight);
  ctx.closePath();
  ctx.fill();
  
  // Bag handles
  ctx.strokeStyle = '#4285f4';
  ctx.lineWidth = size * 0.1;
  ctx.beginPath();
  ctx.moveTo(padding + bagWidth * 0.3, padding);
  ctx.quadraticCurveTo(padding + bagWidth * 0.5, padding - bagHeight * 0.2, padding + bagWidth * 0.7, padding);
  ctx.stroke();
  
  return canvas.toDataURL('image/png');
}

// Create icons of different sizes
const sizes = [16, 48, 128];
sizes.forEach(size => {
  const dataUrl = createIconCanvas(size);
  console.log(`Icon ${size}x${size} created:`, dataUrl);
}); 