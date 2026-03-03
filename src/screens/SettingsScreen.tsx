import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useConfig } from '../contexts/ConfigContext';
import { useNavigation } from '../navigation/NavigationContext';
import { LIGHT_THEME, DARK_THEME, THEME } from '../constants/theme';
import { SettingsGeneralSection } from '../components/settings/SettingsGeneralSection';
import { SettingsAppearanceSection } from '../components/settings/SettingsAppearanceSection';
import { SettingsProfileSection } from '../components/settings/SettingsProfileSection';

export const SettingsScreen = () => {
  const { config, setConfig } = useConfig();
  const { pop } = useNavigation();

  const theme = useMemo(() => (config.darkTheme ? DARK_THEME : LIGHT_THEME), [config.darkTheme]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={pop}
          style={[styles.iconButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <ChevronLeft size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { fontSize: 20, color: theme.text }]}>Settings</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView>
        <SettingsGeneralSection config={config} onUpdate={setConfig} theme={theme} />
        <SettingsProfileSection config={config} onUpdate={setConfig} theme={theme} />
        <SettingsAppearanceSection config={config} onUpdate={setConfig} theme={theme} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: THEME.text,
    letterSpacing: -0.5,
  },
});
