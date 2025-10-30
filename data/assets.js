import { API_CONFIG } from '../config/api';

// Your actual portfolio holdings
export const portfolio = {
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
      symbol: 'AAPL',
      name: 'Apple',
      shares: 16,
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
      shares: 3,
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
      symbol: '3350.T',
      name: 'Metaplanet',
      shares: 1400,
      exchange: 'JPX',
      country: 'Japan',
    },
  ],
};

// Cache for price data
let priceCache = {};
let lastFetchTime = 0;
const CACHE_DURATION = 60000; // 1 minute cache

// Cache for exchange rate
let exchangeRateCache = {};
let lastExchangeRateFetch = 0;
const EXCHANGE_RATE_CACHE_DURATION = 600000; // 10 minutes cache

// API Configuration
const FINNHUB_API_KEY = 'd3l0u2pr01qp3ucpv4d0d3l0u2pr01qp3ucpv4dg';
const TWELVE_DATA_API_KEY = '382cbb49fde847459dc8816de78bd3a7';

// Function to fetch USD/JPY exchange rate
export const fetchExchangeRate = async () => {
  const now = Date.now();
  if (now - lastExchangeRateFetch < EXCHANGE_RATE_CACHE_DURATION && exchangeRateCache.USDJPY) {
    return exchangeRateCache.USDJPY;
  }

  try {
    // Using Twelve Data API for exchange rate
    const response = await fetch(`https://api.twelvedata.com/price?symbol=USD/JPY&apikey=${TWELVE_DATA_API_KEY}`);
    const data = await response.json();
    
    if (data && data.price) {
      const rate = parseFloat(data.price);
      exchangeRateCache.USDJPY = rate;
      lastExchangeRateFetch = now;
      console.log(`Updated USD/JPY rate: ${rate}`);
      return rate;
    } else {
      throw new Error('Invalid exchange rate data');
    }
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    // Fallback rate if API fails
    return exchangeRateCache.USDJPY || 150; // Reasonable fallback
  }
};

// Function to fetch real-time prices (converted to JPY)
export const fetchRealTimePrices = async () => {
  const now = Date.now();
  if (now - lastFetchTime < CACHE_DURATION && Object.keys(priceCache).length > 0) {
    return priceCache;
  }

  try {
    const prices = {};
    
    // Fetch exchange rate first
    const usdToJpy = await fetchExchangeRate();
    
    // Fetch crypto prices from Binance API and convert to JPY
    try {
      const cryptoResponse = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
      const cryptoData = await cryptoResponse.json();
      const btcUsd = parseFloat(cryptoData.price);
      prices['BTCUSDT'] = btcUsd * usdToJpy; // Convert to JPY
    } catch (error) {
      console.error('Crypto price fetch failed:', error);
      // No fallback - let it show as 0 or error
    }

    // Fetch US stock prices using Finnhub API
    const stockSymbols = ['TSLA', 'NVDA', 'AAPL', 'GOOGL', 'NFLX', 'TTWO', 'PYPL', 'RXRX'];
    
    const stockPromises = stockSymbols.map(async (symbol) => {
      try {
        const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
        const data = await response.json();
        if (data && data.c && typeof data.c === 'number') {
          prices[symbol] = data.c * usdToJpy; // Convert USD to JPY
        } else {
          throw new Error(`Invalid data for ${symbol}`);
        }
      } catch (error) {
        console.error(`Failed to fetch ${symbol} from Finnhub:`, error);
        // No fallback - let it show as 0 or error
      }
    });

    await Promise.all(stockPromises);

    // For Metaplanet, fetch from our API server
    try {
      console.log('[JPY Prices] Fetching Metaplanet price from API...');
      const metaplanetResponse = await fetch(API_CONFIG.METAPLANET_API_URL);
      console.log('[JPY Prices] Metaplanet response status:', metaplanetResponse.status);
      const metaplanetData = await metaplanetResponse.json();
      console.log('[JPY Prices] Metaplanet data received:', metaplanetData);
      if (metaplanetData && metaplanetData.price) {
        prices['3350.T'] = metaplanetData.price;
        console.log('[JPY Prices] Metaplanet price set to:', metaplanetData.price);
      } else if (metaplanetData && metaplanetData.error) {
        console.error('[JPY Prices] Metaplanet API returned error:', metaplanetData.error);
      } else {
        console.warn('[JPY Prices] Metaplanet data has no price:', metaplanetData);
      }
    } catch (error) {
      console.error('[JPY Prices] Metaplanet API failed:', error);
    }

    priceCache = prices;
    lastFetchTime = now;
    return prices;

  } catch (error) {
    console.error('Error fetching prices:', error);
    return {};  // Return empty object - no fallbacks
  }
};

