import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { VictoryPie, VictoryContainer } from 'victory-native';

const { width } = Dimensions.get('window');

export default function PieChart({ data, title }) {
  const chartSize = width - 80;

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      <VictoryPie
        data={data}
        width={chartSize}
        height={chartSize}
        innerRadius={50}
        colorScale={['#00C853', '#FF9800', '#2196F3', '#9C27B0']}
        labelStyle={{
          fontSize: 12,
          fill: '#F5F5F5',
          fontWeight: 'bold',
        }}
        containerComponent={<VictoryContainer />}
        animate={{
          duration: 1000,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F5F5F5',
    marginBottom: 16,
    textAlign: 'center',
  },
});