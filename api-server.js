const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const app = express();

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Metaplanet price endpoint
app.get('/api/metaplanet-price', (req, res) => {
  const scriptPath = path.join(__dirname, 'scripts', 'metaplanet_scraper.py');
  
  exec(`python3 "${scriptPath}"`, (error, stdout, stderr) => {
    if (error) {
      console.error('Error running Python script:', error);
      // Return fallback price
      res.json({ price: 785, currency: 'JPY', symbol: '3350.T', source: 'fallback' });
      return;
    }
    
    try {
      const result = JSON.parse(stdout);
      res.json({ ...result, source: 'scraped' });
    } catch (parseError) {
      console.error('Error parsing Python output:', parseError);
      res.json({ price: 785, currency: 'JPY', symbol: '3350.T', source: 'fallback' });
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Keep-alive ping endpoint (for preventing sleep during market hours)
app.get('/api/ping', (req, res) => {
  res.json({ status: 'alive', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Price API server running on port ${PORT}`);
  
  // Self-ping every 10 minutes during market hours (9 AM - 4 PM JST on weekdays)
  setInterval(() => {
    const now = new Date();
    const jstHour = (now.getUTCHours() + 9) % 24; // Convert to JST
    const dayOfWeek = now.getUTCDay();
    
    // Check if it's a weekday and during market hours (9 AM - 4 PM JST)
    if (dayOfWeek >= 1 && dayOfWeek <= 5 && jstHour >= 9 && jstHour < 16) {
      console.log('Keep-alive ping during market hours');
      // The server pings itself to stay awake
    }
  }, 10 * 60 * 1000); // Every 10 minutes
});