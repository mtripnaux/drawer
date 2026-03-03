import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ConfigProvider } from './src/contexts/ConfigContext';
import { ContactsProvider } from './src/contexts/ContactsContext';
import { NavigationProvider } from './src/navigation/NavigationContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <ConfigProvider>
        <ContactsProvider>
          <NavigationProvider>
            <AppNavigator />
          </NavigationProvider>
        </ContactsProvider>
      </ConfigProvider>
    </SafeAreaProvider>
  );
}

