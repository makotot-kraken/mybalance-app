// utils/annualProfit.js
// Calculate annual profit percentages from portfolio history
// Accounts for capital additions/withdrawals

import { getCapitalAddedInYear } from '../data/capital-tracking';

export function calculateAnnualProfits(history) {
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
    
    const startValue = entries[0].totalValue;
    const endValue = entries[entries.length - 1].totalValue;
    
    if (!startValue || !endValue) continue;
    
    // Get capital added during this year
    const isStartYear = i === 0;
    const capitalAdded = getCapitalAddedInYear(year, isStartYear);
    
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
