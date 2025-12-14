# Trade Logging System

## Quick Start

### Using CLI (Recommended)

```bash
# Buy stock
npm run trade -- buy TSLA 10 250.50

# Sell stock  
npm run trade -- sell NVDA 5 180.25

# With custom note
npm run trade -- buy AAPL 15 175.00 "Buying Apple dip"
```

### What It Does Automatically

When you log a trade, the system automatically:

✅ **For BUY trades:**
1. Adds new stock to portfolio (if doesn't exist)
2. Updates share count (if already exists)
3. Calculates weighted average cost basis
4. Adds to price fetch arrays
5. Updates snapshot script
6. Records capital addition

✅ **For SELL trades:**
1. Reduces share count
2. Removes stock if shares reach zero
3. Cleans up price fetchers if removed
4. Records capital withdrawal

### Files Updated

- `data/assets.js` - Portfolio holdings & cost basis
- `data/trade-log.js` - Trade history
- `data/capital-tracking.js` - Capital events
- `scripts/create-snapshot.js` - Daily snapshot config

### After Logging a Trade

```bash
# Rebuild and deploy
npx expo export -p web --output-dir docs && ./scripts/fix-gh-pages-paths.sh

# Commit changes
git add .
git commit -m "Trade: buy 10 TSLA at $250.50"
git push origin main
```

## Examples

### Example 1: Buy New Stock
```bash
npm run trade -- buy RKLB 54 40.69
```
**Result:**
- Adds RKLB to portfolio with 54 shares
- Sets cost basis at $40.69
- Adds to all price fetchers
- Calculates JPY cost using current exchange rate

### Example 2: Buy More of Existing Stock
```bash
# Current: 100 TSLA @ $200
npm run trade -- buy TSLA 50 300

# New: 150 TSLA @ $233.33 (weighted average)
```

### Example 3: Sell Partial Position
```bash
# Current: 100 NVDA @ $150
npm run trade -- sell NVDA 25 180

# New: 75 NVDA @ $150 (cost basis unchanged)
```

### Example 4: Sell Entire Position
```bash
# Current: 50 AAPL @ $175
npm run trade -- sell AAPL 50 200

# Result: AAPL removed from portfolio
```

## Trade Data Structure

```javascript
{
  date: '2025-12-14',
  type: 'buy',  // or 'sell'
  symbol: 'TSLA',
  shares: 10,
  pricePerShare: 250.50,
  totalCost: 2505.00,       // USD
  exchangeRate: 155.37,
  totalCostJPY: 389048,     // JPY
  capitalChange: 389048,    // Positive for buy, negative for sell
  note: 'Bought Tesla shares'
}
```

## Annual Performance Impact

Trades automatically update your annual performance tracking:

- **Buy trades** → Capital added (reduces profit %)
- **Sell trades** → Capital withdrawn (increases profit %)

**2025 Formula:** Profit = End Value - Start Value  
**2026+ Formula:** Profit = End Value - Start Value - Capital Added

## Manual Mode (Fallback)

If the CLI doesn't work, you can manually process trades:

```bash
node scripts/process-trade.js '{"date":"2025-12-14","type":"buy","symbol":"TSLA",...}'
```

Or update files manually as before.

## Tips

1. **Always use CLI when possible** - It's faster and error-free
2. **Check git diff** - Review changes before committing
3. **Rebuild immediately** - Don't forget to rebuild after trades
4. **Keep notes** - Use the note parameter for important context

## Troubleshooting

**Q: Trade processed but not showing in app?**  
A: Run rebuild command and refresh the page

**Q: Wrong exchange rate used?**  
A: Exchange rate is taken from latest snapshot. Run snapshot script first if needed.

**Q: Made a mistake?**  
A: Just `git checkout` the affected files and run the trade again correctly

**Q: Want to undo a trade?**  
A: Do the opposite trade (if bought, sell the same amount at same price)
