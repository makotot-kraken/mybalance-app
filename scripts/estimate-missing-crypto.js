// Estimate missing crypto values using interpolation
const fs = require('fs').promises;
const path = require('path');

const BTC_AMOUNT = 0.03639155;

async function estimateMissingData() {
  console.log('Estimating missing crypto values using interpolation...\n');
  
  // Read portfolio history
  const historyPath = path.join(__dirname, '..', 'data', 'portfolio-history.json');
  const historyData = await fs.readFile(historyPath, 'utf-8');
  const history = JSON.parse(historyData);
  
  // Find entries with known crypto values for interpolation
  const knownEntries = history.filter(entry => entry.cryptoValue !== null);
  
  console.log(`Found ${knownEntries.length} entries with known crypto values:`);
  knownEntries.forEach(entry => {
    const btcPrice = entry.cryptoValue / BTC_AMOUNT;
    console.log(`  ${entry.date}: ¥${entry.cryptoValue.toLocaleString()} (BTC: ¥${Math.round(btcPrice).toLocaleString()})`);
  });
  
  // Interpolate missing values
  let updatedCount = 0;
  for (let i = 0; i < history.length; i++) {
    if (history[i].cryptoValue === null) {
      // Find nearest known values before and after
      let before = null;
      let after = null;
      
      for (let j = i - 1; j >= 0; j--) {
        if (history[j].cryptoValue !== null) {
          before = { index: j, ...history[j] };
          break;
        }
      }
      
      for (let j = i + 1; j < history.length; j++) {
        if (history[j].cryptoValue !== null) {
          after = { index: j, ...history[j] };
          break;
        }
      }
      
      if (before && after) {
        // Linear interpolation
        const beforeBtcJpy = before.cryptoValue / BTC_AMOUNT;
        const afterBtcJpy = after.cryptoValue / BTC_AMOUNT;
        
        const ratio = (i - before.index) / (after.index - before.index);
        const estimatedBtcJpy = beforeBtcJpy + (afterBtcJpy - beforeBtcJpy) * ratio;
        
        history[i].cryptoValue = Math.round(BTC_AMOUNT * estimatedBtcJpy);
        history[i].totalValue = history[i].stockValue + history[i].cryptoValue;
        
        console.log(`\n✓ Estimated ${history[i].date}:`);
        console.log(`  BTC price: ¥${Math.round(estimatedBtcJpy).toLocaleString()}/BTC`);
        console.log(`  Crypto value: ¥${history[i].cryptoValue.toLocaleString()}`);
        console.log(`  Total: ¥${history[i].totalValue.toLocaleString()}`);
        
        updatedCount++;
      } else if (before) {
        // Use last known value
        const btcJpy = before.cryptoValue / BTC_AMOUNT;
        history[i].cryptoValue = Math.round(BTC_AMOUNT * btcJpy);
        history[i].totalValue = history[i].stockValue + history[i].cryptoValue;
        
        console.log(`\n≈ Using last known value for ${history[i].date}: ¥${history[i].cryptoValue.toLocaleString()}`);
        updatedCount++;
      }
    }
  }
  
  // Save updated history
  await fs.writeFile(historyPath, JSON.stringify(history, null, 2));
  console.log(`\n\n✅ Estimation complete! Updated ${updatedCount} entries`);
  console.log(`Updated file: ${historyPath}`);
}

estimateMissingData().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
