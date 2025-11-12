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

// Persistent storage keys
const STORAGE_KEYS = {
  JPY_PRICES: 'mybalance_jpy_prices',
  USD_PRICES: 'mybalance_usd_prices',
  EXCHANGE_RATE: 'mybalance_exchange_rate',
  LAST_UPDATE: 'mybalance_last_update'
};

// Helper functions for localStorage
const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
  }
};

const loadFromStorage = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.warn('Failed to load from localStorage:', error);
    return null;
  }
};

// Get last update timestamp
export const getLastUpdateTime = () => {
  return loadFromStorage(STORAGE_KEYS.LAST_UPDATE) || null;
};

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
      
      // Save to localStorage for persistent fallback
      saveToStorage(STORAGE_KEYS.EXCHANGE_RATE, { rate, timestamp: now });
      
      console.log(`Updated USD/JPY rate: ${rate}`);
      return rate;
    } else {
      throw new Error('Invalid exchange rate data');
    }
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    
    // Try to get from localStorage first
    const stored = loadFromStorage(STORAGE_KEYS.EXCHANGE_RATE);
    if (stored && stored.rate) {
      console.log('Using stored exchange rate:', stored.rate);
      exchangeRateCache.USDJPY = stored.rate;
      return stored.rate;
    }
    
    // Ultimate fallback rate if nothing is available
    return exchangeRateCache.USDJPY || 150;
  }
};

// Function to fetch real-time prices (converted to JPY)
export const fetchRealTimePrices = async () => {
  const now = Date.now();
  if (now - lastFetchTime < CACHE_DURATION && Object.keys(priceCache).length > 0) {
    return priceCache;
  }

  // Load stored prices as initial fallback
  const storedPrices = loadFromStorage(STORAGE_KEYS.JPY_PRICES);
  let prices = storedPrices?.prices || {};

  try {
    const newPrices = {};
    
    // Fetch exchange rate first
    const usdToJpy = await fetchExchangeRate();
    
    // Fetch crypto prices from Binance API and convert to JPY
    try {
      const cryptoResponse = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
      const cryptoData = await cryptoResponse.json();
      const btcUsd = parseFloat(cryptoData.price);
      if (!isNaN(btcUsd)) {
        newPrices['BTCUSDT'] = btcUsd * usdToJpy; // Convert to JPY
      }
    } catch (error) {
      console.error('Crypto price fetch failed:', error);
      // Keep stored price if available
      if (prices['BTCUSDT']) {
        newPrices['BTCUSDT'] = prices['BTCUSDT'];
      }
    }

    // Fetch US stock prices using Finnhub API
    const stockSymbols = ['TSLA', 'NVDA', 'CRWV', 'GOOGL', 'NFLX', 'TTWO', 'PYPL', 'RXRX'];
    
    const stockPromises = stockSymbols.map(async (symbol) => {
      try {
        const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
        const data = await response.json();
        if (data && data.c && typeof data.c === 'number') {
          newPrices[symbol] = data.c * usdToJpy; // Convert USD to JPY
        } else {
          throw new Error(`Invalid data for ${symbol}`);
        }
      } catch (error) {
        console.error(`Failed to fetch ${symbol} from Finnhub:`, error);
        // Use stored price if available
        if (prices[symbol]) {
          newPrices[symbol] = prices[symbol];
        }
      }
    });

    await Promise.all(stockPromises);

    // For Metaplanet, use proxy server that scrapes Yahoo Finance Japan
    try {
      console.log('[JPY Prices] Fetching Metaplanet price from proxy...');
      // Use Render deployment
      const proxyUrl = 'https://mybalance-app.onrender.com/api/metaplanet-price';
      const metaplanetResponse = await fetch(proxyUrl);
      const metaplanetData = await metaplanetResponse.json();
      
      if (metaplanetData && metaplanetData.price) {
        newPrices['3350.T'] = metaplanetData.price;
        console.log('[JPY Prices] Metaplanet price:', metaplanetData.price);
      } else {
        console.error('[JPY Prices] No price in response:', metaplanetData);
        // Use stored price if available
        if (prices['3350.T']) {
          newPrices['3350.T'] = prices['3350.T'];
        }
      }
    } catch (error) {
      console.error('[JPY Prices] Proxy fetch failed:', error);
      // Use stored price if available
      if (prices['3350.T']) {
        newPrices['3350.T'] = prices['3350.T'];
      }
    }

    // If we got any new prices, update cache and storage
    if (Object.keys(newPrices).length > 0) {
      priceCache = newPrices;
      lastFetchTime = now;
      
      // Save to localStorage with timestamp
      saveToStorage(STORAGE_KEYS.JPY_PRICES, { prices: newPrices, timestamp: now });
      saveToStorage(STORAGE_KEYS.LAST_UPDATE, now);
      
      return newPrices;
    }

    // If no new prices but we have stored prices, use those
    if (Object.keys(prices).length > 0) {
      console.log('Using stored prices from localStorage');
      priceCache = prices;
      return prices;
    }

    return {};

  } catch (error) {
    console.error('Error fetching prices:', error);
    
    // Return stored prices if available
    if (Object.keys(prices).length > 0) {
      console.log('Using stored prices due to error');
      return prices;
    }
    
    return {};
  }
};

