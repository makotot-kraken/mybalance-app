import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import AssetCard from '../components/AssetCard';
import { 
  portfolio,
  fetchRealTimePrices,
  calculateHoldingValue,
  calculateGainLoss,
  calculateGainLossPercentage 
} from '../data/assets';

export default function Stocks({ navigation }) {
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [stockData, setStockData] = useState([]);

  useEffect(() => {
    loadStockData();
  }, []);

  const loadStockData = async () => {
    try {
      setLoading(true);
      const priceData = await fetchRealTimePrices();
      setPrices(priceData);

      // Calculate data for all stocks
      const stockDataPromises = portfolio.stocks.map(async (stock) => {
        const price = priceData[stock.symbol] || 0;
        const value = calculateHoldingValue(stock, price, 'stock');
        const gainLoss = await calculateGainLoss(stock, price, 'stock');
        const gainLossPercent = await calculateGainLossPercentage(stock, price, 'stock');
        
        return {
          ...stock,
          price,
          value,
          gainLoss,
          gainLossPercent
        };
      });

      const calculatedStockData = await Promise.all(stockDataPromises);
      setStockData(calculatedStockData);
    } catch (error) {
      console.error('Error loading stock data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalStockValue = stockData.reduce((sum, stock) => sum + (stock.value || 0), 0);
  const totalGainLoss = stockData.reduce((sum, stock) => sum + (stock.gainLoss || 0), 0);
  const totalOriginalValue = totalStockValue - totalGainLoss;
  const totalGainLossPercent = totalOriginalValue > 0 ? (totalGainLoss / totalOriginalValue) * 100 : 0;

  const handleStockPress = (stock) => {
    navigation.navigate('StockDetail', { stock });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Loading stock data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Stocks</Text>
          <Text style={styles.totalValue}>
            ¥{totalStockValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </Text>
          <Text style={[styles.totalChange, { color: totalGainLoss >= 0 ? '#00C853' : '#FF5722' }]}>
            {totalGainLoss >= 0 ? '+' : '-'}¥{Math.abs(totalGainLoss).toLocaleString('en-US', { maximumFractionDigits: 0 })} ({totalGainLossPercent.toFixed(1)}%)
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Holdings ({portfolio.stocks.length})</Text>
          
          {stockData.map((stock, index) => {
            return (
              <AssetCard
                key={index}
                title={stock.symbol}
                subtitle={stock.name}
                value={`¥${(stock.value || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
                change={stock.gainLoss || 0}
                changePercent={stock.gainLossPercent || 0}
                onPress={() => handleStockPress(stock)}
              />
            );
          })}
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Total Invested</Text>
            <Text style={styles.statValue}>
              ${totalOriginalValue.toLocaleString()}
            </Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Current Value</Text>
            <Text style={styles.statValue}>
              ${totalStockValue.toLocaleString()}
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#F5F5F5',
    fontSize: 16,
  },
  content: {
    paddingBottom: 20,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F5F5F5',
    marginBottom: 16,
  },
  totalValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F5F5F5',
    marginBottom: 8,
  },
  totalChange: {
    fontSize: 16,
    fontWeight: '500',
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F5F5F5',
    marginLeft: 16,
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 16,
    marginTop: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statTitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F5F5F5',
  },
});