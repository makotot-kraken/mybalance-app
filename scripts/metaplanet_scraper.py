#!/usr/bin/env python3
"""
Metaplanet (3350.T) stock price scraper
Scrapes price from Yahoo Finance Japan since no direct API is available
"""

import requests
import json
import re
from datetime import datetime
import time

def fetch_metaplanet_price():
    """
    Fetch Metaplanet stock price from Yahoo Finance Japan
    Returns price in JPY
    """
    try:
        # Yahoo Finance Japan URL for Metaplanet (3350.T)
        url = "https://finance.yahoo.co.jp/quote/3350.T"
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        # Look for the current price in the structured data 
        # Pattern 1: Look for the price in JSON structure - "price":"487"
        json_price_pattern = r'"price":"(\d{3,4})"'
        json_match = re.search(json_price_pattern, response.text)
        
        if json_match:
            price = float(json_match.group(1))
            return price
        
        # Pattern 2: Look for price in the main price display structure
        # <span class="StyledNumber__value__3rXW">487</span>
        price_value_pattern = r'StyledNumber__value__3rXW">(\d{3,4})</span>'
        price_value_matches = re.findall(price_value_pattern, response.text)
        
        for price_str in price_value_matches:
            try:
                price = float(price_str)
                # Skip the stock symbol number itself
                if price == 3350:
                    continue
                return price
            except ValueError:
                continue
        
        # Pattern 3: Look for price in the window.__PRELOADED_STATE__
        preloaded_pattern = r'"price":"(\d{3,4})"'
        preloaded_matches = re.findall(preloaded_pattern, response.text)
        
        for price_str in preloaded_matches:
            try:
                price = float(price_str)
                if price == 3350:  # Skip symbol
                    continue
                return price
            except ValueError:
                continue
                
        # If no pattern matches, return None to use fallback
        return None
        
    except requests.RequestException as e:
        return None
    except Exception as e:
        return None

def get_cached_price():
    """Get cached price if available and recent"""
    try:
        with open('/tmp/metaplanet_price.json', 'r') as f:
            data = json.load(f)
            timestamp = data.get('timestamp', 0)
            # Use cache if less than 5 minutes old
            if time.time() - timestamp < 300:
                return data.get('price')
    except:
        pass
    return None

def cache_price(price):
    """Cache the price with timestamp"""
    try:
        data = {
            'price': price,
            'timestamp': time.time(),
            'updated': datetime.now().isoformat()
        }
        with open('/tmp/metaplanet_price.json', 'w') as f:
            json.dump(data, f)
    except Exception as e:
        print(f"Error caching price: {e}")

def main():
    """Main function to fetch and return Metaplanet price"""
    # Check cache first
    cached_price = get_cached_price()
    if cached_price:
        return cached_price
    
    # Fetch new price from Yahoo Finance
    price = fetch_metaplanet_price()
    
    if price:
        cache_price(price)
        return price
    else:
        # Return None to indicate failure - no fallback
        return None

if __name__ == "__main__":
    price = main()
    if price:
        print(json.dumps({"price": price, "currency": "JPY", "symbol": "3350.T"}))
    else:
        print(json.dumps({"error": "Failed to fetch price", "symbol": "3350.T"}))