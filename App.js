import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PieChart } from 'react-native-chart-kit';
import { 
  portfolio, 
  fetchRealTimePrices, 
  fetchUSDPrices,
  calculateHoldingValue,
  calculateGainLoss,
  calculateGainLossPercentage
} from './data/assets';

const Tab = createBottomTabNavigator();

// Stock Card Component with gain/loss
function StockCard({ stock, price, displayPrice, currency, value }) {
  const [gainLoss, setGainLoss] = useState(null);
  const [gainLossPercent, setGainLossPercent] = useState(null);

  useEffect(() => {
    const calculateGains = async () => {
      if (price > 0) {
        try {
          const gl = await calculateGainLoss(stock, price, 'stock');
          const glp = await calculateGainLossPercentage(stock, price, 'stock');
          setGainLoss(gl);
          setGainLossPercent(glp);
        } catch (error) {
          console.error('Error calculating gain/loss:', error);
        }
      }
    };
    calculateGains();
  }, [price, stock]);

  const isPositive = gainLoss && gainLoss >= 0;
  const changeColor = gainLoss === null ? '#888' : isPositive ? '#4CAF50' : '#F44336';

  return (
    <View style={styles.holdingCard}>
      <View style={styles.cardLeft}>
        <Text style={styles.cardTitle}>{stock.symbol}</Text>
        <Text style={styles.cardSubtitle}>{stock.name}</Text>
        <Text style={styles.cardShares}>
          {stock.quantity || stock.shares} shares @ {displayPrice > 0 ? `${currency}${displayPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}` : 'Loading...'}
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

// Crypto Card Component with gain/loss
function CryptoCard({ crypto, price, displayPrice, value }) {
  const [gainLoss, setGainLoss] = useState(null);
  const [gainLossPercent, setGainLossPercent] = useState(null);

  useEffect(() => {
    const calculateGains = async () => {
      if (price > 0) {
        try {
          const gl = await calculateGainLoss(crypto, price, 'crypto');
          const glp = await calculateGainLossPercentage(crypto, price, 'crypto');
          setGainLoss(gl);
          setGainLossPercent(glp);
        } catch (error) {
          console.error('Error calculating gain/loss:', error);
        }
      }
    };
    calculateGains();
  }, [price, crypto]);

  const isPositive = gainLoss && gainLoss >= 0;
  const changeColor = gainLoss === null ? '#888' : isPositive ? '#4CAF50' : '#F44336';

  return (
    <View style={styles.holdingCard}>
      <View style={styles.cardLeft}>
        <Text style={styles.cardTitle}>{crypto.name}</Text>
        <Text style={styles.cardSubtitle}>{crypto.symbol}</Text>
        <Text style={styles.cardShares}>
          {crypto.amount} @ ${displayPrice > 0 ? displayPrice.toLocaleString('en-US', { maximumFractionDigits: 2 }) : 'Loading...'}
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

// Dashboard Screen
function Dashboard() {
  console.log('[Dashboard] Component mounted');
  const [refreshing, setRefreshing] = useState(false);
  const [prices, setPrices] = useState({});  // JPY prices for calculations
  const [usdPrices, setUsdPrices] = useState({});  // USD prices for display
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [selectedSegment, setSelectedSegment] = useState(null);
  
  const loadPrices = async () => {
    try {
      console.log('[Dashboard] Loading prices...');
      const [priceData, usdPriceData] = await Promise.all([
        fetchRealTimePrices(),  // JPY prices for calculations
        fetchUSDPrices()        // USD prices for display
      ]);
      setPrices(priceData);
      setUsdPrices(usdPriceData);
      setLastUpdate(new Date());
      console.log('[Dashboard] Prices loaded:', Object.keys(priceData).length, 'items');
    } catch (error) {
      console.error('[Dashboard] Error loading prices:', error);
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await loadPrices();
    setRefreshing(false);
  };
  
  useEffect(() => {
    loadPrices();
  }, []);

  // Calculate simple totals
  const stockValue = portfolio.stocks.reduce((sum, stock) => {
    const price = prices[stock.symbol] || 0;
    return sum + calculateHoldingValue(stock, price, 'stock');
  }, 0);

  const cryptoValue = portfolio.crypto.reduce((sum, crypto) => {
    const price = prices[crypto.symbol] || 0;
    return sum + calculateHoldingValue(crypto, price, 'crypto');
  }, 0);

  const totalValue = stockValue + cryptoValue;

  // Pie chart data for portfolio distribution
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

  const handlePiePress = (data) => {
    setSelectedSegment({
      name: data.name,
      value: data.value,
      percentage: ((data.value / totalValue) * 100).toFixed(1)
    });
  };

  return (
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
              hasLegend={false}
              onDataPointClick={(data) => handlePiePress(pieChartData[data.index])}
            />
            {selectedSegment && (
              <View style={styles.segmentInfo}>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setSelectedSegment(null)}
                >
                  <Ionicons name="close-circle" size={24} color="#888" />
                </TouchableOpacity>
                <Text style={styles.segmentName}>{selectedSegment.name}</Text>
                <Text style={styles.segmentValue}>
                  ¥{selectedSegment.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </Text>
                <Text style={styles.segmentPercentage}>
                  {selectedSegment.percentage}% of total
                </Text>
              </View>
            )}
          </View>
        )}
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Portfolio Breakdown</Text>
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
      </View>
    </ScrollView>
  );
}

// Stocks Screen
function Stocks() {
  const [prices, setPrices] = useState({});  // JPY prices for calculations
  const [usdPrices, setUsdPrices] = useState({});  // USD prices for display
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState(null);

  const loadPrices = async () => {
    try {
      const [priceData, usdPriceData] = await Promise.all([
        fetchRealTimePrices(),  // JPY prices for calculations
        fetchUSDPrices()        // USD prices for display
      ]);
      setPrices(priceData);
      setUsdPrices(usdPriceData);
    } catch (error) {
      console.error('Error loading prices:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPrices();
    setRefreshing(false);
  };

  useEffect(() => {
    loadPrices();
  }, []);

  const totalStockValue = portfolio.stocks.reduce((sum, stock) => {
    const price = prices[stock.symbol] || 0;
    return sum + calculateHoldingValue(stock, price, 'stock');
  }, 0);

  // Pie chart data for stock distribution
  const stockPieChartData = portfolio.stocks.map((stock, index) => {
    const price = prices[stock.symbol] || 0;
    const value = calculateHoldingValue(stock, price, 'stock');
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0'];
    
    return {
      name: stock.symbol,
      value: value,
      color: colors[index % colors.length],
      legendFontColor: '#F5F5F5',
      legendFontSize: 12,
    };
  }).filter(item => item.value > 0);

  const screenWidth = Dimensions.get('window').width;

  const handlePiePress = (data) => {
    setSelectedSegment({
      name: data.name,
      value: data.value,
      percentage: ((data.value / totalStockValue) * 100).toFixed(1)
    });
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Stock Portfolio</Text>
          <Text style={styles.totalValue}>
            ¥{totalStockValue > 0 ? totalStockValue.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '0'}
          </Text>
          <Text style={styles.subtitle}>{portfolio.stocks.length} holdings</Text>
        </View>

        {/* Pie Chart for Stock Distribution */}
        {stockPieChartData.length > 0 && (
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>Stock Distribution</Text>
            <PieChart
              data={stockPieChartData}
              width={screenWidth - 40}
              height={220}
              chartConfig={{
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              }}
              accessor="value"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
              hasLegend={false}
              onDataPointClick={(data) => handlePiePress(stockPieChartData[data.index])}
            />
            {selectedSegment && (
              <View style={styles.segmentInfo}>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setSelectedSegment(null)}
                >
                  <Ionicons name="close-circle" size={24} color="#888" />
                </TouchableOpacity>
                <Text style={styles.segmentName}>{selectedSegment.name}</Text>
                <Text style={styles.segmentValue}>
                  ¥{selectedSegment.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </Text>
                <Text style={styles.segmentPercentage}>
                  {selectedSegment.percentage}% of total
                </Text>
              </View>
            )}
          </View>
        )}
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Holdings</Text>
          {portfolio.stocks.map((stock, index) => {
            const price = prices[stock.symbol] || 0;  // JPY price for calculation
            const usdPrice = usdPrices[stock.symbol] || 0;  // USD price for display
            const value = calculateHoldingValue(stock, price, 'stock');
            
            // Show USD price for US stocks, JPY for Japanese stocks
            const displayPrice = stock.symbol === '3350.T' ? price : usdPrice;
            const currency = stock.symbol === '3350.T' ? '¥' : '$';
            
            return (
              <StockCard 
                key={stock.symbol} 
                stock={stock} 
                price={price} 
                displayPrice={displayPrice}
                currency={currency}
                value={value}
              />
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

// Crypto Screen
function Crypto() {
  const [prices, setPrices] = useState({});  // JPY prices for calculations
  const [usdPrices, setUsdPrices] = useState({});  // USD prices for display
  const [refreshing, setRefreshing] = useState(false);

  const loadPrices = async () => {
    try {
      const [priceData, usdPriceData] = await Promise.all([
        fetchRealTimePrices(),  // JPY prices for calculations
        fetchUSDPrices()        // USD prices for display
      ]);
      setPrices(priceData);
      setUsdPrices(usdPriceData);
    } catch (error) {
      console.error('Error loading prices:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPrices();
    setRefreshing(false);
  };

  useEffect(() => {
    loadPrices();
  }, []);

  const totalCryptoValue = portfolio.crypto.reduce((sum, crypto) => {
    const price = prices[crypto.symbol] || 0;
    return sum + calculateHoldingValue(crypto, price, 'crypto');
  }, 0);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Crypto Portfolio</Text>
          <Text style={styles.totalValue}>
            ¥{totalCryptoValue > 0 ? totalCryptoValue.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '0'}
          </Text>
          <Text style={styles.subtitle}>{portfolio.crypto.length} holding</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Holdings</Text>
          {portfolio.crypto.map((crypto, index) => {
            const price = prices[crypto.symbol] || 0;  // JPY price for calculation
            const usdPrice = usdPrices[crypto.symbol] || 0;  // USD price for display
            const value = calculateHoldingValue(crypto, price, 'crypto');
            
            return (
              <CryptoCard 
                key={crypto.symbol} 
                crypto={crypto} 
                price={price} 
                displayPrice={usdPrice}
                value={value}
              />
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

export default function App() {
  console.log('[App] Starting MyBalance app...');
  return (
    <>
      <StatusBar style="light" backgroundColor="#0E1111" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerStyle: {
              backgroundColor: '#0E1111',
            },
            headerTintColor: '#F5F5F5',
            tabBarStyle: {
              backgroundColor: '#0E1111',
              borderTopColor: '#333',
            },
            tabBarActiveTintColor: '#00C853',
            tabBarInactiveTintColor: '#888',
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;
              if (route.name === 'Home') {
                iconName = focused ? 'home' : 'home-outline';
              } else if (route.name === 'Stocks') {
                iconName = focused ? 'trending-up' : 'trending-up-outline';
              } else if (route.name === 'Crypto') {
                iconName = focused ? 'logo-bitcoin' : 'logo-bitcoin';
              }
              return <Ionicons name={iconName} size={size} color={color} />;
            },
          })}
        >
          <Tab.Screen 
            name="Home" 
            component={Dashboard}
            options={{
              title: 'Portfolio',
            }}
          />
          <Tab.Screen 
            name="Stocks" 
            component={Stocks}
            options={{
              title: 'Stocks',
            }}
          />
          <Tab.Screen 
            name="Crypto" 
            component={Crypto}
            options={{
              title: 'Crypto',
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
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
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  greeting: {
    fontSize: 24,
    color: '#F5F5F5',
    marginBottom: 8,
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
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
  segmentInfo: {
    backgroundColor: '#1A1A1A',
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00C853',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  segmentName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F5F5F5',
    marginBottom: 8,
  },
  segmentValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00C853',
    marginBottom: 4,
  },
  segmentPercentage: {
    fontSize: 18,
    color: '#888',
  },
});
