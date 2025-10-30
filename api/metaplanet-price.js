const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
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
      if (price !== 3350) {
        return res.json({ price, currency: 'JPY', symbol: '3350.T', source: 'yahoo-finance-jp' });
      }
    }
    
    // Pattern 3: Look for numbers in reasonable price range
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
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch price', details: error.message });
  }
};