// Function to fetch real-time prices in original USD (for display purposes)
export const fetchUSDPrices = async () => {
  try {
    const prices = {};
    
    // Fetch crypto prices from Binance API (keep in USD)
    try {
      const cryptoResponse = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
      const cryptoData = await cryptoResponse.json();
      prices['BTCUSDT'] = parseFloat(cryptoData.price);
    } catch (error) {
      console.error('Crypto price fetch failed:', error);
      // No fallback
    }

    // Fetch US stock prices using Finnhub API (keep in USD)
    const stockSymbols = ['TSLA', 'NVDA', 'AAPL', 'GOOGL', 'NFLX', 'TTWO', 'PYPL', 'RXRX'];
    
    const stockPromises = stockSymbols.map(async (symbol) => {
      try {
        const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
        const data = await response.json();
        if (data && data.c && typeof data.c === 'number') {
          prices[symbol] = data.c; // Keep in USD
        } else {
          throw new Error(`Invalid data for ${symbol}`);
        }
      } catch (error) {
        console.error(`Failed to fetch ${symbol} from Finnhub:`, error);
        // No fallback
      }
    });

    await Promise.all(stockPromises);

    // For Metaplanet, fetch from our API server (already in JPY)
    try {
      console.log('[USD Prices] Fetching Metaplanet price from API...');
      const metaplanetResponse = await fetch(API_CONFIG.METAPLANET_API_URL);
      console.log('[USD Prices] Metaplanet response status:', metaplanetResponse.status);
      const metaplanetData = await metaplanetResponse.json();
      console.log('[USD Prices] Metaplanet data received:', metaplanetData);
      if (metaplanetData && metaplanetData.price) {
        prices['3350.T'] = metaplanetData.price; // Already in JPY
        console.log('[USD Prices] Metaplanet price set to:', metaplanetData.price);
      } else if (metaplanetData && metaplanetData.error) {
        console.error('[USD Prices] Metaplanet API returned error:', metaplanetData.error);
      } else {
        console.warn('[USD Prices] Metaplanet data has no price:', metaplanetData);
      }
    } catch (error) {
      console.error('[USD Prices] Metaplanet API failed:', error);
    }

    return prices;

  } catch (error) {
    console.error('Error fetching USD prices:', error);
    return {};  // Return empty object - no fallbacks
  }
};

// Calculate individual holding values
export const calculateHoldingValue = (holding, price, type = 'stock') => {
  if (type === 'crypto') {
    return holding.amount * price;
  }
  return holding.shares * price;
};

// Calculate total portfolio value
export const calculateTotalPortfolioValue = async () => {
  const prices = await fetchRealTimePrices();
  
  let totalValue = 0;
  
  // Calculate crypto value
  portfolio.crypto.forEach(crypto => {
    const price = prices[crypto.symbol] || 0;
    totalValue += calculateHoldingValue(crypto, price, 'crypto');
  });
  
  // Calculate stock value
  portfolio.stocks.forEach(stock => {
    const price = prices[stock.symbol] || 0;
    totalValue += calculateHoldingValue(stock, price, 'stock');
  });
  
  return totalValue;
};

