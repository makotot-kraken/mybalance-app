const express = require('express');
const app = express();

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Metaplanet price endpoint - scrapes Yahoo Finance Japan
app.get('/api/metaplanet-price', async (req, res) => {
  try {
    const fetch = require('node-fetch');
    
    const response = await fetch('https://finance.yahoo.co.jp/quote/3350.T', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const html = await response.text();
    
    // Try multiple patterns to extract price
    // Pattern 1: "price":"487"
    let match = html.match(/"price":"(\d{3,4})"/);
    if (match) {
      const price = parseFloat(match[1]);
      return res.json({ price, currency: 'JPY', symbol: '3350.T', source: 'yahoo-finance-jp' });
    }
    
    // Pattern 2: StyledNumber__value
    match = html.match(/StyledNumber__value__\w+">(\d{3,4})</);
    if (match) {
      const price = parseFloat(match[1]);
      if (price !== 3350) { // Skip the symbol number
        return res.json({ price, currency: 'JPY', symbol: '3350.T', source: 'yahoo-finance-jp' });
      }
    }
    
    // Pattern 3: Look for all numbers and find the price
    const numbers = html.match(/\d{3,4}/g);
    if (numbers) {
      for (const num of numbers) {
        const price = parseFloat(num);
        if (price >= 400 && price <= 1000 && price !== 3350) {
          return res.json({ price, currency: 'JPY', symbol: '3350.T', source: 'yahoo-finance-jp' });
        }
      }
    }
    
    res.status(500).json({ error: 'Could not extract price from Yahoo Finance' });
  } catch (error) {
    console.error('Error scraping Metaplanet price:', error);
    res.status(500).json({ error: 'Failed to fetch price', details: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Price proxy server running on port ${PORT}`);
});
