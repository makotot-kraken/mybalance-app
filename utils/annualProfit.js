// utils/annualProfit.js
// Calculate annual profit percentages from portfolio history
// Accounts for capital additions/withdrawals

import { getCapitalAddedInYear } from '../data/capital-tracking';

export function calculateAnnualProfits(history, currentHoldingsGain = null, currentBalance = null) {
  // Group entries by year
  const years = {};
  for (const entry of history) {
    const year = entry.date.slice(0, 4);
    if (!years[year]) years[year] = [];
    years[year].push(entry);
  }
  
  // Calculate profit for each year accounting for capital additions
  const result = [];
  const sortedYears = Object.keys(years).sort();
  
  for (let i = 0; i < sortedYears.length; i++) {
    const year = sortedYears[i];
    const entries = years[year];
    
    if (entries.length === 0) continue;
    
    // Filter out entries with null totalValue
    const validEntries = entries.filter(entry => entry.totalValue !== null);
    
    if (validEntries.length === 0) continue;
    
    const startValue = validEntries[0].totalValue;
    const endValue = validEntries[validEntries.length - 1].totalValue;
    
    if (!startValue || !endValue) continue;
    
    // Hardcoded values for 2025
    if (year === '2025') {
      const endValue2025 = currentBalance || endValue; // Use current balance as end value
      const actualProfit2025 = currentHoldingsGain || 0; // Use total holdings gain as actual profit
      const returnPercent2025 = endValue2025 > 0 ? (actualProfit2025 / endValue2025) * 100 : 0;
      
      result.push({
        year,
        startValue,
        endValue: endValue2025,
        capitalAdded: 0,
        actualProfit: actualProfit2025,
        returnPercent: parseFloat(returnPercent2025.toFixed(2))
      });
      continue;
    }
    
    // For future years (2026+)
    const capitalAdded = getCapitalAddedInYear(year, false);
    
    // Calculate actual profit (excluding capital additions)
    const actualProfit = endValue - startValue - capitalAdded;
    
    // Calculate return % based on average capital deployed
    // Average capital = start + (capital added / 2) - approximates time-weighted return
    const avgCapital = startValue + (capitalAdded / 2);
    const returnPercent = avgCapital > 0 ? (actualProfit / avgCapital) * 100 : 0;
    
    result.push({
      year,
      startValue,
      endValue,
      capitalAdded,
      actualProfit,
      returnPercent: parseFloat(returnPercent.toFixed(2))
    });
  }
  
  return result;
}
