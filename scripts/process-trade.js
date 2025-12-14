// Script to process a trade and update all necessary files
const fs = require('fs').promises;
const path = require('path');

async function processTrade(trade) {
  console.log('\n=== Processing Trade ===');
  console.log(JSON.stringify(trade, null, 2));
  
  const symbol = trade.symbol.toUpperCase();
  const shares = parseFloat(trade.shares);
  const pricePerShare = parseFloat(trade.pricePerShare);
  const isBuy = trade.type === 'buy';
  
  // 1. Update trade-log.js
  await updateTradeLog(trade);
  
  // 2. Update portfolio in data/assets.js
  await updatePortfolioHoldings(symbol, shares, pricePerShare, isBuy);
  
  // 3. Update snapshot script
  await updateSnapshotScript(symbol, shares, isBuy);
  
  // 4. Update capital tracking
  await updateCapitalTracking(trade);
  
  console.log('\n✅ Trade processed successfully!');
  console.log('\nPlease rebuild the app with: npx expo export -p web --output-dir docs');
}

async function updateTradeLog(trade) {
  const filePath = path.join(__dirname, '..', 'data', 'trade-log.js');
  let content = await fs.readFile(filePath, 'utf-8');
  
  // Find the trades array and add new trade
  const tradeStr = JSON.stringify(trade, null, 2).split('\n').map(line => '  ' + line).join('\n');
  
  if (content.includes('export const trades = [')) {
    // Add to existing array
    content = content.replace(
      'export const trades = [',
      `export const trades = [\n${tradeStr},`
    );
  }
  
  await fs.writeFile(filePath, content);
  console.log('✓ Updated trade-log.js');
}

