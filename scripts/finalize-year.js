#!/usr/bin/env node

// Script to finalize a year's performance data
// Run this at the end of each year to lock in the final values

const fs = require('fs').promises;
const path = require('path');

async function finalizeYear(year) {
  console.log(`\n📊 Finalizing ${year} Performance Data\n`);
  
  // Read portfolio history to get final snapshot
  const historyPath = path.join(__dirname, '..', 'data', 'portfolio-history.json');
  const history = JSON.parse(await fs.readFile(historyPath, 'utf-8'));
  
  // Get last snapshot of the year
  const yearSnapshots = history.filter(entry => entry.date.startsWith(year));
  
  if (yearSnapshots.length === 0) {
    console.error(`❌ No snapshots found for ${year}`);
    return;
  }
  
  const lastSnapshot = yearSnapshots[yearSnapshots.length - 1];
  console.log(`Last snapshot: ${lastSnapshot.date}`);
  console.log(`End Value: ¥${lastSnapshot.totalValue?.toLocaleString() || 'N/A'}`);
  
  // Read current database
  const dbPath = path.join(__dirname, '..', 'data', 'annual-performance-db.js');
  let dbContent = await fs.readFile(dbPath, 'utf-8');
  
  // Update the year's endValue
  const endValuePattern = new RegExp(`("${year}":\\s*{[\\s\\S]*?endValue:\\s*)null`, 'm');
  
  if (endValuePattern.test(dbContent)) {
    dbContent = dbContent.replace(
      endValuePattern,
      `$1${lastSnapshot.totalValue}`
    );
    console.log(`✓ Updated endValue: ¥${lastSnapshot.totalValue?.toLocaleString()}`);
  } else {
    console.log(`⚠️  endValue already set for ${year}`);
  }
  
  // Prompt for actual profit (from holdings)
  console.log('\n📝 Please manually update the following in annual-performance-db.js:');
  console.log(`   - actualProfit: (check Portfolio Summary for total gain/loss)`);
  console.log(`   - stocksProfit: (total stocks gain/loss)`);
  console.log(`   - cryptoProfit: (total crypto gain/loss)`);
  console.log(`   - returnPercent: (actualProfit / endValue * 100)`);
  
  // Save updated database
  await fs.writeFile(dbPath, dbContent);
  console.log(`\n✅ ${year} finalized in database!`);
  console.log(`\nNext steps:`);
  console.log(`1. Update actualProfit, stocksProfit, cryptoProfit manually`);
  console.log(`2. For ${parseInt(year) + 1}, run: node scripts/create-new-year.js ${parseInt(year) + 1}`);
}

// Get year from command line or use current year
const year = process.argv[2] || new Date().getFullYear().toString();

finalizeYear(year).catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
