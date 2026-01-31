// Annual performance database
// This file captures all key data points for each year's performance calculation
// Add a new entry at the end of each year with the final values

export const annualPerformanceData = {
  // Year 2025 - Starting year
  "2025": {
    startDate: "2025-11-12",  // First tracking date
    endDate: "2025-12-31",     // Last day of year
    
    // Portfolio values (JPY)
    startValue: 9143568,       // Nov 12, 2025 - Initial portfolio value
    endValue: 9057170,         // Dec 31, 2025 snapshot value
    currentBalance: null,      // Live value - updated real-time in app
    
    // Performance metrics
    actualProfit: null,        // Total gain/loss from all holdings
    returnPercent: null,       // (actualProfit / endValue) * 100
    
    // Capital tracking
    capitalAdded: 0,           // No additional capital in 2025 (starting year)
    capitalWithdrawn: 0,       // No withdrawals in 2025
    netCapitalChange: 0,       // capitalAdded - capitalWithdrawn
    
    // Holdings breakdown
    stocksProfit: null,        // Total profit from stock holdings
    cryptoProfit: null,        // Total profit from crypto holdings
    
    // Notes
    notes: "Starting year - Nov 12 to Dec 31, 2025. First portfolio tracking period.",
    
    // Calculation method
    calculationMethod: "hardcoded", // "hardcoded" or "automatic"
    formula: "returnPercent = (actualProfit / endValue) * 100"
  },

  // Year 2026
  "2026": {
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    
    // Portfolio values (JPY)
    startValue: 9057170,       // 2025 end value (Dec 31, 2025)
    endValue: null,            // Will be set to Dec 31 snapshot value
    currentBalance: null,      // Live value - updated real-time in app
    
    // Performance metrics
    actualProfit: null,        // endValue - startValue - capitalAdded
    returnPercent: null,       // (actualProfit / avgCapital) * 100
    
    // Capital tracking
    capitalAdded: 0,           // Total capital added in 2026
    capitalWithdrawn: 0,       // Total withdrawals in 2026
    netCapitalChange: 0,       // capitalAdded - capitalWithdrawn
    
    // Holdings breakdown
    stocksProfit: null,        // Total profit from stock holdings
    cryptoProfit: null,        // Total profit from crypto holdings
    
    // Notes
    notes: "Full year tracking - Jan 1 to Dec 31, 2026",
    
    // Calculation method
    calculationMethod: "automatic",
    formula: "returnPercent = (actualProfit / avgCapital) * 100, where avgCapital = startValue + (capitalAdded / 2)"
  },
  
  // Template for future years
  // "2026": {
  //   startDate: "2026-01-01",
  //   endDate: "2026-12-31",
  //   startValue: null,        // Dec 31, 2025 value (= 2025.endValue)
  //   endValue: null,          // Dec 31, 2026 value
  //   currentBalance: null,    // Live value during 2026
  //   actualProfit: null,      // endValue - startValue - capitalAdded
  //   returnPercent: null,     // (actualProfit / avgCapital) * 100
  //   capitalAdded: 0,         // Total capital added in 2026
  //   capitalWithdrawn: 0,     // Total capital withdrawn in 2026
  //   netCapitalChange: 0,     // capitalAdded - capitalWithdrawn
  //   stocksProfit: null,
  //   cryptoProfit: null,
  //   notes: "",
  //   calculationMethod: "automatic",
  //   formula: "returnPercent = (actualProfit / avgCapital) * 100, where avgCapital = startValue + (capitalAdded / 2)"
  // }
};

// Helper function to get data for a specific year
export function getYearData(year) {
  return annualPerformanceData[year] || null;
}

// Helper function to update year data
export function updateYearData(year, updates) {
  if (!annualPerformanceData[year]) {
    console.error(`Year ${year} not found in database`);
    return false;
  }
  
  annualPerformanceData[year] = {
    ...annualPerformanceData[year],
    ...updates
  };
  
  return true;
}

// Helper function to add a new year
export function addNewYear(year, data) {
  if (annualPerformanceData[year]) {
    console.warn(`Year ${year} already exists. Use updateYearData to modify.`);
    return false;
  }
  
  // Get previous year's end value as this year's start value
  const prevYear = (parseInt(year) - 1).toString();
  const prevYearData = annualPerformanceData[prevYear];
  
  const defaultData = {
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`,
    startValue: prevYearData?.endValue || null,
    endValue: null,
    currentBalance: null,
    actualProfit: null,
    returnPercent: null,
    capitalAdded: 0,
    capitalWithdrawn: 0,
    netCapitalChange: 0,
    stocksProfit: null,
    cryptoProfit: null,
    notes: "",
    calculationMethod: "automatic",
    formula: "returnPercent = (actualProfit / avgCapital) * 100, where avgCapital = startValue + (capitalAdded / 2)"
  };
  
  annualPerformanceData[year] = {
    ...defaultData,
    ...data
  };
  
  return true;
}

// Helper function to calculate performance for a year
export function calculateYearPerformance(year) {
  const data = annualPerformanceData[year];
  if (!data) return null;
  
  // For hardcoded years, return as-is
  if (data.calculationMethod === "hardcoded") {
    return {
      year,
      ...data
    };
  }
  
  // For automatic calculation
  const { startValue, endValue, capitalAdded, capitalWithdrawn } = data;
  
  if (startValue === null || endValue === null) {
    return null; // Not enough data
  }
  
  const netCapitalChange = capitalAdded - capitalWithdrawn;
  const actualProfit = endValue - startValue - netCapitalChange;
  
  // Calculate return based on average capital
  const avgCapital = startValue + (netCapitalChange / 2);
  const returnPercent = avgCapital > 0 ? (actualProfit / avgCapital) * 100 : 0;
  
  return {
    year,
    startValue,
    endValue,
    capitalAdded,
    capitalWithdrawn,
    netCapitalChange,
    actualProfit,
    returnPercent: parseFloat(returnPercent.toFixed(2)),
    stocksProfit: data.stocksProfit,
    cryptoProfit: data.cryptoProfit,
    notes: data.notes
  };
}

// Get all years with complete data
export function getAllYearsPerformance() {
  return Object.keys(annualPerformanceData)
    .sort()
    .map(year => calculateYearPerformance(year))
    .filter(data => data !== null);
}
