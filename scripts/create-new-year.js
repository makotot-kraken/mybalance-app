#!/usr/bin/env node

// Script to create a new year entry in the annual performance database
// Run this at the start of each new year

const fs = require('fs').promises;
const path = require('path');

async function createNewYear(year) {
  console.log(`\n📅 Creating ${year} Entry\n`);
  
  const dbPath = path.join(__dirname, '..', 'data', 'annual-performance-db.js');
  let dbContent = await fs.readFile(dbPath, 'utf-8');
  
  // Get previous year's data
  const prevYear = (parseInt(year) - 1).toString();
  const prevYearPattern = new RegExp(`"${prevYear}":\\s*{[\\s\\S]*?endValue:\\s*([0-9]+)`, 'm');
  const match = dbContent.match(prevYearPattern);
  
  let startValue = 'null';
  if (match) {
    startValue = match[1];
    console.log(`Previous year (${prevYear}) end value: ¥${parseInt(startValue).toLocaleString()}`);
    console.log(`This becomes ${year} start value`);
  } else {
    console.log(`⚠️  Could not find ${prevYear} end value. Set startValue manually.`);
  }
  
  // Create new year template
  const newYearTemplate = `
  // Year ${year}
  "${year}": {
    startDate: "${year}-01-01",
    endDate: "${year}-12-31",
    
    // Portfolio values (JPY)
    startValue: ${startValue},       // ${prevYear} end value
    endValue: null,            // Will be set to Dec 31 snapshot value
    currentBalance: null,      // Live value - updated real-time in app
    
    // Performance metrics
    actualProfit: null,        // endValue - startValue - capitalAdded
    returnPercent: null,       // (actualProfit / avgCapital) * 100
    
    // Capital tracking
    capitalAdded: 0,           // Total capital added in ${year}
    capitalWithdrawn: 0,       // Total withdrawals in ${year}
    netCapitalChange: 0,       // capitalAdded - capitalWithdrawn
    
    // Holdings breakdown
    stocksProfit: null,        // Total profit from stock holdings
    cryptoProfit: null,        // Total profit from crypto holdings
    
    // Notes
    notes: "Full year tracking - Jan 1 to Dec 31, ${year}",
    
    // Calculation method
    calculationMethod: "automatic",
    formula: "returnPercent = (actualProfit / avgCapital) * 100, where avgCapital = startValue + (capitalAdded / 2)"
  },`;
  
  // Find insertion point (before the closing brace of annualPerformanceData)
  const insertionPattern = /};[\s]*\/\/ Helper function/;
  
  if (insertionPattern.test(dbContent)) {
    dbContent = dbContent.replace(
      insertionPattern,
      `${newYearTemplate}\n};

// Helper function`
    );
    
    await fs.writeFile(dbPath, dbContent);
    console.log(`\n✅ ${year} entry created in database!`);
    console.log(`\nDatabase location: data/annual-performance-db.js`);
    console.log(`\nDuring ${year}:`);
    console.log(`- Track all trades and capital changes`);
    console.log(`- Update capitalAdded/capitalWithdrawn as needed`);
    console.log(`\nAt end of ${year}:`);
    console.log(`- Run: node scripts/finalize-year.js ${year}`);
  } else {
    console.error('❌ Could not find insertion point in database file');
  }
}

// Get year from command line
const year = process.argv[2];

if (!year) {
  console.error('Usage: node scripts/create-new-year.js <year>');
  console.error('Example: node scripts/create-new-year.js 2026');
  process.exit(1);
}

createNewYear(year).catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
