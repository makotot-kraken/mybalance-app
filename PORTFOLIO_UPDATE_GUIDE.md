# Portfolio Update Guide

## When You Buy or Sell Stocks

### Steps to Update Your Portfolio:

1. **Update holdings in `data/assets.js`:**
   - Edit the `portfolio.stocks` array
   - Add new stocks or update share counts
   - Remove stocks you've sold completely

2. **Update cost basis in `data/assets.js`:**
   - Find the `actualAvgCostsOriginal` objects (there are 2 instances)
   - Add cost basis for new stocks
   - Update cost basis if you added to existing positions
   - Remove cost basis for sold stocks

3. **Update the snapshot script `scripts/create-snapshot.js`:**
   - Add new stock symbols to the portfolio array
   - Add to `stockSymbols` array if it's a US stock
   - The script will automatically fetch prices

4. **Run snapshot manually to record the change:**
   ```bash
   node scripts/create-snapshot.js
   ```
   This captures your portfolio value after the trade.

5. **Rebuild and deploy:**
   ```bash
   npx expo export -p web --output-dir docs
   ./scripts/fix-gh-pages-paths.sh
   git add .
   git commit -m "Update portfolio: [describe your trades]"
   git push origin main
   ```

## Example: Selling CRWV and Buying PLTR

### 1. Update `data/assets.js` portfolio:
```javascript
stocks: [
  // ... existing stocks ...
  // Remove or reduce CRWV:
  {
    symbol: 'CRWV',
    name: 'CrowdStrike',
    shares: 0,  // Sold all
    exchange: 'NASDAQ',
  },
  // Add new stock:
  {
    symbol: 'PLTR',
    name: 'Palantir',
    shares: 50,
    exchange: 'NASDAQ',
  },
]
```

### 2. Update cost basis (2 places in `data/assets.js`):
```javascript
const actualAvgCostsOriginal = {
  // ... other stocks ...
  'CRWV': 106.75,  // Keep for historical data
  'PLTR': 45.30,   // Add your purchase price
  // ... other stocks ...
};
```

### 3. Update `scripts/create-snapshot.js`:
```javascript
const stockSymbols = ['TSLA', 'NVDA', 'PLTR', 'GOOGL', 'NFLX', 'TTWO', 'PYPL', 'RXRX'];
// Add 'PLTR', remove 'CRWV' if sold completely
```

## What the Graph Will Show

- **Before trade**: Your portfolio at previous value
- **After trade**: New portfolio value (may be higher/lower based on:
  - Cash added/withdrawn
  - Market prices at trade time
  - Gains/losses realized)
- **Continuing trend**: Daily updates continue from new baseline

This accurately represents your actual portfolio value over time, including all trading decisions!

## Advanced: Tracking Capital Changes (Optional)

If you want to track capital deposits/withdrawals separately:

Add a `capitalEvents` array to track when you add/remove money:
```javascript
// In data/assets.js
export const capitalEvents = [
  { date: '2025-11-12', amount: 1000000, note: 'Initial investment' },
  { date: '2025-12-01', amount: 500000, note: 'Additional capital' },
  { date: '2026-01-15', amount: -200000, note: 'Withdrawal' },
];
```

This lets you calculate:
- **Total return** = Current value - (Initial capital + additions - withdrawals)
- **ROI %** = Total return / Total capital invested

Let me know if you'd like me to implement the advanced capital tracking!
