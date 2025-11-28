#!/bin/bash

# Build macOS icons from SVG
# This script converts the SVG icon to all required sizes for macOS

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="$SCRIPT_DIR/../build"
ICONSET_DIR="$BUILD_DIR/icon.iconset"

echo "Building macOS icons..."

# Create iconset directory
mkdir -p "$ICONSET_DIR"

# Check if we have the SVG
if [ ! -f "$BUILD_DIR/icon.svg" ]; then
    echo "Error: icon.svg not found in build directory"
    exit 1
fi

# Try to use rsvg-convert (from librsvg) or convert (from ImageMagick)
# First check what's available
CONVERTER=""
if command -v rsvg-convert &> /dev/null; then
    CONVERTER="rsvg"
elif command -v convert &> /dev/null; then
    CONVERTER="imagemagick"
elif command -v sips &> /dev/null; then
    echo "Note: sips found, but it doesn't support SVG. Please install librsvg or imagemagick"
    echo "  brew install librsvg"
    echo "  # or"
    echo "  brew install imagemagick"
    exit 1
else
    echo "No suitable image converter found. Please install librsvg or imagemagick:"
    echo "  brew install librsvg"
    exit 1
fi

# Function to convert SVG to PNG at specific size
convert_svg() {
    local size=$1
    local output=$2
    
    if [ "$CONVERTER" = "rsvg" ]; then
        rsvg-convert -w "$size" -h "$size" "$BUILD_DIR/icon.svg" -o "$output"
    elif [ "$CONVERTER" = "imagemagick" ]; then
        convert -background none -resize "${size}x${size}" "$BUILD_DIR/icon.svg" "$output"
    fi
}

# Generate all required sizes
echo "Generating icon sizes..."
convert_svg 16 "$ICONSET_DIR/icon_16x16.png"
convert_svg 32 "$ICONSET_DIR/icon_16x16@2x.png"
convert_svg 32 "$ICONSET_DIR/icon_32x32.png"
convert_svg 64 "$ICONSET_DIR/icon_32x32@2x.png"
convert_svg 128 "$ICONSET_DIR/icon_128x128.png"
convert_svg 256 "$ICONSET_DIR/icon_128x128@2x.png"
convert_svg 256 "$ICONSET_DIR/icon_256x256.png"
convert_svg 512 "$ICONSET_DIR/icon_256x256@2x.png"
convert_svg 512 "$ICONSET_DIR/icon_512x512.png"
convert_svg 1024 "$ICONSET_DIR/icon_512x512@2x.png"

# Also create a standard PNG for other uses
convert_svg 1024 "$BUILD_DIR/icon.png"

# Create the icns file
echo "Creating icon.icns..."
iconutil -c icns "$ICONSET_DIR" -o "$BUILD_DIR/icon.icns"

# Clean up iconset directory
rm -rf "$ICONSET_DIR"

echo "Done! Icons created:"
ls -la "$BUILD_DIR/icon."*

