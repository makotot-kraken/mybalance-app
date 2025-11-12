#!/bin/bash
# Post-build script to fix paths for GitHub Pages

echo "Fixing paths for GitHub Pages deployment..."

# Fix index.html paths
sed -i.bak 's|href="/favicon.ico"|href="./favicon.ico"|g' docs/index.html
sed -i.bak 's|src="/_expo/|src="./_expo/|g' docs/index.html

# Remove backup file
rm -f docs/index.html.bak

echo "✅ Paths fixed successfully!"
