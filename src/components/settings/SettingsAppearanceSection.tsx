import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { THEME } from '../../constants/theme';
import { UserConfig } from '../../constants/config';
import { OptionRow } from './OptionRow';

type ThemeType = typeof THEME;

interface SettingsAppearanceSectionProps {
  config: UserConfig;
  onUpdate: (c: UserConfig) => void;
  theme: ThemeType;
}

const Toggle = ({ value, theme }: { value: boolean; theme: ThemeType }) => (
  <View style={[styles.toggle, { backgroundColor: value ? theme.primary : theme.border }]}>
    <View
      style={[
        styles.toggleKnob,
        value ? { backgroundColor: theme.primaryForeground } : {},
        value && styles.toggleKnobActive,
      ]}
    />
  </View>
);

export const SettingsAppearanceSection = ({ config, onUpdate, theme }: SettingsAppearanceSectionProps) => (
  <View style={[styles.section, { borderBottomColor: theme.border }]}>
    <Text style={[styles.sectionTitle, { color: theme.text }]}>Appearance & Visibility</Text>

    <OptionRow
      onPress={() => onUpdate({ ...config, darkTheme: !config.darkTheme })}
      label="Dark Theme (experimental)"
      textColor={theme.text}
    >
      <Toggle value={config.darkTheme} theme={theme} />
    </OptionRow>

    <OptionRow
      onPress={() => onUpdate({ ...config, showDeceasedPeople: !config.showDeceasedPeople })}
      label="Show Deceased People"
      textColor={theme.text}
    >
      <Toggle value={config.showDeceasedPeople} theme={theme} />
    </OptionRow>

    <OptionRow
      onPress={() => onUpdate({ ...config, hideContactsWithoutPhone: !config.hideContactsWithoutPhone })}
      label="Hide Contacts Without Phone"
      textColor={theme.text}
    >
      <Toggle value={config.hideContactsWithoutPhone} theme={theme} />
    </OptionRow>
  </View>
);

const styles = StyleSheet.create({
  section: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME.text,
    marginBottom: 16,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: THEME.border,
    padding: 2,
    justifyContent: 'center',
  },
  toggleKnob: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      },
    }),
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },
});
