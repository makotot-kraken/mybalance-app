import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import ChartView from '../components/ChartView';
import { 
  calculateHoldingValue, 
  calculateGainLoss, 
  calculateGainLossPercentage,
  fetchRealTimePrices,
  stockHistoricalData 
} from '../data/assets';

export default function StockDetail({ route }) {
  const { stock } = route.params;
  const [loading, setLoading] = useState(true);
  const [stockData, setStockData] = useState({
    value: 0,
    gainLoss: 0,
    gainLossPercent: 0,
    price: 0
  });

  useEffect(() => {
    const loadStockData = async () => {
      try {
        const prices = await fetchRealTimePrices();
        const price = prices[stock.symbol] || 0;
        const value = calculateHoldingValue(stock, price, 'stock');
        const gainLoss = await calculateGainLoss(stock, price, 'stock');
        const gainLossPercent = await calculateGainLossPercentage(stock, price, 'stock');
        
        setStockData({
          value,
          gainLoss,
          gainLossPercent,
          price
        });
        setLoading(false);
      } catch (error) {
        console.error('Error loading stock data:', error);
        setLoading(false);
      }
    };

    loadStockData();
  }, [stock.symbol]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.loadingText}>Loading stock details...</Text>
        </View>
      </View>
    );
  }

  const isPositive = stockData.gainLoss >= 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.symbol}>{stock.symbol}</Text>
          <Text style={styles.name}>{stock.name}</Text>
          <Text style={styles.currentPrice}>
            ¥{stockData.price.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </Text>
          <Text style={[styles.change, { color: isPositive ? '#00C853' : '#FF5722' }]}>
            {isPositive ? '+' : ''}¥{stockData.gainLoss.toLocaleString('en-US', { maximumFractionDigits: 0 })} ({stockData.gainLossPercent.toFixed(2)}%)
          </Text>
        </View>

        <ChartView 
          data={stockHistoricalData[stock.symbol] || []}
          type="area"
          color={isPositive ? '#00C853' : '#FF5722'}
          height={250}
        />

        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <View style={styles.statCard}>
              <Text style={styles.statTitle}>Shares Owned</Text>
              <Text style={styles.statValue}>{stock.quantity}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statTitle}>Avg. Cost</Text>
              <Text style={styles.statValue}>¥{stock.averagePrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}</Text>
            </View>
          </View>

          <View style={styles.statRow}>
            <View style={styles.statCard}>
              <Text style={styles.statTitle}>Total Investment</Text>
              <Text style={styles.statValue}>
                ¥{stock.totalCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statTitle}>Current Value</Text>
              <Text style={styles.statValue}>
                ¥{stockData.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </Text>
            </View>
          </View>

          <View style={styles.fullWidthCard}>
            <Text style={styles.statTitle}>Total Return</Text>
            <Text style={[styles.bigStatValue, { color: isPositive ? '#00C853' : '#FF5722' }]}>
              {isPositive ? '+' : ''}¥{stockData.gainLoss.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </Text>
            <Text style={[styles.statSubtitle, { color: isPositive ? '#00C853' : '#FF5722' }]}>
              {stockData.gainLossPercent.toFixed(2)}% return
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E1111',
  },
  content: {
    paddingBottom: 20,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  symbol: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F5F5F5',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    color: '#888',
    marginBottom: 16,
  },
  currentPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F5F5F5',
    marginBottom: 8,
  },
  change: {
    fontSize: 16,
    fontWeight: '500',
  },
  statsContainer: {
    padding: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  fullWidthCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  statTitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F5F5F5',
    textAlign: 'center',
  },
  bigStatValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
});