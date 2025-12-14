#!/usr/bin/env node

// Script to clear all trades from trade-log.js
const fs = require('fs').promises;
const path = require('path');

async function clearTrades() {
  const filePath = path.join(__dirname, '..', 'data', 'trade-log.js');
  
  let content = await fs.readFile(filePath, 'utf-8');
  
  // Read current trades to show count
  const tradesMatch = content.match(/export const trades = \[([\s\S]*?)\];/);
  
  if (tradesMatch) {
    const tradesContent = tradesMatch[1].trim();
    const tradeCount = tradesContent ? tradesContent.split('},{').length : 0;
    
    console.log(`\n📋 Current trades: ${tradeCount}`);
    
    if (tradeCount === 0) {
      console.log('✅ No trades to clear.\n');
      return;
    }
    
    // Clear the trades array
    content = content.replace(
      /export const trades = \[([\s\S]*?)\];/,
      'export const trades = [\n  // Trades cleared for testing\n];'
    );
    
    await fs.writeFile(filePath, content);
    console.log(`✅ Cleared ${tradeCount} trade(s) from trade-log.js\n`);
    console.log('Next steps:');
    console.log('1. npx expo export -p web --output-dir docs && ./scripts/fix-gh-pages-paths.sh');
    console.log('2. git add . && git commit -m "Clear test trades" && git push\n');
  } else {
    console.log('❌ Could not find trades array in trade-log.js\n');
  }
}

clearTrades().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