async function updatePortfolioHoldings(symbol, shares, pricePerShare, isBuy) {
  const filePath = path.join(__dirname, '..', 'data', 'assets.js');
  let content = await fs.readFile(filePath, 'utf-8');
  
  // Check if symbol exists in portfolio
  const stockPattern = new RegExp(`symbol:\\s*'${symbol}'[\\s\\S]*?shares:\\s*([0-9.]+)`, 'm');
  const match = content.match(stockPattern);
  
  if (match) {
    // Existing holding - update shares
    const currentShares = parseFloat(match[1]);
    const newShares = isBuy ? currentShares + shares : currentShares - shares;
    
    if (newShares <= 0) {
      // Remove the holding
      const holdingPattern = new RegExp(`\\s*{\\s*symbol:\\s*'${symbol}'[\\s\\S]*?},\\s*`, 'm');
      content = content.replace(holdingPattern, '');
      console.log(`✓ Removed ${symbol} from portfolio (shares: ${currentShares} → 0)`);
    } else {
      // Update shares
      content = content.replace(
        new RegExp(`(symbol:\\s*'${symbol}'[\\s\\S]*?shares:\\s*)${currentShares}`),
        `$1${newShares}`
      );
      console.log(`✓ Updated ${symbol} shares: ${currentShares} → ${newShares}`);
    }
    
    // Update cost basis (weighted average for buys)
    if (isBuy) {
      await updateCostBasis(symbol, currentShares, newShares, pricePerShare, content, filePath);
    }
  } else if (isBuy) {
    // New holding - add to portfolio
    const newHolding = `    {
      symbol: '${symbol}',
      name: '${symbol}', // TODO: Update with full company name
      shares: ${shares},
      exchange: 'NASDAQ',
    },`;
    
    // Add before the last stock (3350.T or first stock)
    content = content.replace(
      /({\s*symbol:\s*'3350\.T')/,
      `${newHolding}\n    $1`
    );
    
    console.log(`✓ Added ${symbol} to portfolio (${shares} shares at $${pricePerShare})`);
    
    // Add cost basis
    await addCostBasis(symbol, pricePerShare, content, filePath);
  }
  
  await fs.writeFile(filePath, content);
  
  // Update price fetch arrays
  await updatePriceFetchArrays(symbol, isBuy, shares === 0);
}

async function updateCostBasis(symbol, oldShares, newShares, newPrice, content, filePath) {
  // Calculate weighted average cost
  const costPattern = new RegExp(`'${symbol}':\\s*([0-9.]+),`);
  const matches = content.match(new RegExp(costPattern, 'g'));
  
  if (matches && matches.length >= 2) {
    const currentCost = parseFloat(matches[0].match(/([0-9.]+)/)[0]);
    const weightedCost = ((currentCost * oldShares) + (newPrice * (newShares - oldShares))) / newShares;
    
    // Update both instances
    let updated = content;
    let count = 0;
    updated = updated.replace(new RegExp(`('${symbol}':\\s*)${currentCost}`, 'g'), (match, prefix) => {
      count++;
      return `${prefix}${weightedCost.toFixed(2)}`;
    });
    
    await fs.writeFile(filePath, updated);
    console.log(`✓ Updated cost basis for ${symbol}: $${currentCost} → $${weightedCost.toFixed(2)}`);
  }
}

async function addCostBasis(symbol, price, content, filePath) {
  // Add to both actualAvgCostsOriginal objects
  let updated = content;
  
  const pattern = /('RKLB':\s*[0-9.]+,\s*\/\/ USD[^\n]*\n)/g;
  updated = updated.replace(pattern, `$1    '${symbol}': ${price.toFixed(2)}, // USD - Your actual cost\n`);
  
  await fs.writeFile(filePath, updated);
  console.log(`✓ Added cost basis for ${symbol}: $${price.toFixed(2)}`);
}

async function updatePriceFetchArrays(symbol, isBuy, isRemoved) {
  const filePath = path.join(__dirname, '..', 'data', 'assets.js');
  let content = await fs.readFile(filePath, 'utf-8');
  
  const arrayPattern = /const stockSymbols = \[([\s\S]*?)\];/g;
  
  if (isBuy && !content.includes(`'${symbol}'`)) {
    // Add symbol to price fetch arrays
    content = content.replace(
      /const stockSymbols = \[([\s\S]*?)'RKLB'/g,
      `const stockSymbols = [$1'RKLB', '${symbol}'`
    );
    console.log(`✓ Added ${symbol} to price fetch arrays`);
    await fs.writeFile(filePath, content);
  } else if (isRemoved) {
    // Remove from arrays
    content = content.replace(new RegExp(`,\\s*'${symbol}'`, 'g'), '');
    content = content.replace(new RegExp(`'${symbol}',\\s*`, 'g'), '');
    console.log(`✓ Removed ${symbol} from price fetch arrays`);
    await fs.writeFile(filePath, content);
  }
}

async function updateSnapshotScript(symbol, shares, isBuy) {
  const filePath = path.join(__dirname, 'create-snapshot.js');
  let content = await fs.readFile(filePath, 'utf-8');
  
  const stockPattern = new RegExp(`symbol:\\s*'${symbol}'[\\s\\S]*?shares:\\s*([0-9.]+)`, 'm');
  const match = content.match(stockPattern);
  
  if (match) {
    const currentShares = parseFloat(match[1]);
    const newShares = isBuy ? currentShares + shares : currentShares - shares;
    
    if (newShares <= 0) {
      const holdingPattern = new RegExp(`\\s*{\\s*symbol:\\s*'${symbol}'[\\s\\S]*?},\\s*`, 'm');
      content = content.replace(holdingPattern, '');
      console.log(`✓ Removed ${symbol} from snapshot script`);
    } else {
      content = content.replace(
        new RegExp(`(symbol:\\s*'${symbol}'[\\s\\S]*?shares:\\s*)${currentShares}`),
        `$1${newShares}`
      );
      console.log(`✓ Updated ${symbol} in snapshot script: ${currentShares} → ${newShares}`);
    }
  } else if (isBuy) {
    const newHolding = `    {
      symbol: '${symbol}',
      name: '${symbol}',
      shares: ${shares},
      exchange: 'NASDAQ',
    },`;
    
    content = content.replace(
      /({\s*symbol:\s*'3350\.T')/,
      `${newHolding}\n    $1`
    );
    
    // Add to stockSymbols array
    content = content.replace(
      /(const stockSymbols = \[[\s\S]*?)'RKLB'/,
      `$1'RKLB', '${symbol}'`
    );
    
    console.log(`✓ Added ${symbol} to snapshot script`);
  }
  
  await fs.writeFile(filePath, content);
}

async function updateCapitalTracking(trade) {
  const filePath = path.join(__dirname, '..', 'data', 'capital-tracking.js');
  let content = await fs.readFile(filePath, 'utf-8');
  
  const capitalEvent = {
    date: trade.date,
    amount: trade.capitalChange,
    type: trade.type === 'buy' ? 'deposit' : 'withdrawal',
    note: trade.note
  };
  
  const eventStr = JSON.stringify(capitalEvent, null, 2).split('\n').map(line => '  ' + line).join('\n');
  
  content = content.replace(
    'export const capitalEvents = [',
    `export const capitalEvents = [\n${eventStr},`
  );
  
  await fs.writeFile(filePath, content);
  console.log('✓ Updated capital-tracking.js');
}

// Read trade from stdin or command line
if (require.main === module) {
  const tradeJson = process.argv[2];
  
  if (!tradeJson) {
    console.error('Usage: node process-trade.js \'{"date":"2025-12-14","type":"buy",...}\'');
    process.exit(1);
  }
  
  try {
    const trade = JSON.parse(tradeJson);
    processTrade(trade).catch(error => {
      console.error('Error processing trade:', error);
      process.exit(1);
    });
  } catch (error) {
    console.error('Invalid JSON:', error.message);
    process.exit(1);
  }
}

module.exports = { processTrade };