// Calculate gains/losses using actual purchase costs (converted to JPY)
export const calculateGainLoss = async (holding, currentPrice, type = 'stock') => {
  // Get current exchange rate for conversion
  const usdToJpy = await fetchExchangeRate();
  
  // Your actual average purchase costs (in original currency)
  const actualAvgCostsOriginal = {
    'BTCUSDT': 16487344,      // JPY - ¥600,000 total / 0.03639155 BTC = ¥16,487,344 per BTC
    'TSLA': 289.82,           // USD - (288.48*48+298.7*7.2131)/55.2131
    'NVDA': 116.35,           // USD - Your actual cost
    'AAPL': 255.31,           // USD - (227.05*4+264.73*12)/16
    'GOOGL': 160.31,          // USD - Your corrected actual cost
    'NFLX': 335.09,           // USD - Your actual cost
    'TTWO': 108.02,           // USD - Your actual cost
    'PYPL': 71.73,            // USD - Your actual cost
    'RXRX': 5.65,             // USD - Your actual cost
    '3350.T': 946,            // JPY - Your actual cost in JPY
  };
  
  // Convert USD costs to JPY, keep JPY costs as-is
  const avgCostOriginal = actualAvgCostsOriginal[holding.symbol] || currentPrice;
  const avgCostJpy = (holding.symbol === '3350.T' || holding.symbol === 'BTCUSDT') ? 
    avgCostOriginal : avgCostOriginal * usdToJpy;
  const currentValue = calculateHoldingValue(holding, currentPrice, type);
  const originalValue = type === 'crypto' 
    ? holding.amount * avgCostJpy 
    : holding.shares * avgCostJpy;
  
  return currentValue - originalValue;
};

export const calculateGainLossPercentage = async (holding, currentPrice, type = 'stock') => {
  const gainLoss = await calculateGainLoss(holding, currentPrice, type);
  
  // Get current exchange rate for conversion
  const usdToJpy = await fetchExchangeRate();
  
  // Use the same actual average costs (in original currency)
  const actualAvgCostsOriginal = {
    'BTCUSDT': 16487344,      // JPY - ¥600,000 total / 0.03639155 BTC = ¥16,487,344 per BTC
    'TSLA': 289.82,           // USD - (288.48*48+298.7*7.2131)/55.2131
    'NVDA': 116.35,           // USD - Your actual cost
    'AAPL': 255.31,           // USD - (227.05*4+264.73*12)/16
    'GOOGL': 160.31,          // USD - Your corrected actual cost
    'NFLX': 335.09,           // USD - Your actual cost
    'TTWO': 108.02,           // USD - Your actual cost
    'PYPL': 71.73,            // USD - Your actual cost
    'RXRX': 5.65,             // USD - Your actual cost
    '3350.T': 946,            // JPY - Your actual cost in JPY
  };
  
  // Convert USD costs to JPY, keep JPY costs as-is
  const avgCostOriginal = actualAvgCostsOriginal[holding.symbol] || currentPrice;
  const avgCostJpy = (holding.symbol === '3350.T' || holding.symbol === 'BTCUSDT') ? 
    avgCostOriginal : avgCostOriginal * usdToJpy;
  const originalValue = type === 'crypto' 
    ? holding.amount * avgCostJpy 
    : holding.shares * avgCostJpy;
  
  return originalValue > 0 ? (gainLoss / originalValue) * 100 : 0;
};

// Historical data for charts (mock data)
export const stockHistoricalData = {
  TSLA: [
    { x: 1, y: 240 },
    { x: 2, y: 250 },
    { x: 3, y: 235 },
    { x: 4, y: 248 },
    { x: 5, y: 248.50 },
  ],
  NVDA: [
    { x: 1, y: 120 },
    { x: 2, y: 130 },
    { x: 3, y: 140 },
    { x: 4, y: 142 },
    { x: 5, y: 142.20 },
  ],
  AAPL: [
    { x: 1, y: 220 },
    { x: 2, y: 225 },
    { x: 3, y: 228 },
    { x: 4, y: 227 },
    { x: 5, y: 227.50 },
  ],
};

// Future projection data based on your actual portfolio
export const futureProjectionData = [
  { x: 2025, y: 500000 }, // Starting value
  { x: 2026, y: 580000 },
  { x: 2027, y: 670000 },
  { x: 2028, y: 780000 },
  { x: 2029, y: 920000 },
  { x: 2030, y: 1100000 },
];

// Keep-alive function to prevent Render.com from sleeping
let keepAliveInterval = null;

export const startKeepAlive = () => {
  if (keepAliveInterval) return; // Already running
  
  // Ping every 10 minutes to keep server awake
  keepAliveInterval = setInterval(async () => {
    try {
      const pingUrl = API_CONFIG.METAPLANET_API_URL.replace('/api/metaplanet-price', '/api/ping');
      await fetch(pingUrl);
      console.log('[Keep-Alive] Pinged server');
    } catch (error) {
      console.log('[Keep-Alive] Ping failed (server might be sleeping)');
    }
  }, 10 * 60 * 1000); // Every 10 minutes
};

export const stopKeepAlive = () => {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
};