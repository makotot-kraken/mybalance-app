// Trade log to track all purchases and sales
// Used to calculate capital additions for annual performance tracking

export const trades = [
  // Example trade format:
  // {
  //   date: '2025-12-06',
  //   type: 'buy',  // or 'sell'
  //   symbol: 'RKLB',
  //   shares: 54,
  //   pricePerShare: 40.69,  // USD
  //   totalCost: 2197.26,    // USD (shares * pricePerShare)
  //   exchangeRate: 155.37,
  //   totalCostJPY: 341243,  // JPY (totalCost * exchangeRate)
  //   capitalChange: 341243, // JPY added to portfolio
  //   note: 'Bought Rocket Lab shares'
  // },
];

// Calculate total capital from trades up to a specific date
export function getCapitalFromTrades(targetDate) {
  const target = new Date(targetDate);
  let totalCapital = 0;
  
  for (const trade of trades) {
    const tradeDate = new Date(trade.date);
    if (tradeDate <= target) {
      if (trade.type === 'buy') {
        totalCapital += trade.capitalChange || trade.totalCostJPY;
      } else if (trade.type === 'sell') {
        totalCapital -= Math.abs(trade.capitalChange || trade.totalCostJPY);
      }
    }
  }
  
  return totalCapital;
}

// Get all trades for a specific year
export function getTradesForYear(year) {
  return trades.filter(trade => trade.date.startsWith(year));
}

// Add a new trade
export function addTrade(trade) {
  trades.push(trade);
  return trades;
}
