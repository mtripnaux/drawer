import React, { useMemo } from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNavigation } from './NavigationContext';
import { useConfig } from '../contexts/ConfigContext';
import { LIGHT_THEME, DARK_THEME } from '../constants/theme';

import { ContactListScreen } from '../screens/ContactListScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { BirthdaysScreen } from '../screens/BirthdaysScreen';
import { EditContactScreen } from '../screens/EditContactScreen';
import { BottomTabBar } from '../components/BottomTabBar';

export const AppNavigator = () => {
  const { currentRoute } = useNavigation();
  const { config } = useConfig();
  const insets = useSafeAreaInsets();

  const theme = useMemo(() => (config.darkTheme ? DARK_THEME : LIGHT_THEME), [config.darkTheme]);

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.background, paddingTop: Platform.OS === 'web' ? 0 : insets.top }]}>
      <View style={styles.content}>
        {currentRoute.name === 'ContactList' && <ContactListScreen />}
        {currentRoute.name === 'Birthdays' && <BirthdaysScreen />}
        {currentRoute.name === 'Profile' && (
          <ProfileScreen contactId={currentRoute.params.contactId} />
        )}
        {currentRoute.name === 'Settings' && <SettingsScreen />}
        {currentRoute.name === 'EditContact' && (
          <EditContactScreen contact={currentRoute.params.contact} />
        )}
      </View>
      <BottomTabBar theme={theme} />
      <StatusBar style={config.darkTheme ? 'light' : 'dark'} />
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
