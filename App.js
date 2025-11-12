import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { 
  portfolio, 
  fetchRealTimePrices, 
  fetchUSDPrices,
  calculateHoldingValue,
  calculateGainLoss,
  calculateGainLossPercentage,
  startKeepAlive,
  stopKeepAlive,
  getLastUpdateTime
} from './data/assets';

// Holding Card Component with gain/loss and percentage indicator
function HoldingCard({ holding, price, displayPrice, currency, value, type, totalCategoryValue }) {
  const [gainLoss, setGainLoss] = useState(null);
  const [gainLossPercent, setGainLossPercent] = useState(null);

  useEffect(() => {
    const calculateGains = async () => {
      if (price > 0) {
        try {
          const gl = await calculateGainLoss(holding, price, type);
          const glp = await calculateGainLossPercentage(holding, price, type);
          setGainLoss(gl);
          setGainLossPercent(glp);
        } catch (error) {
          console.error('Error calculating gain/loss:', error);
        }
      }
    };
    calculateGains();
  }, [price, holding, type]);

  const isPositive = gainLoss && gainLoss >= 0;
  const changeColor = gainLoss === null ? '#888' : isPositive ? '#4CAF50' : '#F44336';

  const displayName = holding.name || holding.symbol;
  const displaySymbol = holding.symbol;
  const displayAmount = type === 'stock' ? `${holding.shares} shares` : `${holding.amount} ${holding.symbol}`;
  
  // Calculate percentage of category
  const percentageOfCategory = totalCategoryValue > 0 ? ((value / totalCategoryValue) * 100) : 0;

  return (
    <View style={styles.holdingCard}>
      <View style={styles.cardLeft}>
        <View style={styles.titleRow}>
          <Text style={styles.cardTitle}>{displaySymbol}</Text>
          <View style={styles.percentageBadge}>
            <Text style={styles.percentageText}>{percentageOfCategory.toFixed(1)}%</Text>
          </View>
        </View>
        <Text style={styles.cardSubtitle}>{displayName}</Text>
        <Text style={styles.cardShares}>
          {displayAmount} @ {displayPrice > 0 ? `${currency}${displayPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}` : 'Loading...'}
        </Text>
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.cardValue}>
          {value > 0 ? `¥${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : 'N/A'}
        </Text>
        <Text style={[styles.cardChange, { color: changeColor }]}>
          {gainLoss !== null ? (
            `${isPositive ? '+' : ''}¥${gainLoss.toLocaleString('en-US', { maximumFractionDigits: 0 })} (${isPositive ? '+' : ''}${gainLossPercent.toFixed(2)}%)`
          ) : 'Calculating...'}
        </Text>
      </View>
      {/* Progress bar showing percentage */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${percentageOfCategory}%` }]} />
      </View>
    </View>
  );
}

