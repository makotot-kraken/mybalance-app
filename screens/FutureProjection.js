import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import ChartView from '../components/ChartView';
import { futureProjectionData, calculateTotalValue } from '../data/assets';

export default function FutureProjection() {
  const [selectedPeriod, setSelectedPeriod] = useState('5Y');
  const currentValue = calculateTotalValue();
  const projectedValue = futureProjectionData[futureProjectionData.length - 1].y;
  const totalGrowth = projectedValue - currentValue;
  const growthPercentage = ((projectedValue - currentValue) / currentValue) * 100;

  const periods = [
    { label: '1Y', data: futureProjectionData.slice(0, 2) },
    { label: '3Y', data: futureProjectionData.slice(0, 4) },
    { label: '5Y', data: futureProjectionData },
  ];

  const selectedData = periods.find(p => p.label === selectedPeriod)?.data || futureProjectionData;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Future Projection</Text>
          <Text style={styles.subtitle}>Projected Net Worth Growth</Text>
          <Text style={styles.currentValue}>
            Current: ${currentValue.toLocaleString()}
          </Text>
          <Text style={styles.projectedValue}>
            Projected (2030): ${projectedValue.toLocaleString()}
          </Text>
        </View>

        <View style={styles.periodSelector}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period.label}
              style={[
                styles.periodButton,
                selectedPeriod === period.label && styles.selectedPeriodButton
              ]}
              onPress={() => setSelectedPeriod(period.label)}
            >
              <Text style={[
                styles.periodText,
                selectedPeriod === period.label && styles.selectedPeriodText
              ]}>
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ChartView 
          data={selectedData}
          type="area"
          color="#00C853"
          height={300}
        />

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Projected Growth</Text>
            <Text style={styles.statValue}>
              ${totalGrowth.toLocaleString()}
            </Text>
            <Text style={styles.statSubtitle}>
              {growthPercentage.toFixed(1)}% increase
            </Text>
          </View>
        </View>

        <View style={styles.assumptionsContainer}>
          <Text style={styles.assumptionsTitle}>Growth Assumptions</Text>
          
          <View style={styles.assumptionCard}>
            <Text style={styles.assumptionLabel}>Annual Stock Growth</Text>
            <Text style={styles.assumptionValue}>8.5%</Text>
          </View>

          <View style={styles.assumptionCard}>
            <Text style={styles.assumptionLabel}>Annual Crypto Growth</Text>
            <Text style={styles.assumptionValue}>12.0%</Text>
          </View>

          <View style={styles.assumptionCard}>
            <Text style={styles.assumptionLabel}>Cash Interest Rate</Text>
            <Text style={styles.assumptionValue}>3.5%</Text>
          </View>

          <View style={styles.assumptionCard}>
            <Text style={styles.assumptionLabel}>Additional Contributions</Text>
            <Text style={styles.assumptionValue}>$50,000/year</Text>
          </View>
        </View>

        <View style={styles.disclaimerContainer}>
          <Text style={styles.disclaimerTitle}>Disclaimer</Text>
          <Text style={styles.disclaimerText}>
            These projections are estimates based on historical market performance and do not guarantee future results. 
            Actual returns may vary significantly due to market volatility, economic conditions, and other factors.
          </Text>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F5F5F5',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 20,
  },
  currentValue: {
    fontSize: 18,
    color: '#F5F5F5',
    marginBottom: 8,
  },
  projectedValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00C853',
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  selectedPeriodButton: {
    backgroundColor: '#00C853',
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  selectedPeriodText: {
    color: '#0E1111',
  },
  statsContainer: {
    margin: 16,
  },
  statCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  statTitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00C853',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 14,
    color: '#00C853',
    fontWeight: '500',
  },
  assumptionsContainer: {
    margin: 16,
  },
  assumptionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F5F5F5',
    marginBottom: 12,
  },
  assumptionCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assumptionLabel: {
    fontSize: 16,
    color: '#F5F5F5',
  },
  assumptionValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00C853',
  },
  disclaimerContainer: {
    margin: 16,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
  },
  disclaimerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
  },
});