#!/bin/bash
# Helper script to update portfolio after trades

echo "🔄 Portfolio Update Helper"
echo "=========================="
echo ""
echo "After updating your portfolio in data/assets.js:"
echo "1. Updated holdings in portfolio.stocks array"
echo "2. Updated cost basis in actualAvgCostsOriginal (2 places)"
echo "3. Updated stock symbols in scripts/create-snapshot.js"
echo ""
read -p "Have you completed all updates? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ Please update the files first, then run this script again."
    exit 1
fi

echo ""
echo "📊 Creating snapshot with updated portfolio..."
node scripts/create-snapshot.js

if [ $? -ne 0 ]; then
    echo "❌ Snapshot creation failed!"
    exit 1
fi

echo ""
echo "🔨 Building web version..."
npx expo export -p web --output-dir docs

echo ""
echo "🔧 Fixing paths for GitHub Pages..."
./scripts/fix-gh-pages-paths.sh

echo ""
echo "📝 Committing changes..."
read -p "Enter commit message (e.g., 'Sold AAPL, bought PLTR'): " commit_msg
git add .
git commit -m "Update portfolio: $commit_msg"

echo ""
read -p "Push to GitHub? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "🚀 Pushing to GitHub..."
    git push origin main
    echo ""
    echo "✅ Portfolio updated and deployed!"
    echo "Changes will be live in 1-2 minutes at:"
    echo "https://makotot-kraken.github.io/mybalance-app/"
else
    echo "⏸️  Changes committed locally but not pushed."
    echo "Run 'git push origin main' when ready."
fi
