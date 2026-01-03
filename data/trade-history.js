// Manual Trade Log
// Simple log of all portfolio transactions
// Update this file whenever you make a transaction

export const tradeHistory = [
  // Example entry format:
  // {
  //   date: '2025-12-15',
  //   type: 'buy',      // 'buy' or 'sell'
  //   symbol: 'TSLA',
  //   shares: 10,
  //   price: 250.50,    // USD per share
  //   total: 2505,      // USD (shares × price)
  //   note: 'Bought Tesla shares'
  // },
];

// Helper to add a new trade
export function logTrade(date, type, symbol, shares, price, note = '') {
  const total = shares * price;
  
  tradeHistory.push({
    date,
    type,
    symbol,
    shares,
    price,
    total,
    note: note || `${type === 'buy' ? 'Bought' : 'Sold'} ${shares} shares of ${symbol}`
  });
  
  console.log(`Trade logged: ${type} ${shares} ${symbol} @ $${price}`);
  return tradeHistory[tradeHistory.length - 1];
}
