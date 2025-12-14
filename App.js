import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Dimensions, Modal, TextInput, Alert } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
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
import { calculateAnnualProfits } from './utils/annualProfit';
import { trades } from './data/trade-log';

// Import portfolio history
import portfolioHistory from './data/portfolio-history.json';

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
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeForm, setTradeForm] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'buy',
    symbol: '',
    shares: '',
    pricePerShare: '',
    note: ''
  });
  
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

  // Calculate annual profits - for 2025, use current holdings gains
  const totalHoldingsGain = (stockTotalGainLoss || 0) + (cryptoTotalGainLoss || 0);
  const annualProfits = calculateAnnualProfits(portfolioHistory, totalHoldingsGain);

  const handleLogTrade = async () => {
    // Validate form
    if (!tradeForm.symbol || !tradeForm.shares || !tradeForm.pricePerShare) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    
    const shares = parseFloat(tradeForm.shares);
    const pricePerShare = parseFloat(tradeForm.pricePerShare);
    
    if (isNaN(shares) || isNaN(pricePerShare)) {
      Alert.alert('Error', 'Shares and price must be valid numbers');
      return;
    }
    
    // Get current exchange rate (use latest from history or default)
    const exchangeRate = portfolioHistory[portfolioHistory.length - 1]?.exchangeRate || 155;
    
    const totalCost = shares * pricePerShare;
    const totalCostJPY = Math.round(totalCost * exchangeRate);
    
    const newTrade = {
      date: tradeForm.date,
      type: tradeForm.type,
      symbol: tradeForm.symbol.toUpperCase(),
      shares: shares,
      pricePerShare: pricePerShare,
      totalCost: totalCost,
      exchangeRate: exchangeRate,
      totalCostJPY: totalCostJPY,
      capitalChange: tradeForm.type === 'buy' ? totalCostJPY : -totalCostJPY,
      note: tradeForm.note || `${tradeForm.type === 'buy' ? 'Bought' : 'Sold'} ${shares} shares of ${tradeForm.symbol.toUpperCase()}`
    };
    
    // Save trade to backend
    try {
      const response = await fetch('/api/process-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTrade)
      });
      
      if (response.ok) {
        Alert.alert(
          'Trade Processed Successfully! ✅',
          `${tradeForm.type === 'buy' ? 'Purchase' : 'Sale'} of ${shares} ${tradeForm.symbol.toUpperCase()} shares\n` +
          `Cost: $${totalCost.toFixed(2)} (¥${totalCostJPY.toLocaleString()})\n\n` +
          `Updated:\n` +
          `✓ Portfolio holdings\n` +
          `✓ Cost basis\n` +
          `✓ Price fetchers\n` +
          `✓ Snapshot script\n` +
          `✓ Capital tracking\n\n` +
          `Please rebuild and deploy:\n` +
          `npx expo export -p web --output-dir docs && git push`,
          [
            { text: 'OK', onPress: () => {
              setShowTradeModal(false);
              setTradeForm({
                date: new Date().toISOString().split('T')[0],
                type: 'buy',
                symbol: '',
                shares: '',
                pricePerShare: '',
                note: ''
              });
            }}
          ]
        );
      } else {
        throw new Error('Server error');
      }
    } catch (error) {
      // Fallback: show manual instructions
      Alert.alert(
        'Trade Logged (Manual Mode)',
        `${tradeForm.type === 'buy' ? 'Purchase' : 'Sale'} of ${shares} ${tradeForm.symbol.toUpperCase()} shares\n` +
        `Cost: $${totalCost.toFixed(2)} (¥${totalCostJPY.toLocaleString()})\n\n` +
        `Run this command to process:\n` +
        `node scripts/process-trade.js '${JSON.stringify(newTrade)}'`,
        [
          { text: 'OK', onPress: () => {
            setShowTradeModal(false);
            setTradeForm({
              date: new Date().toISOString().split('T')[0],
              type: 'buy',
              symbol: '',
              shares: '',
              pricePerShare: '',
              note: ''
            });
          }}
        ]
      );
      console.log('Trade to process:', JSON.stringify(newTrade, null, 2));
    }
  };

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
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>Welcome to MyBalance</Text>
              <Text style={styles.subtitle}>Total Portfolio Value</Text>
              <Text style={styles.totalValue}>
                ¥{totalValue > 0 ? totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '0'}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.logTradeButton}
              onPress={() => setShowTradeModal(true)}
            >
              <Text style={styles.logTradeButtonText}>📝 Log Trade</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.lastUpdate}>
            Last updated: {lastUpdate.toLocaleDateString()} {lastUpdate.toLocaleTimeString()}
          </Text>
          {lastUpdate && (Date.now() - lastUpdate.getTime() > 3600000) && (
            <Text style={styles.cacheNotice}>
              ⚠️ Data may be cached (APIs inactive)
            </Text>
          )}
        </View>

        {/* Trade Modal */}
        <Modal
          visible={showTradeModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowTradeModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Log Trade</Text>
              
              <Text style={styles.inputLabel}>Date</Text>
              <TextInput
                style={styles.input}
                value={tradeForm.date}
                onChangeText={(text) => setTradeForm({...tradeForm, date: text})}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#666"
              />
              
              <Text style={styles.inputLabel}>Type</Text>
              <View style={styles.typeToggle}>
                <TouchableOpacity 
                  style={[styles.typeButton, tradeForm.type === 'buy' && styles.typeButtonActive]}
                  onPress={() => setTradeForm({...tradeForm, type: 'buy'})}
                >
                  <Text style={[styles.typeButtonText, tradeForm.type === 'buy' && styles.typeButtonTextActive]}>
                    Buy
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.typeButton, tradeForm.type === 'sell' && styles.typeButtonActive]}
                  onPress={() => setTradeForm({...tradeForm, type: 'sell'})}
                >
                  <Text style={[styles.typeButtonText, tradeForm.type === 'sell' && styles.typeButtonTextActive]}>
                    Sell
                  </Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.inputLabel}>Symbol</Text>
              <TextInput
                style={styles.input}
                value={tradeForm.symbol}
                onChangeText={(text) => setTradeForm({...tradeForm, symbol: text})}
                placeholder="e.g., TSLA, NVDA"
                placeholderTextColor="#666"
                autoCapitalize="characters"
              />
              
              <Text style={styles.inputLabel}>Shares</Text>
              <TextInput
                style={styles.input}
                value={tradeForm.shares}
                onChangeText={(text) => setTradeForm({...tradeForm, shares: text})}
                placeholder="Number of shares"
                placeholderTextColor="#666"
                keyboardType="decimal-pad"
              />
              
              <Text style={styles.inputLabel}>Price per Share (USD)</Text>
              <TextInput
                style={styles.input}
                value={tradeForm.pricePerShare}
                onChangeText={(text) => setTradeForm({...tradeForm, pricePerShare: text})}
                placeholder="Price in USD"
                placeholderTextColor="#666"
                keyboardType="decimal-pad"
              />
              
              <Text style={styles.inputLabel}>Note (optional)</Text>
              <TextInput
                style={styles.input}
                value={tradeForm.note}
                onChangeText={(text) => setTradeForm({...tradeForm, note: text})}
                placeholder="Additional notes"
                placeholderTextColor="#666"
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowTradeModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={handleLogTrade}
                >
                  <Text style={styles.submitButtonText}>Log Trade</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <View style={styles.content}>
          {/* Historical Portfolio Chart */}
          {portfolioHistory && portfolioHistory.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Portfolio History</Text>
              <View style={styles.chartContainer}>
                <LineChart
                  data={{
                    labels: portfolioHistory.slice(-30).map((item, index) => {
                      // Show every 5th date to avoid crowding
                      if (index % 5 === 0) {
                        const date = new Date(item.date);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }
                      return '';
                    }),
                    datasets: [
                      {
                        data: portfolioHistory.slice(-30).map(item => item.stockValue / 1000000), // Show in millions
                        color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`, // Green for stocks
                        strokeWidth: 2,
                      },
                      {
                        data: portfolioHistory.slice(-30).map(item => item.cryptoValue / 1000000), // Show in millions
                        color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`, // Blue for crypto
                        strokeWidth: 2,
                      },
                      {
                        data: portfolioHistory.slice(-30).map(item => item.totalValue / 1000000), // Show in millions
                        color: (opacity = 1) => `rgba(255, 193, 7, ${opacity})`, // Yellow for total
                        strokeWidth: 3,
                      },
                    ],
                    legend: ['Stocks', 'Crypto', 'Total'],
                  }}
                  width={Dimensions.get('window').width - 40}
                  height={220}
                  chartConfig={{
                    backgroundColor: '#1A1A1A',
                    backgroundGradientFrom: '#1A1A1A',
                    backgroundGradientTo: '#1A1A1A',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(136, 136, 136, ${opacity})`,
                    style: {
                      borderRadius: 16,
                    },
                    propsForDots: {
                      r: '3',
                      strokeWidth: '2',
                    },
                  }}
                  bezier
                  style={{
                    marginVertical: 8,
                    borderRadius: 16,
                  }}
                  formatYLabel={(value) => `¥${value}M`}
                />
                <View style={styles.legendContainer}>
                  <View style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
                    <Text style={styles.legendLabel}>Stocks</Text>
                  </View>
                  <View style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: '#2196F3' }]} />
                    <Text style={styles.legendLabel}>Crypto</Text>
                  </View>
                  <View style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: '#FFC107' }]} />
                    <Text style={styles.legendLabel}>Total</Text>
                  </View>
                </View>
                <Text style={styles.chartNote}>
                  Last 30 days • Values in millions (M) • Updated daily at 6am JST
                </Text>
              </View>
            </View>
          )}
          
          {/* Annual Profit Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Annual Performance</Text>
            {annualProfits.length === 0 ? (
              <Text style={styles.cardValue}>No annual data yet</Text>
            ) : (
              annualProfits.map((item) => (
                <View key={item.year} style={styles.annualProfitCard}>
                  <Text style={styles.annualYear}>{item.year}</Text>
                  <View style={styles.annualGrid}>
                    {item.year !== '2025' && (
                      <View style={styles.annualRow}>
                        <Text style={styles.annualLabel}>Start Value:</Text>
                        <Text style={styles.annualValue}>¥{item.startValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</Text>
                      </View>
                    )}
                    <View style={styles.annualRow}>
                      <Text style={styles.annualLabel}>End Value:</Text>
                      <Text style={styles.annualValue}>¥{item.endValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</Text>
                    </View>
                    {item.capitalAdded !== 0 && (
                      <View style={styles.annualRow}>
                        <Text style={styles.annualLabel}>Capital Added:</Text>
                        <Text style={[styles.annualValue, { color: item.capitalAdded > 0 ? '#2196F3' : '#FF9800' }]}>
                          {item.capitalAdded > 0 ? '+' : ''}¥{item.capitalAdded.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </Text>
                      </View>
                    )}
                    <View style={styles.annualRow}>
                      <Text style={styles.annualLabel}>Actual Profit:</Text>
                      <Text style={[styles.annualValue, { color: item.actualProfit >= 0 ? '#4CAF50' : '#F44336', fontWeight: 'bold' }]}>
                        {item.actualProfit >= 0 ? '+' : ''}¥{item.actualProfit.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </Text>
                    </View>
                    <View style={styles.annualRow}>
                      <Text style={[styles.annualLabel, { fontWeight: 'bold' }]}>Return:</Text>
                      <Text style={[styles.annualValue, { 
                        color: item.returnPercent >= 0 ? '#4CAF50' : '#F44336', 
                        fontWeight: 'bold',
                        fontSize: 18
                      }]}>
                        {item.returnPercent >= 0 ? '+' : ''}{item.returnPercent}%
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
            <Text style={styles.chartNote}>
              2025 (Start Year): Profit = End - Start{'\n'}
              Future Years: Profit = End - Start - Capital Added
            </Text>
          </View>
          
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
                {portfolio.stocks
                  .map((stock) => {
                    const price = prices[stock.symbol] || 0;
                    const value = calculateHoldingValue(stock, price, 'stock');
                    return { stock, price, value };
                  })
                  .sort((a, b) => b.value - a.value) // Sort by value (highest to lowest)
                  .map(({ stock, price, value }) => {
                    const usdPrice = usdPrices[stock.symbol] || 0;
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

          {/* Trade History Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trade History</Text>
            {trades.length === 0 ? (
              <Text style={styles.chartNote}>No trades logged yet. Use the "Log Trade" button to record your trades.</Text>
            ) : (
              <View>
                {trades.slice().reverse().map((trade, index) => (
                  <View key={index} style={styles.tradeCard}>
                    <View style={styles.tradeHeader}>
                      <View style={styles.tradeSymbolRow}>
                        <Text style={styles.tradeSymbol}>{trade.symbol}</Text>
                        <View style={[styles.tradeBadge, { backgroundColor: trade.type === 'buy' ? '#4CAF50' : '#F44336' }]}>
                          <Text style={styles.tradeBadgeText}>{trade.type.toUpperCase()}</Text>
                        </View>
                      </View>
                      <Text style={styles.tradeDate}>{trade.date}</Text>
                    </View>
                    <View style={styles.tradeDetails}>
                      <View style={styles.tradeRow}>
                        <Text style={styles.tradeLabel}>Shares:</Text>
                        <Text style={styles.tradeValue}>{trade.shares}</Text>
                      </View>
                      <View style={styles.tradeRow}>
                        <Text style={styles.tradeLabel}>Price/Share:</Text>
                        <Text style={styles.tradeValue}>${trade.pricePerShare.toFixed(2)}</Text>
                      </View>
                      <View style={styles.tradeRow}>
                        <Text style={styles.tradeLabel}>Total (USD):</Text>
                        <Text style={styles.tradeValue}>${trade.totalCost.toFixed(2)}</Text>
                      </View>
                      <View style={styles.tradeRow}>
                        <Text style={styles.tradeLabel}>Total (JPY):</Text>
                        <Text style={[styles.tradeValue, { fontWeight: 'bold' }]}>
                          ¥{trade.totalCostJPY.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </Text>
                      </View>
                      <View style={styles.tradeRow}>
                        <Text style={styles.tradeLabel}>Exchange Rate:</Text>
                        <Text style={styles.tradeValue}>¥{trade.exchangeRate.toFixed(2)}</Text>
                      </View>
                      {trade.note && (
                        <View style={styles.tradeNoteRow}>
                          <Text style={styles.tradeNote}>{trade.note}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
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
  chartContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendLabel: {
    fontSize: 12,
    color: '#F5F5F5',
  },
  chartNote: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
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
  annualProfitCard: {
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  annualYear: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFC107',
    marginBottom: 12,
  },
  annualGrid: {
    width: '100%',
  },
  annualRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 16,
  },
  annualLabel: {
    fontSize: 14,
    color: '#888',
    flex: 0,
    minWidth: 120,
  },
  annualValue: {
    fontSize: 14,
    color: '#F5F5F5',
    flex: 1,
    textAlign: 'right',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  logTradeButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  logTradeButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFC107',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#2A2A2A',
    color: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
  typeToggle: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  typeButtonText: {
    color: '#888',
    fontSize: 16,
    fontWeight: 'bold',
  },
  typeButtonTextActive: {
    color: '#FFF',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#444',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButtonText: {
    color: '#F5F5F5',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tradeCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  tradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tradeSymbolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tradeSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFC107',
  },
  tradeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tradeBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFF',
  },
  tradeDate: {
    fontSize: 14,
    color: '#888',
  },
  tradeDetails: {
    gap: 8,
  },
  tradeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tradeLabel: {
    fontSize: 14,
    color: '#888',
  },
  tradeValue: {
    fontSize: 14,
    color: '#F5F5F5',
  },
  tradeNoteRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  tradeNote: {
    fontSize: 13,
    color: '#AAA',
    fontStyle: 'italic',
  },
});