// Function to fetch real-time prices in original USD (for display purposes)
export const fetchUSDPrices = async () => {
  // Load stored prices as initial fallback
  const storedPrices = loadFromStorage(STORAGE_KEYS.USD_PRICES);
  let prices = storedPrices?.prices || {};
  
  try {
    const newPrices = {};
    
    // Fetch crypto prices from Binance API (keep in USD)
    try {
      const cryptoResponse = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
      const cryptoData = await cryptoResponse.json();
      const btcUsd = parseFloat(cryptoData.price);
      if (!isNaN(btcUsd)) {
        newPrices['BTCUSDT'] = btcUsd;
      }
    } catch (error) {
      console.error('Crypto price fetch failed:', error);
      // Keep stored price if available
      if (prices['BTCUSDT']) {
        newPrices['BTCUSDT'] = prices['BTCUSDT'];
      }
    }

    // Fetch US stock prices using Finnhub API (keep in USD)
    const stockSymbols = ['TSLA', 'NVDA', 'CRWV', 'GOOGL', 'NFLX', 'TTWO', 'PYPL', 'RXRX'];
    
    const stockPromises = stockSymbols.map(async (symbol) => {
      try {
        const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
        const data = await response.json();
        if (data && data.c && typeof data.c === 'number') {
          newPrices[symbol] = data.c; // Keep in USD
        } else {
          throw new Error(`Invalid data for ${symbol}`);
        }
      } catch (error) {
        console.error(`Failed to fetch ${symbol} from Finnhub:`, error);
        // Use stored price if available
        if (prices[symbol]) {
          newPrices[symbol] = prices[symbol];
        }
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
        newPrices['3350.T'] = metaplanetData.price; // Already in JPY
        console.log('[USD Prices] Metaplanet price set to:', metaplanetData.price);
      } else if (metaplanetData && metaplanetData.error) {
        console.error('[USD Prices] Metaplanet API returned error:', metaplanetData.error);
        // Use stored price if available
        if (prices['3350.T']) {
          newPrices['3350.T'] = prices['3350.T'];
        }
      } else {
        console.warn('[USD Prices] Metaplanet data has no price:', metaplanetData);
        // Use stored price if available
        if (prices['3350.T']) {
          newPrices['3350.T'] = prices['3350.T'];
        }
      }
    } catch (error) {
      console.error('[USD Prices] Metaplanet API failed:', error);
      // Use stored price if available
      if (prices['3350.T']) {
        newPrices['3350.T'] = prices['3350.T'];
      }
    }

    // If we got any new prices, save to storage
    if (Object.keys(newPrices).length > 0) {
      saveToStorage(STORAGE_KEYS.USD_PRICES, { prices: newPrices, timestamp: Date.now() });
      return newPrices;
    }

    // If no new prices but we have stored prices, use those
    if (Object.keys(prices).length > 0) {
      console.log('Using stored USD prices from localStorage');
      return prices;
    }

    return {};

  } catch (error) {
    console.error('Error fetching USD prices:', error);
    
    // Return stored prices if available
    if (Object.keys(prices).length > 0) {
      console.log('Using stored USD prices due to error');
      return prices;
    }
    
    return {};
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
    'CRWV': 106.75,           // USD - Your actual cost
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
    'CRWV': 106.75,           // USD - Your actual cost
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
  CRWV: [
    { x: 1, y: 300 },
    { x: 2, y: 320 },
    { x: 3, y: 310 },
    { x: 4, y: 330 },
    { x: 5, y: 335.50 },
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