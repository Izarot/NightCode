#!/bin/bash
# Build script for Emoji Dodge game

echo "Building Emoji Dodge game..."

# Check if required files exist
if [ ! -f "index.html" ]; then
    echo "Error: index.html not found"
    exit 1
fi

if [ ! -f "styles.css" ]; then
    echo "Error: styles.css not found"
    exit 1
fi

if [ ! -f "app.js" ]; then
    echo "Error: app.js not found"
    exit 1
fi

echo "All required files present."
echo "Build complete."
