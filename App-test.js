import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>MyBalance App</Text>
      <Text style={styles.subtitle}>Testing Basic React Native</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E1111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F5F5F5',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    color: '#00C853',
  },
});