# Annual Performance Database Guide

## Overview

The Annual Performance Database (`data/annual-performance-db.js`) is a structured data store that captures all key metrics for each year's portfolio performance. This eliminates the need to hardcode values and enables automatic calculation of annual returns.

## Database Structure

Each year entry contains:

### Portfolio Values (JPY)
- **startValue**: Portfolio value on Jan 1 (or first tracking date)
- **endValue**: Portfolio value on Dec 31 (last day of year)
- **currentBalance**: Live real-time value (updated in app)

### Performance Metrics
- **actualProfit**: Total gain/loss for the year
- **returnPercent**: Annual return percentage

### Capital Tracking
- **capitalAdded**: Total capital added during the year
- **capitalWithdrawn**: Total capital withdrawn during the year
- **netCapitalChange**: Net capital change (added - withdrawn)

### Holdings Breakdown
- **stocksProfit**: Total profit from stock holdings
- **cryptoProfit**: Total profit from crypto holdings

### Metadata
- **startDate / endDate**: Year date range
- **notes**: Additional information
- **calculationMethod**: "hardcoded" or "automatic"
- **formula**: Calculation formula used

## Workflow

### 1. During the Year

Track all capital changes:
```bash
# When you add capital
# Manually update in data/annual-performance-db.js:
capitalAdded: 500000  # Added ¥500,000 in March
```

### 2. End of Year

Finalize the year's data:
```bash
# This updates endValue from the last snapshot
npm run finalize-year 2025
```

Then manually update in `data/annual-performance-db.js`:
- `actualProfit`: Get from Portfolio Summary (total gain/loss)
- `stocksProfit`: Total stocks gain
- `cryptoProfit`: Total crypto gain
- `returnPercent`: Calculate or let it auto-calculate

### 3. Start of New Year

Create next year's entry:
```bash
npm run create-year 2026
```

This automatically:
- Sets `startValue` = previous year's `endValue`
- Creates template with all required fields
- Sets calculation method to "automatic"

## Calculation Methods

### Hardcoded (2025)
Used for 2025 since it's a partial year:
```javascript
returnPercent = (actualProfit / endValue) * 100
```

### Automatic (2026+)
Standard annual calculation:
```javascript
actualProfit = endValue - startValue - capitalAdded
avgCapital = startValue + (capitalAdded / 2)
returnPercent = (actualProfit / avgCapital) * 100
```

## Example: 2025

```javascript
"2025": {
  startDate: "2025-11-12",
  endDate: "2025-12-31",
  startValue: 9143568,       // Nov 12 starting value
  endValue: 9500000,         // Dec 31 final value (example)
  currentBalance: null,      // Live value in app
  actualProfit: 1800000,     // Total holdings gain
  returnPercent: 18.95,      // 1,800,000 / 9,500,000 * 100
  capitalAdded: 0,           // No new capital
  capitalWithdrawn: 0,
  netCapitalChange: 0,
  stocksProfit: 1900000,
  cryptoProfit: -100000,
  notes: "Starting year - partial tracking",
  calculationMethod: "hardcoded",
  formula: "returnPercent = (actualProfit / endValue) * 100"
}
```

## Example: 2026

```javascript
"2026": {
  startDate: "2026-01-01",
  endDate: "2026-12-31",
  startValue: 9500000,       // = 2025.endValue
  endValue: 11200000,        // Dec 31, 2026 value
  currentBalance: null,
  actualProfit: 1200000,     // 11,200,000 - 9,500,000 - 500,000
  returnPercent: 12.37,      // 1,200,000 / 9,700,000 * 100
  capitalAdded: 500000,      // Added ¥500k during year
  capitalWithdrawn: 0,
  netCapitalChange: 500000,
  stocksProfit: 1100000,
  cryptoProfit: 100000,
  notes: "Full year tracking",
  calculationMethod: "automatic",
  formula: "returnPercent = (actualProfit / avgCapital) * 100"
}
```

Where:
- `avgCapital = 9,500,000 + (500,000 / 2) = 9,750,000`
- `returnPercent = 1,200,000 / 9,750,000 * 100 = 12.31%`

## Commands

```bash
# Finalize current year (updates endValue from last snapshot)
npm run finalize-year 2025

# Create new year entry
npm run create-year 2026

# Finalize specific year
npm run finalize-year 2026
```

## Manual Updates Required

After running `finalize-year`, manually edit `data/annual-performance-db.js`:

1. **actualProfit**: Check app's Portfolio Summary
2. **stocksProfit**: Total gain from stocks section
3. **cryptoProfit**: Total gain from crypto section
4. **returnPercent**: Will auto-calculate, or set manually
5. **notes**: Add any relevant notes about the year

## Integration

The database is automatically used by `utils/annualProfit.js`:
- Reads year data from database
- Falls back to history calculation if year not in DB
- Returns structured performance data for UI display

## Benefits

✅ **No Hardcoding**: All values stored in database  
✅ **Automatic Calculations**: Future years calculate automatically  
✅ **Capital Tracking**: Built-in tracking for additions/withdrawals  
✅ **Historical Record**: Complete yearly performance history  
✅ **Flexible**: Can override automatic calculations if needed  
✅ **Auditable**: Clear formula and calculation method for each year  

## Tips

1. **Update capital changes immediately** when they occur
2. **Run finalize-year on Dec 31** or Jan 1
3. **Create new year on Jan 1** of each year
4. **Verify calculations** manually for first year
5. **Keep notes** about significant events

## Troubleshooting

**Q: Script says "endValue already set"**  
A: The year is already finalized. Update manually if needed.

**Q: Start value is null for new year**  
A: Previous year not finalized. Run `finalize-year` for previous year first.

**Q: Return percent seems wrong**  
A: Check if `calculationMethod` is correct. 2025 uses hardcoded, 2026+ uses automatic.

**Q: How to handle stock splits?**  
A: Note in the `notes` field. Splits don't affect JPY values.
