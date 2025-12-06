// Daily Portfolio Snapshot Script
// Fetches current prices and saves historical data

const fs = require('fs').promises;
const path = require('path');

// Portfolio data
const portfolio = {
  crypto: [
    {
      symbol: 'BTCUSDT',
      name: 'Bitcoin',
      amount: 0.03639155,
      exchange: 'BINANCE',
    },
  ],
  stocks: [
    {
      symbol: 'TSLA',
      name: 'Tesla',
      shares: 55.2131,
      exchange: 'NASDAQ',
    },
    {
      symbol: 'NVDA',
      name: 'NVIDIA',
      shares: 58,
      exchange: 'NASDAQ',
    },
    {
      symbol: 'CRWV',
      name: 'CrowdStrike',
      shares: 43,
      exchange: 'NASDAQ',
    },
    {
      symbol: 'GOOGL',
      name: 'Google',
      shares: 14,
      exchange: 'NASDAQ',
    },
    {
      symbol: 'NFLX',
      name: 'Netflix',
      shares: 30,
      exchange: 'NASDAQ',
    },
    {
      symbol: 'TTWO',
      name: 'Take-Two Interactive',
      shares: 8,
      exchange: 'NASDAQ',
    },
    {
      symbol: 'PYPL',
      name: 'PayPal',
      shares: 28,
      exchange: 'NASDAQ',
    },
    {
      symbol: 'RXRX',
      name: 'Recursion Pharmaceuticals',
      shares: 172,
      exchange: 'NASDAQ',
    },
    {
      symbol: 'RKLB',
      name: 'Rocket Lab',
      shares: 54,
      exchange: 'NASDAQ',
    },
    {
      symbol: '3350.T',
      name: 'Metaplanet',
      shares: 1400,
      exchange: 'JPX',
      country: 'Japan',
    },
  ],
};

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || 'd3l0u2pr01qp3ucpv4d0d3l0u2pr01qp3ucpv4dg';
const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY || '382cbb49fde847459dc8816de78bd3a7';

async function fetchWithTimeout(url, timeout = 30000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function fetchExchangeRate() {
  try {
    const response = await fetchWithTimeout(
      `https://api.twelvedata.com/price?symbol=USD/JPY&apikey=${TWELVE_DATA_API_KEY}`
    );
    const data = await response.json();
    if (data && data.price) {
      return parseFloat(data.price);
    }
  } catch (error) {
    console.error('Exchange rate fetch failed:', error);
  }
  return 150; // Fallback
}

async function fetchCryptoPrice() {
  try {
    const response = await fetchWithTimeout('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
    const data = await response.json();
    return parseFloat(data.price);
  } catch (error) {
    console.error('Crypto price fetch failed:', error);
    return 0;
  }
}

async function fetchStockPrice(symbol) {
  try {
    const response = await fetchWithTimeout(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
    );
    const data = await response.json();
    if (data && data.c && typeof data.c === 'number') {
      return data.c;
    }
  } catch (error) {
    console.error(`Stock price fetch failed for ${symbol}:`, error);
  }
  return 0;
}

async function fetchMetaplanetPrice() {
  try {
    const response = await fetchWithTimeout('https://mybalance-app.onrender.com/api/metaplanet-price');
    const data = await response.json();
    if (data && data.price) {
      return data.price;
    }
  } catch (error) {
    console.error('Metaplanet price fetch failed:', error);
  }
  return 0;
}

async function createSnapshot() {
  console.log('Starting daily snapshot...');
  
  // Fetch exchange rate
  const usdToJpy = await fetchExchangeRate();
  console.log(`USD/JPY rate: ${usdToJpy}`);
  
  // Fetch crypto prices
  const btcUsd = await fetchCryptoPrice();
  const btcJpy = btcUsd * usdToJpy;
  const cryptoValue = portfolio.crypto[0].amount * btcJpy;
  console.log(`BTC price: $${btcUsd} (¥${btcJpy})`);
  console.log(`Crypto total: ¥${cryptoValue}`);
  
  // Fetch stock prices
  let stockValue = 0;
  const stockSymbols = ['TSLA', 'NVDA', 'CRWV', 'GOOGL', 'NFLX', 'TTWO', 'PYPL', 'RXRX', 'RKLB'];
  
  for (const stock of portfolio.stocks) {
    if (stock.symbol === '3350.T') {
      // Metaplanet
      const price = await fetchMetaplanetPrice();
      stockValue += stock.shares * price;
      console.log(`${stock.symbol}: ¥${price} x ${stock.shares} = ¥${stock.shares * price}`);
    } else if (stockSymbols.includes(stock.symbol)) {
      // US stocks
      const priceUsd = await fetchStockPrice(stock.symbol);
      const priceJpy = priceUsd * usdToJpy;
      stockValue += stock.shares * priceJpy;
      console.log(`${stock.symbol}: $${priceUsd} (¥${priceJpy}) x ${stock.shares} = ¥${stock.shares * priceJpy}`);
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log(`Stock total: ¥${stockValue}`);
  
  const totalValue = stockValue + cryptoValue;
  console.log(`Total portfolio: ¥${totalValue}`);
  
  // Create snapshot object
  const snapshot = {
    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    timestamp: new Date().toISOString(),
    stockValue: Math.round(stockValue),
    cryptoValue: Math.round(cryptoValue),
    totalValue: Math.round(totalValue),
    exchangeRate: usdToJpy,
  };
  
  // Read existing history
  const historyPath = path.join(__dirname, '..', 'data', 'portfolio-history.json');
  let history = [];
  
  try {
    const existingData = await fs.readFile(historyPath, 'utf-8');
    history = JSON.parse(existingData);
  } catch (error) {
    console.log('No existing history found, creating new file');
  }
  
  // Check if snapshot for today already exists
  const today = snapshot.date;
  const existingIndex = history.findIndex(s => s.date === today);
  
  if (existingIndex >= 0) {
    // Update existing snapshot
    history[existingIndex] = snapshot;
    console.log('Updated existing snapshot for today');
  } else {
    // Add new snapshot
    history.push(snapshot);
    console.log('Added new snapshot');
  }
  
  // Keep only last 365 days
  if (history.length > 365) {
    history = history.slice(-365);
  }
  
  // Save history
  await fs.writeFile(historyPath, JSON.stringify(history, null, 2));
  console.log(`Snapshot saved to ${historyPath}`);
  console.log(`Total snapshots in history: ${history.length}`);
}

// Run the snapshot
createSnapshot().catch(error => {
  console.error('Error creating snapshot:', error);
  process.exit(1);
});
