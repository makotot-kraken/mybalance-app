import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { VictoryChart, VictoryLine, VictoryArea, VictoryTheme } from 'victory-native';

const { width } = Dimensions.get('window');

export default function ChartView({ 
  data, 
  type = 'line', // 'line', 'area'
  color = '#00C853',
  height = 200 
}) {
  const chartWidth = width - 32;

  const chartTheme = {
    ...VictoryTheme.material,
    axis: {
      style: {
        axis: { stroke: 'transparent' },
        axisLabel: { fill: '#888', fontSize: 12 },
        grid: { stroke: 'transparent' },
        ticks: { stroke: 'transparent' },
        tickLabels: { fill: '#888', fontSize: 10 },
      },
    },
  };

  return (
    <View style={[styles.container, { height }]}>
      <VictoryChart
        theme={chartTheme}
        width={chartWidth}
        height={height}
        padding={{ left: 40, top: 20, right: 20, bottom: 40 }}
      >
        {type === 'area' ? (
          <VictoryArea
            data={data}
            style={{
              data: { 
                fill: color, 
                fillOpacity: 0.2,
                stroke: color,
                strokeWidth: 2,
              },
            }}
            animate={{
              duration: 1000,
              onLoad: { duration: 500 },
            }}
          />
        ) : (
          <VictoryLine
            data={data}
            style={{
              data: { stroke: color, strokeWidth: 2 },
            }}
            animate={{
              duration: 1000,
              onLoad: { duration: 500 },
            }}
          />
        )}
      </VictoryChart>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});