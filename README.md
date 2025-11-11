# MyBalance - Personal Finance Dashboard

A React Native mobile app built with Expo that provides a comprehensive view of your financial portfolio, inspired by Robinhood's sleek design.

## Features

### 📊 Dashboard
- **Total Net Worth Display**: Real-time calculation of all assets
- **Asset Breakdown**: Interactive pie chart showing distribution between cash, stocks, and crypto
- **Portfolio Cards**: Quick overview of each asset class with gains/losses

### 📈 Stocks
- **Holdings List**: All stock positions with current values and performance
- **Gain/Loss Summary**: Track total portfolio performance
- **Stock Detail View**: Individual stock analysis with charts and detailed metrics
- **Interactive Charts**: Historical price data visualization

### ₿ Crypto
- **Crypto Holdings**: Bitcoin and Ethereum positions
- **Market Overview**: Current prices and 24h changes
- **Portfolio Value**: Total crypto holdings value
- **Performance Tracking**: Gains and percentage changes

### 🔮 Future Projection
- **Growth Projections**: 1Y, 3Y, and 5Y portfolio growth estimates
- **Interactive Timeline**: Toggle between different projection periods
- **Growth Assumptions**: Transparent display of calculation parameters
- **Disclaimer**: Risk awareness information

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation (Bottom Tabs + Stack)
- **Charts**: Victory Native for data visualization
- **Styling**: Custom StyleSheet with dark theme
- **State Management**: React built-in state (expandable to Zustand)
- **Icons**: Expo Vector Icons

## Design

- **Dark Theme**: Robinhood-inspired color scheme
  - Primary Background: `#0E1111`
  - Card Background: `#1A1A1A`
  - Accent Green: `#00C853`
  - Text: `#F5F5F5`
- **Components**: Reusable AssetCard, ChartView, and PieChart components
- **Typography**: Clean, readable fonts with proper hierarchy
- **Layout**: Rounded cards with smooth shadows and animations

## Data Structure

The app uses hardcoded data from `data/assets.js`:

```javascript
{
  cash: 800000,
  stocks: [
    { symbol: "CRWV", name: "CrowdStrike", shares: 43, avgPrice: 106.75, currentPrice: 335 },
    { symbol: "TSLA", name: "Tesla", shares: 55.2131, avgPrice: 289.82, currentPrice: 248 },
    { symbol: "NVDA", name: "NVIDIA", shares: 58, avgPrice: 116.35, currentPrice: 142 }
  ],
  crypto: [
    { symbol: "BTC", name: "Bitcoin", amount: 0.3, currentPrice: 6500000 },
    { symbol: "ETH", name: "Ethereum", amount: 1.2, currentPrice: 450000 }
  ]
}
```

## Installation & Setup

1. **Clone the repository**
   ```bash
   cd MyBalance
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npx expo start
   ```

4. **Run on device**
   - Install Expo Go app on your iOS/Android device
   - Scan the QR code from the terminal
   - Or press `i` for iOS simulator, `a` for Android emulator

## Project Structure

```
MyBalance/
├── screens/
│   ├── Dashboard.js         # Main portfolio overview
│   ├── Stocks.js           # Stock holdings list
│   ├── StockDetail.js      # Individual stock analysis
│   ├── Crypto.js           # Crypto holdings
│   └── FutureProjection.js # Growth projections
├── components/
│   ├── AssetCard.js        # Reusable asset display card
│   ├── ChartView.js        # Line/area chart component
│   └── PieChart.js         # Pie chart for asset breakdown
├── data/
│   └── assets.js           # Hardcoded financial data
└── App.js                  # Main navigation setup
```

## Key Features Implemented

✅ **Bottom Tab Navigation** with 4 main screens  
✅ **Stock Detail Navigation** with stack navigation  
✅ **Real-time Calculations** for portfolio values and gains/losses  
✅ **Interactive Charts** with Victory Native  
✅ **Dark Theme** throughout the app  
✅ **Responsive Design** for different screen sizes  
✅ **Smooth Animations** on chart interactions  
✅ **Professional UI/UX** inspired by leading finance apps  

## Future Enhancements

- Real-time data integration with financial APIs
- User authentication and data persistence
- Additional asset classes (bonds, commodities)
- Push notifications for price alerts
- Portfolio rebalancing suggestions
- Social features and investment insights

## License

This project was created as a demonstration of React Native development skills and modern mobile app design patterns.