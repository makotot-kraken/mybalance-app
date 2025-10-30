import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { 
  portfolio, 
  fetchRealTimePrices, 
  fetchUSDPrices,
  calculateHoldingValue,
  calculateGainLoss,
  calculateGainLossPercentage,
  startKeepAlive,
  stopKeepAlive
} from './data/assets';

// Holding Card Component with gain/loss
function HoldingCard({ holding, price, displayPrice, currency, value, type }) {
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

  return (
    <View style={styles.holdingCard}>
      <View style={styles.cardLeft}>
        <Text style={styles.cardTitle}>{displaySymbol}</Text>
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
    </View>
  );
}

export default function App() {
  console.log('[App] Starting MyBalance app...');
  const [refreshing, setRefreshing] = useState(false);
  const [prices, setPrices] = useState({});
  const [usdPrices, setUsdPrices] = useState({});
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  const loadPrices = async () => {
    try {
      console.log('[App] Loading prices...');
      const [priceData, usdPriceData] = await Promise.all([
        fetchRealTimePrices(),
        fetchUSDPrices()
      ]);
      setPrices(priceData);
      setUsdPrices(usdPriceData);
      setLastUpdate(new Date());
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

  // Pie chart data
  const pieChartData = totalValue > 0 ? [
    {
      name: 'Stocks',
      value: stockValue,
      color: '#4CAF50',
      legendFontColor: '#F5F5F5',
      legendFontSize: 14,
    },
    {
      name: 'Crypto',
      value: cryptoValue,
      color: '#2196F3',
      legendFontColor: '#F5F5F5',
      legendFontSize: 14,
    },
  ] : [];

  const screenWidth = Dimensions.get('window').width;

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
            Last updated: {lastUpdate.toLocaleTimeString()}
          </Text>

          {/* Pie Chart */}
          {totalValue > 0 && (
            <View style={styles.chartSection}>
              <Text style={styles.sectionTitle}>Asset Distribution</Text>
              <PieChart
                data={pieChartData}
                width={screenWidth - 40}
                height={220}
                chartConfig={{
                  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                }}
                accessor="value"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
                hasLegend={true}
              />
            </View>
          )}
          
          {/* Portfolio Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Portfolio Summary</Text>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Stocks ({portfolio.stocks.length} holdings)</Text>
              <Text style={styles.cardValue}>
                ¥{stockValue > 0 ? stockValue.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '0'}
              </Text>
              <Text style={styles.cardPercentage}>
                {totalValue > 0 ? ((stockValue / totalValue) * 100).toFixed(1) : 0}% of portfolio
              </Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Crypto ({portfolio.crypto.length} holding)</Text>
              <Text style={styles.cardValue}>
                ¥{cryptoValue > 0 ? cryptoValue.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '0'}
              </Text>
              <Text style={styles.cardPercentage}>
                {totalValue > 0 ? ((cryptoValue / totalValue) * 100).toFixed(1) : 0}% of portfolio
              </Text>
            </View>
          </View>

          {/* Stock Holdings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Stock Holdings</Text>
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
                />
              );
            })}
          </View>

          {/* Crypto Holdings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Crypto Holdings</Text>
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
                />
              );
            })}
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
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
  },
  chartSection: {
    marginBottom: 30,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F5F5F5',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  holdingCard: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardLeft: {
    flex: 1,
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F5F5F5',
    marginBottom: 4,
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
  },
});
