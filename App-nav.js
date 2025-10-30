import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

// Simple test screens
function TestDashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>MyBalance Dashboard</Text>
      <Text style={styles.subtitle}>Total Net Worth: $2,700,000</Text>
    </View>
  );
}

function TestStocks() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Stocks</Text>
      <Text style={styles.subtitle}>Your Holdings</Text>
    </View>
  );
}

function TestCrypto() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crypto</Text>
      <Text style={styles.subtitle}>Your Holdings</Text>
    </View>
  );
}

function TestFuture() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Future Projection</Text>
      <Text style={styles.subtitle}>Projected Growth</Text>
    </View>
  );
}

export default function App() {
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

              if (route.name === 'Dashboard') {
                iconName = focused ? 'home' : 'home-outline';
              } else if (route.name === 'Stocks') {
                iconName = focused ? 'trending-up' : 'trending-up-outline';
              } else if (route.name === 'Crypto') {
                iconName = focused ? 'logo-bitcoin' : 'logo-bitcoin';
              } else if (route.name === 'Future') {
                iconName = focused ? 'analytics' : 'analytics-outline';
              }

              return <Ionicons name={iconName} size={size} color={color} />;
            },
          })}
        >
          <Tab.Screen name="Dashboard" component={TestDashboard} />
          <Tab.Screen name="Stocks" component={TestStocks} />
          <Tab.Screen name="Crypto" component={TestCrypto} />
          <Tab.Screen name="Future" component={TestFuture} />
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E1111',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F5F5F5',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    color: '#00C853',
    textAlign: 'center',
  },
});