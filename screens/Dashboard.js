import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import AssetCard from '../components/AssetCard';
import PieChart from '../components/PieChart';
import { 
  assets, 
  calculateTotalValue, 
  calculateStockValue, 
  calculateCryptoValue 
} from '../data/assets';

export default function Dashboard() {
  const totalValue = calculateTotalValue();
  const stockValue = assets.stocks.reduce((sum, stock) => sum + calculateStockValue(stock), 0);
  const cryptoValue = assets.crypto.reduce((sum, crypto) => sum + calculateCryptoValue(crypto), 0);
  
  const pieChartData = [
    { x: 'Cash', y: assets.cash },
    { x: 'Stocks', y: stockValue },
    { x: 'Crypto', y: cryptoValue },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Good morning</Text>
          <Text style={styles.subtitle}>Total Net Worth</Text>
          <Text style={styles.totalValue}>
            ${totalValue.toLocaleString()}
          </Text>
          <Text style={styles.change}>
            +$24,000 (+0.89%) today
          </Text>
        </View>

        <PieChart 
          data={pieChartData} 
          title="Asset Breakdown"
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Portfolio</Text>
          
          <AssetCard
            title="Cash"
            value={`$${assets.cash.toLocaleString()}`}
            change={0}
            changePercent={0}
          />

          <AssetCard
            title="Stocks"
            subtitle={`${assets.stocks.length} holdings`}
            value={`$${stockValue.toLocaleString()}`}
            change={450}
            changePercent={2.1}
          />

          <AssetCard
            title="Crypto"
            subtitle={`${assets.crypto.length} holdings`}
            value={`$${cryptoValue.toLocaleString()}`}
            change={12500}
            changePercent={1.8}
          />
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
  greeting: {
    fontSize: 16,
    color: '#888',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 8,
  },
  totalValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#F5F5F5',
    marginBottom: 8,
  },
  change: {
    fontSize: 16,
    color: '#00C853',
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
});