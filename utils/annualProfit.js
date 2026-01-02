// utils/annualProfit.js
// Calculate annual profit percentages from portfolio history
// Uses annual-performance-db.js for accurate yearly calculations

import { getCapitalAddedInYear } from '../data/capital-tracking';
import { annualPerformanceData } from '../data/annual-performance-db';

export function calculateAnnualProfits(history, currentHoldingsGain = null, currentBalance = null) {
  // Group entries by year
  const years = {};
  for (const entry of history) {
    const year = entry.date.slice(0, 4);
    if (!years[year]) years[year] = [];
    years[year].push(entry);
  }
  
  // Calculate profit for each year
  const result = [];
  const sortedYears = Object.keys(years).sort();
  
  for (let i = 0; i < sortedYears.length; i++) {
    const year = sortedYears[i];
    const entries = years[year];
    
    if (entries.length === 0) continue;
    
    // Check if year exists in database
    const dbData = annualPerformanceData[year];
    
    if (dbData) {
      // Use database values for this year
      const endValue = year === '2025' && currentBalance ? currentBalance : (dbData.endValue || entries.filter(e => e.totalValue !== null).slice(-1)[0]?.totalValue);
      const actualProfit = year === '2025' && currentHoldingsGain !== null ? currentHoldingsGain : dbData.actualProfit;
      
      let returnPercent = 0;
      if (dbData.calculationMethod === 'hardcoded' && year === '2025') {
        // For 2025: return = profit / end value
        returnPercent = endValue > 0 ? (actualProfit / endValue) * 100 : 0;
      } else if (actualProfit !== null) {
        // For other years: use database value or calculate
        if (dbData.returnPercent !== null) {
          returnPercent = dbData.returnPercent;
        } else {
          const avgCapital = dbData.startValue + (dbData.netCapitalChange / 2);
          returnPercent = avgCapital > 0 ? (actualProfit / avgCapital) * 100 : 0;
        }
      }
      
      result.push({
        year,
        startValue: dbData.startValue,
        endValue: endValue,
        capitalAdded: dbData.capitalAdded,
        actualProfit: actualProfit,
        returnPercent: parseFloat(returnPercent.toFixed(2))
      });
      
    } else {
      // Fallback: calculate from history if not in database
      const validEntries = entries.filter(entry => entry.totalValue !== null);
      if (validEntries.length === 0) continue;
      
      const startValue = validEntries[0].totalValue;
      const endValue = validEntries[validEntries.length - 1].totalValue;
      
      if (!startValue || !endValue) continue;
      
      const capitalAdded = getCapitalAddedInYear(year, false);
      const actualProfit = endValue - startValue - capitalAdded;
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
