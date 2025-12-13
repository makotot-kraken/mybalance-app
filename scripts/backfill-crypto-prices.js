// Backfill missing crypto values in portfolio history
// Uses CoinGecko free API to fetch historical Bitcoin prices

const fs = require('fs').promises;
const path = require('path');

const BTC_AMOUNT = 0.03639155;

// Fetch historical BTC price from CoinGecko (free, no API key needed)
async function fetchHistoricalBTCPrice(date) {
  // CoinGecko date format: dd-mm-yyyy
  const [year, month, day] = date.split('-');
  const formattedDate = `${day}-${month}-${year}`;
  
  const url = `https://api.coingecko.com/api/v3/coins/bitcoin/history?date=${formattedDate}`;
  
  try {
    console.log(`Fetching BTC price for ${date}...`);
    const response = await fetch(url);
    const data = await response.json();
    
    if (data && data.market_data && data.market_data.current_price) {
      const btcUsd = data.market_data.current_price.usd;
      console.log(`  BTC price on ${date}: $${btcUsd}`);
      return btcUsd;
    } else {
      console.error(`  No price data for ${date}`);
      return null;
    }
  } catch (error) {
    console.error(`  Error fetching price for ${date}:`, error.message);
    return null;
  }
}

async function backfillMissingData() {
  console.log('Starting backfill of missing crypto values...\n');
  
  // Read portfolio history
  const historyPath = path.join(__dirname, '..', 'data', 'portfolio-history.json');
  const historyData = await fs.readFile(historyPath, 'utf-8');
  const history = JSON.parse(historyData);
  
  // Find entries with null crypto values
  const missingEntries = history.filter(entry => entry.cryptoValue === null);
  console.log(`Found ${missingEntries.length} entries with missing crypto values\n`);
  
  if (missingEntries.length === 0) {
    console.log('No missing data to backfill!');
    return;
  }
  
  // Backfill each missing entry
  let successCount = 0;
  for (const entry of missingEntries) {
    const btcUsd = await fetchHistoricalBTCPrice(entry.date);
    
    if (btcUsd) {
      const btcJpy = btcUsd * entry.exchangeRate;
      entry.cryptoValue = Math.round(BTC_AMOUNT * btcJpy);
      entry.totalValue = entry.stockValue + entry.cryptoValue;
      console.log(`  ✓ Updated ${entry.date}: Crypto ¥${entry.cryptoValue.toLocaleString()}, Total ¥${entry.totalValue.toLocaleString()}\n`);
      successCount++;
      
      // Rate limit: CoinGecko free tier allows ~10-50 calls/minute
      // Wait 2 seconds between calls to be safe
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      console.log(`  ✗ Failed to update ${entry.date}\n`);
    }
  }
  
  // Save updated history
  await fs.writeFile(historyPath, JSON.stringify(history, null, 2));
  console.log(`\n✅ Backfill complete! Updated ${successCount}/${missingEntries.length} entries`);
  console.log(`Updated file: ${historyPath}`);
}

// Run the backfill
backfillMissingData().catch(error => {
  console.error('Error during backfill:', error);
  process.exit(1);
});
