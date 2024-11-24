import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AuthScreen from './screens/AuthScreen';
import HomeScreen from './screens/HomeScreen';
import UpdatePersonalDataScreen from './screens/UpdatePersonalDataScreen';
import MealAdviceScreen from './screens/MealAdviceScreen';
import ProductAdviceScreen from './screens/ProductAdviceScreen';
import { AuthProvider } from './screens/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';


const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const HomeTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        if (route.name === 'Home') {
          iconName = focused ? 'person' : 'person-outline';
        } else if (route.name === 'Product Advice') {
          iconName = focused ? 'cart' : 'cart-outline';
        } else if (route.name === 'Meal Advice') {
          iconName = focused ? 'restaurant' : 'restaurant-outline';
        } else if (route.name === 'Update Data') {
          iconName = focused ? 'settings' : 'settings-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#3333cc',
      tabBarInactiveTintColor: '#cce6ff',
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
    <Tab.Screen name="Product Advice" component={ProductAdviceScreen} options={{ tabBarLabel: 'Product Advice' }} />
    <Tab.Screen name="Meal Advice" component={MealAdviceScreen} options={{ tabBarLabel: 'Meal Advice' }} />
    <Tab.Screen name="Update Data" component={UpdatePersonalDataScreen} options={{ tabBarLabel: 'Update Data' }} />
  </Tab.Navigator>
);

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Auth" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen name="HomeTabs" component={HomeTabs} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
