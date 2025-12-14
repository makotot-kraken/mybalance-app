// utils/annualProfit.js
// Calculate annual profit percentages from portfolio history
// Accounts for capital additions/withdrawals

import { getCapitalAddedInYear } from '../data/capital-tracking';

export function calculateAnnualProfits(history, currentHoldingsGain = null) {
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
  const currentYear = new Date().getFullYear().toString();
  
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
    
    // Special handling for first year (2025) and current year
    const isStartYear = i === 0;
    const isCurrentYear = year === currentYear;
    
    // For 2025, use current holdings gain ONLY if we're still in 2025
    // Once 2025 ends, lock to the final snapshot value
    const isStillIn2025 = isStartYear && isCurrentYear && currentHoldingsGain !== null;
    
    if (isStillIn2025) {
      // For 2025 while still in 2025, use the total gain/loss from all holdings
      const actualProfit = currentHoldingsGain;
      const returnPercent = startValue > 0 ? (actualProfit / startValue) * 100 : 0;
      
      result.push({
        year,
        startValue,
        endValue,
        capitalAdded: 0,
        actualProfit,
        returnPercent: parseFloat(returnPercent.toFixed(2))
      });
    } else if (isStartYear) {
      // For the starting year, all profit is from market gains
      // Initial capital is the starting portfolio value
      const actualProfit = endValue - startValue;
      const returnPercent = startValue > 0 ? (actualProfit / startValue) * 100 : 0;
      
      result.push({
        year,
        startValue,
        endValue,
        capitalAdded: 0,
        actualProfit,
        returnPercent: parseFloat(returnPercent.toFixed(2))
      });
    } else {
      // For subsequent years, account for capital additions
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
  }
  
  return result;
}
