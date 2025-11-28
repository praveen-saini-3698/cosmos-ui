#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BUILD_DIR = path.join(__dirname, '..', 'build');
const ICONSET_DIR = path.join(BUILD_DIR, 'icon.iconset');

// Ensure directories exist
if (!fs.existsSync(BUILD_DIR)) {
  fs.mkdirSync(BUILD_DIR, { recursive: true });
}

// Create a simple 1024x1024 PNG using macOS sips and a colored rectangle
// First, we need a base image. We'll create one using Python/Pillow if available,
// or create a simple placeholder using built-in tools.

console.log('Creating app icon...');

// Create iconset directory
if (!fs.existsSync(ICONSET_DIR)) {
  fs.mkdirSync(ICONSET_DIR, { recursive: true });
}

// Try to create icon using Python with Pillow
const pythonScript = `
import os
try:
    from PIL import Image, ImageDraw
    
    # Create a 1024x1024 image with gradient
    size = 1024
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw rounded rectangle background
    padding = 50
    corner_radius = 180
    
    # Create gradient manually
    for y in range(size):
        ratio = y / size
        r = int(6 + (37 - 6) * ratio)
        g = int(182 + (99 - 182) * ratio)
        b = int(212 + (235 - 212) * ratio)
        for x in range(size):
            # Check if inside rounded rectangle
            in_rect = True
            # Top-left corner
            if x < padding + corner_radius and y < padding + corner_radius:
                dx = x - (padding + corner_radius)
                dy = y - (padding + corner_radius)
                if dx*dx + dy*dy > corner_radius*corner_radius:
                    in_rect = False
            # Top-right corner
            elif x > size - padding - corner_radius and y < padding + corner_radius:
                dx = x - (size - padding - corner_radius)
                dy = y - (padding + corner_radius)
                if dx*dx + dy*dy > corner_radius*corner_radius:
                    in_rect = False
            # Bottom-left corner
            elif x < padding + corner_radius and y > size - padding - corner_radius:
                dx = x - (padding + corner_radius)
                dy = y - (size - padding - corner_radius)
                if dx*dx + dy*dy > corner_radius*corner_radius:
                    in_rect = False
            # Bottom-right corner
            elif x > size - padding - corner_radius and y > size - padding - corner_radius:
                dx = x - (size - padding - corner_radius)
                dy = y - (size - padding - corner_radius)
                if dx*dx + dy*dy > corner_radius*corner_radius:
                    in_rect = False
            # Outside rectangle bounds
            elif x < padding or x > size - padding or y < padding or y > size - padding:
                in_rect = False
            
            if in_rect:
                img.putpixel((x, y), (r, g, b, 255))
    
    # Draw database icon (simplified)
    draw = ImageDraw.Draw(img)
    cx, cy = size // 2, size // 2
    
    # Draw ellipses for database
    ellipse_w = 280
    ellipse_h = 80
    
    # Top ellipse
    draw.ellipse([cx - ellipse_w, cy - 150 - ellipse_h, cx + ellipse_w, cy - 150 + ellipse_h], 
                 outline='white', width=35)
    
    # Body lines
    draw.line([(cx - ellipse_w, cy - 150), (cx - ellipse_w, cy + 150)], fill='white', width=35)
    draw.line([(cx + ellipse_w, cy - 150), (cx + ellipse_w, cy + 150)], fill='white', width=35)
    
    # Bottom ellipse
    draw.ellipse([cx - ellipse_w, cy + 150 - ellipse_h, cx + ellipse_w, cy + 150 + ellipse_h], 
                 outline='white', width=35)
    
    # Middle ellipse
    draw.arc([cx - ellipse_w, cy - ellipse_h, cx + ellipse_w, cy + ellipse_h], 
             0, 180, fill='white', width=35)
    
    # Save
    img.save('${BUILD_DIR}/icon.png')
    print('Icon created successfully!')
    
except ImportError:
    print('Pillow not installed')
    exit(1)
`;

try {
  // Try Python with Pillow first
  execSync(`python3 -c "${pythonScript}"`, { stdio: 'inherit' });
  console.log('PNG icon created with Python/Pillow');
} catch (e) {
  console.log('Python/Pillow not available, trying alternative method...');
  
  // Create a minimal valid PNG (cyan colored square) as fallback
  // This is a 64x64 cyan PNG encoded as base64
  const minimalPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAABQklEQVR4nO3asQ3CMBBA0RsFFmAEWICCkgVYgBHoKBmBERiBjpIRWIARGIERLCEh0QUQB+v/J7lK7HPujCAJQgghhJBiGNdrbNt2e/BYDwDP5xPHcUySJHge4HA4sFqtSNOU+Xz+c6y1lnVdU5YlRVGQpik/ARaLxSfAdrvl8XgwnU5/ArTbbRaLBbPZjCzLuF6vdLvdn+8cj0fSNGWz2XwCXC4XNpsNnU7nJ8Dz+eR8PtPr9ei/3gjv95v9fk+/3+c5/HjocrlwuVz+fOdyuWA+n5Nl2SfA4/HgdDoxHo+HgMFgMAQMBgOyLPv6O9/vN3d3d0MA6/X6a/Ln85nT6cRkMvkJkOf5EMBsNvsJcLlcOBwOjEajIaDX630NSJOQ0WhElmXD/7Td3d0wAPA8T1mWsdls/tyIKrpcLhz+3giPEEL+qw/u+Gd5UxbPNwAAAABJRU5ErkJggg==',
    'base64'
  );
  fs.writeFileSync(path.join(BUILD_DIR, 'icon.png'), minimalPng);
  console.log('Created minimal placeholder icon');
}

// Now create iconset for macOS
const sizes = [
  [16, 'icon_16x16.png'],
  [32, 'icon_16x16@2x.png'],
  [32, 'icon_32x32.png'],
  [64, 'icon_32x32@2x.png'],
  [128, 'icon_128x128.png'],
  [256, 'icon_128x128@2x.png'],
  [256, 'icon_256x256.png'],
  [512, 'icon_256x256@2x.png'],
  [512, 'icon_512x512.png'],
  [1024, 'icon_512x512@2x.png']
];

const pngPath = path.join(BUILD_DIR, 'icon.png');

if (fs.existsSync(pngPath)) {
  try {
    // Use sips to resize the PNG
    sizes.forEach(([size, name]) => {
      const outputPath = path.join(ICONSET_DIR, name);
      execSync(`sips -z ${size} ${size} "${pngPath}" --out "${outputPath}"`, { stdio: 'pipe' });
    });
    
    // Create icns
    execSync(`iconutil -c icns "${ICONSET_DIR}" -o "${path.join(BUILD_DIR, 'icon.icns')}"`, { stdio: 'pipe' });
    console.log('Created icon.icns');
    
    // Clean up iconset
    fs.rmSync(ICONSET_DIR, { recursive: true });
    
  } catch (e) {
    console.log('Could not create icns file:', e.message);
    console.log('The app will be built without a custom icon');
  }
}

console.log('Icon generation complete!');
console.log('Files in build directory:');
fs.readdirSync(BUILD_DIR).forEach(f => console.log('  -', f));

