import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import Dashboard from './screens/Dashboard';
import Stocks from './screens/Stocks';
import StockDetail from './screens/StockDetail';
import Crypto from './screens/Crypto';
import FutureProjection from './screens/FutureProjection';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function StocksStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="StocksList" 
        component={Stocks} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="StockDetail" 
        component={StockDetail}
        options={{
          headerStyle: { backgroundColor: '#0E1111' },
          headerTintColor: '#F5F5F5',
          headerBackTitleVisible: false,
        }}
      />
    </Stack.Navigator>
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
          <Tab.Screen name="Dashboard" component={Dashboard} />
          <Tab.Screen name="Stocks" component={StocksStack} />
          <Tab.Screen name="Crypto" component={Crypto} />
          <Tab.Screen name="Future" component={FutureProjection} />
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
}
