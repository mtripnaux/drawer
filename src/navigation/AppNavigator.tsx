import React, { useMemo } from 'react';
import { View, ActivityIndicator, SafeAreaView, Platform, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { useNavigation } from './NavigationContext';
import { useConfig } from '../contexts/ConfigContext';
import { useContacts } from '../contexts/ContactsContext';
import { LIGHT_THEME, DARK_THEME } from '../constants/theme';

import { ContactListScreen } from '../screens/ContactListScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

export const AppNavigator = () => {
  const { currentRoute } = useNavigation();
  const { config } = useConfig();
  const { loading } = useContacts();

  const theme = useMemo(() => (config.darkTheme ? DARK_THEME : LIGHT_THEME), [config.darkTheme]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {currentRoute.name === 'ContactList' && <ContactListScreen />}
      {currentRoute.name === 'Profile' && (
        <ProfileScreen contact={currentRoute.params.contact} />
      )}
      {currentRoute.name === 'Settings' && <SettingsScreen />}
      <StatusBar style={config.darkTheme ? 'light' : 'dark'} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'web' ? 0 : 30,
    paddingBottom: Platform.OS === 'android' ? 50 : 0,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
