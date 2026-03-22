import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';

import AddTaskScreen from './src/screens/AddTaskScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import { COLORS } from './src/constants/theme';

const Tab = createBottomTabNavigator();

const TabIcon = ({ icon, label, focused }) => (
  <View style={styles.tabIconContainer}>
    <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>{icon}</Text>
    <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
  </View>
);

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: COLORS.white,
            borderTopWidth: 0,
            height: 85,
            paddingBottom: 20,
            paddingTop: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 10,
          },
          tabBarShowLabel: false,
        }}
      >
        <Tab.Screen
          name="AddTask"
          component={AddTaskScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="🏠" label="Honey-Do" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="📊" label="My Tasks" focused={focused} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 24,
    opacity: 0.5,
  },
  tabIconFocused: {
    opacity: 1,
    fontSize: 28,
  },
  tabLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  tabLabelFocused: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});