export default function App() {
  console.log('[App] Starting MyBalance app...');
  const [refreshing, setRefreshing] = useState(false);
  const [prices, setPrices] = useState({});
  const [usdPrices, setUsdPrices] = useState({});
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [stocksExpanded, setStocksExpanded] = useState(false);
  const [cryptoExpanded, setCryptoExpanded] = useState(false);
  
  const loadPrices = async () => {
    try {
      console.log('[App] Loading prices...');
      const [priceData, usdPriceData] = await Promise.all([
        fetchRealTimePrices(),
        fetchUSDPrices()
      ]);
      setPrices(priceData);
      setUsdPrices(usdPriceData);
      
      // Update last update time from storage or current time
      const storedTime = getLastUpdateTime();
      setLastUpdate(storedTime ? new Date(storedTime) : new Date());
      
      console.log('[App] Prices loaded');
    } catch (error) {
      console.error('[App] Error loading prices:', error);
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await loadPrices();
    setRefreshing(false);
  };
  
  useEffect(() => {
    console.log('[App] Starting keep-alive service');
    startKeepAlive();
    loadPrices();
    
    return () => {
      console.log('[App] Stopping keep-alive service');
      stopKeepAlive();
    };
  }, []);

  // Calculate totals
  const stockValue = portfolio.stocks.reduce((sum, stock) => {
    const price = prices[stock.symbol] || 0;
    return sum + calculateHoldingValue(stock, price, 'stock');
  }, 0);

  const cryptoValue = portfolio.crypto.reduce((sum, crypto) => {
    const price = prices[crypto.symbol] || 0;
    return sum + calculateHoldingValue(crypto, price, 'crypto');
  }, 0);

  const totalValue = stockValue + cryptoValue;

  // Calculate total gain/loss for stocks
  const [stockTotalGainLoss, setStockTotalGainLoss] = useState(null);
  const [stockTotalGainLossPercent, setStockTotalGainLossPercent] = useState(null);
  
  useEffect(() => {
    const calculateStockGains = async () => {
      let totalGain = 0;
      let totalCost = 0;
      
      for (const stock of portfolio.stocks) {
        const price = prices[stock.symbol] || 0;
        if (price > 0) {
          try {
            const gl = await calculateGainLoss(stock, price, 'stock');
            const value = calculateHoldingValue(stock, price, 'stock');
            totalGain += gl;
            totalCost += (value - gl);
          } catch (error) {
            console.error('Error calculating stock gain/loss:', error);
          }
        }
      }
      
      setStockTotalGainLoss(totalGain);
      setStockTotalGainLossPercent(totalCost > 0 ? (totalGain / totalCost) * 100 : 0);
    };
    
    if (Object.keys(prices).length > 0) {
      calculateStockGains();
    }
  }, [prices]);

  // Calculate total gain/loss for crypto
  const [cryptoTotalGainLoss, setCryptoTotalGainLoss] = useState(null);
  const [cryptoTotalGainLossPercent, setCryptoTotalGainLossPercent] = useState(null);
  
  useEffect(() => {
    const calculateCryptoGains = async () => {
      let totalGain = 0;
      let totalCost = 0;
      
      for (const crypto of portfolio.crypto) {
        const price = prices[crypto.symbol] || 0;
        if (price > 0) {
          try {
            const gl = await calculateGainLoss(crypto, price, 'crypto');
            const value = calculateHoldingValue(crypto, price, 'crypto');
            totalGain += gl;
            totalCost += (value - gl);
          } catch (error) {
            console.error('Error calculating crypto gain/loss:', error);
          }
        }
      }
      
      setCryptoTotalGainLoss(totalGain);
      setCryptoTotalGainLossPercent(totalCost > 0 ? (totalGain / totalCost) * 100 : 0);
    };
    
    if (Object.keys(prices).length > 0) {
      calculateCryptoGains();
    }
  }, [prices]);

  return (
    <>
      <StatusBar style="light" backgroundColor="#0E1111" />
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.content}>
          <Text style={styles.greeting}>Welcome to MyBalance</Text>
          <Text style={styles.subtitle}>Total Portfolio Value</Text>
          <Text style={styles.totalValue}>
            ¥{totalValue > 0 ? totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '0'}
          </Text>
          <Text style={styles.lastUpdate}>
            Last updated: {lastUpdate.toLocaleDateString()} {lastUpdate.toLocaleTimeString()}
          </Text>
          {lastUpdate && (Date.now() - lastUpdate.getTime() > 3600000) && (
            <Text style={styles.cacheNotice}>
              ⚠️ Data may be cached (APIs inactive)
            </Text>
          )}
          
          {/* Portfolio Summary with Expandable Sections */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Portfolio Summary</Text>
            
            {/* Stocks Section */}
            <TouchableOpacity 
              style={styles.expandableCard}
              onPress={() => setStocksExpanded(!stocksExpanded)}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <Text style={styles.cardTitle}>Stocks ({portfolio.stocks.length} holdings)</Text>
                  <Text style={styles.cardValue}>
                    ¥{stockValue > 0 ? stockValue.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '0'}
                  </Text>
                  {stockTotalGainLoss !== null && (
                    <Text style={[styles.cardChange, { 
                      color: stockTotalGainLoss >= 0 ? '#4CAF50' : '#F44336' 
                    }]}>
                      {stockTotalGainLoss >= 0 ? '+' : ''}¥{stockTotalGainLoss.toLocaleString('en-US', { maximumFractionDigits: 0 })} ({stockTotalGainLoss >= 0 ? '+' : ''}{stockTotalGainLossPercent.toFixed(2)}%)
                    </Text>
                  )}
                  <Text style={styles.cardPercentage}>
                    {totalValue > 0 ? ((stockValue / totalValue) * 100).toFixed(1) : 0}% of portfolio
                  </Text>
                </View>
                <Text style={styles.chevron}>
                  {stocksExpanded ? "▲" : "▼"}
                </Text>
              </View>
            </TouchableOpacity>
            
            {/* Expanded Stock Holdings */}
            {stocksExpanded && (
              <View style={styles.expandedSection}>
                {portfolio.stocks.map((stock) => {
                  const price = prices[stock.symbol] || 0;
                  const usdPrice = usdPrices[stock.symbol] || 0;
                  const value = calculateHoldingValue(stock, price, 'stock');
                  const displayPrice = stock.symbol === '3350.T' ? price : usdPrice;
                  const currency = stock.symbol === '3350.T' ? '¥' : '$';
                  
                  return (
                    <HoldingCard 
                      key={stock.symbol} 
                      holding={stock} 
                      price={price} 
                      displayPrice={displayPrice}
                      currency={currency}
                      value={value}
                      type="stock"
                      totalCategoryValue={stockValue}
                    />
                  );
                })}
              </View>
            )}

            {/* Crypto Section */}
            <TouchableOpacity 
              style={styles.expandableCard}
              onPress={() => setCryptoExpanded(!cryptoExpanded)}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <Text style={styles.cardTitle}>Crypto ({portfolio.crypto.length} holding)</Text>
                  <Text style={styles.cardValue}>
                    ¥{cryptoValue > 0 ? cryptoValue.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '0'}
                  </Text>
                  {cryptoTotalGainLoss !== null && (
                    <Text style={[styles.cardChange, { 
                      color: cryptoTotalGainLoss >= 0 ? '#4CAF50' : '#F44336' 
                    }]}>
                      {cryptoTotalGainLoss >= 0 ? '+' : ''}¥{cryptoTotalGainLoss.toLocaleString('en-US', { maximumFractionDigits: 0 })} ({cryptoTotalGainLoss >= 0 ? '+' : ''}{cryptoTotalGainLossPercent.toFixed(2)}%)
                    </Text>
                  )}
                  <Text style={styles.cardPercentage}>
                    {totalValue > 0 ? ((cryptoValue / totalValue) * 100).toFixed(1) : 0}% of portfolio
                  </Text>
                </View>
                <Text style={styles.chevron}>
                  {cryptoExpanded ? "▲" : "▼"}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Expanded Crypto Holdings */}
            {cryptoExpanded && (
              <View style={styles.expandedSection}>
                {portfolio.crypto.map((crypto) => {
                  const price = prices[crypto.symbol] || 0;
                  const usdPrice = usdPrices[crypto.symbol] || 0;
                  const value = calculateHoldingValue(crypto, price, 'crypto');
                  
                  return (
                    <HoldingCard 
                      key={crypto.symbol} 
                      holding={crypto} 
                      price={price} 
                      displayPrice={usdPrice}
                      currency="$"
                      value={value}
                      type="crypto"
                      totalCategoryValue={cryptoValue}
                    />
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E1111',
  },
  content: {
    padding: 20,
  },
  greeting: {
    fontSize: 24,
    color: '#F5F5F5',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 12,
    textAlign: 'center',
  },
  totalValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#00C853',
    marginBottom: 8,
    textAlign: 'center',
  },
  lastUpdate: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  cacheNotice: {
    fontSize: 11,
    color: '#FFA726',
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F5F5F5',
    marginBottom: 16,
  },
  expandableCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  expandedSection: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  holdingCard: {
    backgroundColor: '#0E1111',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    position: 'relative',
  },
  cardLeft: {
    flex: 1,
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardRight: {
    alignItems: 'flex-end',
    position: 'absolute',
    right: 16,
    top: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F5F5F5',
    marginRight: 8,
  },
  percentageBadge: {
    backgroundColor: '#00C853',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  percentageText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  cardShares: {
    fontSize: 12,
    color: '#666',
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F5F5F5',
    marginBottom: 4,
  },
  cardChange: {
    fontSize: 14,
    fontWeight: '500',
    color: '#888',
  },
  cardPercentage: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#00C853',
    borderRadius: 2,
  },
  chevron: {
    fontSize: 20,
    color: '#888',
    fontWeight: 'bold',
  },
});
