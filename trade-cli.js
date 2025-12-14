#!/usr/bin/env node

// Simple CLI tool to process trades
// Usage: npm run trade -- buy TSLA 10 250.50
// or: npm run trade -- sell NVDA 5 180.25

const { processTrade } = require('./scripts/process-trade');

const args = process.argv.slice(2);

if (args.length < 4) {
  console.error('Usage: npm run trade -- <buy|sell> <SYMBOL> <shares> <pricePerShare> [note]');
  console.error('Example: npm run trade -- buy TSLA 10 250.50 "Bought Tesla shares"');
  process.exit(1);
}

const [type, symbol, shares, pricePerShare, ...noteWords] = args;
const note = noteWords.join(' ');

if (!['buy', 'sell'].includes(type.toLowerCase())) {
  console.error('Type must be "buy" or "sell"');
  process.exit(1);
}

const trade = {
  date: new Date().toISOString().split('T')[0],
  type: type.toLowerCase(),
  symbol: symbol.toUpperCase(),
  shares: parseFloat(shares),
  pricePerShare: parseFloat(pricePerShare),
  totalCost: parseFloat(shares) * parseFloat(pricePerShare),
  exchangeRate: 155, // Will be updated from portfolio history
  totalCostJPY: 0, // Will be calculated
  capitalChange: 0, // Will be calculated
  note: note || `${type === 'buy' ? 'Bought' : 'Sold'} ${shares} shares of ${symbol.toUpperCase()}`
};

// Update with actual exchange rate and JPY values
const portfolioHistory = require('./data/portfolio-history.json');
trade.exchangeRate = portfolioHistory[portfolioHistory.length - 1]?.exchangeRate || 155;
trade.totalCostJPY = Math.round(trade.totalCost * trade.exchangeRate);
trade.capitalChange = trade.type === 'buy' ? trade.totalCostJPY : -trade.totalCostJPY;

console.log('\n📊 Trade Details:');
console.log(`Type: ${trade.type.toUpperCase()}`);
console.log(`Symbol: ${trade.symbol}`);
console.log(`Shares: ${trade.shares}`);
console.log(`Price: $${trade.pricePerShare.toFixed(2)}`);
console.log(`Total: $${trade.totalCost.toFixed(2)} (¥${trade.totalCostJPY.toLocaleString()})`);
console.log(`Date: ${trade.date}`);
if (trade.note) console.log(`Note: ${trade.note}`);

processTrade(trade).then(() => {
  console.log('\n✅ Done! Don\'t forget to rebuild and commit:');
  console.log('   npx expo export -p web --output-dir docs && ./scripts/fix-gh-pages-paths.sh');
  console.log('   git add . && git commit -m "Trade: ${trade.type} ${trade.shares} ${trade.symbol}" && git push');
}).catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
