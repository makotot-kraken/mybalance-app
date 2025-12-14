# Cost Basis Calculation Strategy

## Current Implementation: Weighted Average Cost

The system uses **Weighted Average Cost** method for calculating cost basis. This is the recommended approach for most investors.

### How It Works

When you buy more shares of a stock you already own:

```
New Average Cost = (Old Cost × Old Shares) + (New Price × New Shares)
                   ───────────────────────────────────────────────────
                                Total Shares
```

### Example

**Scenario 1: First Purchase**
- Buy 100 shares of AAPL at $150
- Cost Basis: **$150.00**

**Scenario 2: Buy More at Higher Price**
- Already own: 100 shares at $150
- Buy: 50 shares at $180
- New Cost Basis:
  ```
  (150 × 100) + (180 × 50)     15,000 + 9,000     24,000
  ─────────────────────────── = ────────────────── = ────── = $160.00
           150                        150             150
  ```
- **New Cost Basis: $160.00 for all 150 shares**

**Scenario 3: Buy More at Lower Price**
- Already own: 150 shares at $160
- Buy: 50 shares at $140
- New Cost Basis:
  ```
  (160 × 150) + (140 × 50)     24,000 + 7,000     31,000
  ─────────────────────────── = ────────────────── = ────── = $155.00
  ──────────200                       200            200
  ```
- **New Cost Basis: $155.00 for all 200 shares**

### Selling Shares

When you sell shares:
- **Cost basis does NOT change** for remaining shares
- Profit/Loss calculated using current average cost

**Example:**
- Own: 200 shares at $155 avg cost
- Sell: 50 shares at $180
- Profit: (180 - 155) × 50 = **$1,250 profit**
- Remaining: 150 shares still at **$155 avg cost**

## Alternative Methods (Not Implemented)

### 1. FIFO (First In, First Out)
- Sell oldest shares first
- More complex to track
- May result in higher capital gains taxes

### 2. LIFO (Last In, First Out)
- Sell newest shares first
- More complex to track
- May result in lower capital gains taxes

### 3. Specific Lot Identification
- Choose exactly which shares to sell
- Requires detailed record-keeping
- Optimal for tax purposes but very complex

## Why Weighted Average?

✅ **Simple**: Easy to understand and calculate  
✅ **Accurate**: Reflects true average investment  
✅ **Fair**: Treats all shares equally  
✅ **Common**: Used by most brokers for mutual funds  
✅ **Automatic**: No need to choose which shares to sell  

## Implementation in Code

### Location
- File: `scripts/process-trade.js`
- Function: `updateCostBasis()`

### Process
1. Find current cost basis in `data/assets.js`
2. Calculate weighted average with new purchase
3. Update cost basis in both places:
   - `actualAvgCostsOriginal` (line ~50)
   - `actualAvgCostsOriginal` (line ~150)

### Example Code
```javascript
const currentCost = 150.00;  // Current avg cost
const oldShares = 100;        // Current shares
const newPrice = 180.00;      // New purchase price
const newShares = 50;         // Shares to add

const weightedCost = 
  ((currentCost * oldShares) + (newPrice * newShares)) 
  / (oldShares + newShares);

// Result: $160.00
```

## Tax Implications

**Important**: For tax purposes in your country:
- Check if weighted average is accepted
- Some countries require FIFO
- Keep detailed trade records
- Consult a tax professional

In Japan (your case):
- Weighted average is generally accepted
- Keep records of all trades
- Report annually on tax return

## Viewing Your Cost Basis

Your current cost basis for each stock is stored in:
```javascript
// File: data/assets.js
const actualAvgCostsOriginal = {
  'TSLA': 455.68,   // Your actual cost per share
  'NVDA': 127.60,
  'RKLB': 40.69,
  // ... etc
};
```

This is updated automatically when you use:
```bash
npm run trade -- buy TSLA 10 250.00
```

## Questions?

**Q: What if I bought at different times with different prices?**  
A: That's exactly what weighted average handles! Each purchase updates the average.

**Q: How do I track gains/losses?**  
A: Current Price - Average Cost = Gain/Loss per share

**Q: Can I switch to FIFO later?**  
A: Not recommended. Stick with one method for consistency.

**Q: What about stock splits?**  
A: Adjust both shares and cost basis proportionally.
  - 2:1 split: Double shares, halve cost basis
  - 3:2 split: 1.5× shares, 0.67× cost basis
