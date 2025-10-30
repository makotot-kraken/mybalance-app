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

export default function Crypto() {
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [cryptoData, setCryptoData] = useState([]);

  useEffect(() => {
    loadCryptoData();
  }, []);

  const loadCryptoData = async () => {
    try {
      setLoading(true);
      const priceData = await fetchRealTimePrices();
      setPrices(priceData);

      // Calculate data for all crypto
      const cryptoDataPromises = portfolio.crypto.map(async (crypto) => {
        const price = priceData[crypto.symbol] || 0;
        const value = calculateHoldingValue(crypto, price, 'crypto');
        const gainLoss = await calculateGainLoss(crypto, price, 'crypto');
        const gainLossPercent = await calculateGainLossPercentage(crypto, price, 'crypto');
        
        return {
          ...crypto,
          price,
          value,
          gainLoss,
          gainLossPercent
        };
      });

      const calculatedCryptoData = await Promise.all(cryptoDataPromises);
      setCryptoData(calculatedCryptoData);
    } catch (error) {
      console.error('Error loading crypto data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalCryptoValue = cryptoData.reduce((sum, crypto) => sum + (crypto.value || 0), 0);
  const totalGainLoss = cryptoData.reduce((sum, crypto) => sum + (crypto.gainLoss || 0), 0);
  const totalOriginalValue = totalCryptoValue - totalGainLoss;
  const totalGainLossPercent = totalOriginalValue > 0 ? (totalGainLoss / totalOriginalValue) * 100 : 0;

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Loading crypto data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Crypto</Text>
          <Text style={styles.totalValue}>
            ¥{totalCryptoValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </Text>
          <Text style={[styles.totalChange, { color: totalGainLoss >= 0 ? '#00C853' : '#FF5722' }]}>
            {totalGainLoss >= 0 ? '+' : '-'}¥{Math.abs(totalGainLoss).toLocaleString('en-US', { maximumFractionDigits: 0 })} ({totalGainLossPercent.toFixed(1)}%)
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Holdings ({portfolio.crypto.length})</Text>
          
          {cryptoData.map((crypto, index) => {
            return (
              <AssetCard
                key={index}
                title={crypto.symbol.replace('USDT', '')}
                subtitle={`${crypto.amount} ${crypto.symbol.replace('USDT', '')}`}
                value={`¥${(crypto.value || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
                change={crypto.gainLoss || 0}
                changePercent={crypto.gainLossPercent || 0}
              />
            );
          })}
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Total Holdings</Text>
            <Text style={styles.statValue}>
              {assets.crypto.length} coins
            </Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Portfolio Value</Text>
            <Text style={styles.statValue}>
              ¥{totalCryptoValue.toLocaleString()}
            </Text>
          </View>
        </View>

                <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Total Invested</Text>
            <Text style={styles.statValue}>
              ¥{totalOriginalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Current Value</Text>
            <Text style={styles.statValue}>
              ¥{totalCryptoValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
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
  cryptoInfo: {
    margin: 16,
    marginTop: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F5F5F5',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 16,
    color: '#F5F5F5',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#F5F5F5',
    fontWeight: 'bold',
  },
  infoChange: {
    fontSize: 14,
    color: '#00C853',
    fontWeight: '500',
  },
});