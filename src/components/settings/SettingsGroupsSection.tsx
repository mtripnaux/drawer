import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { THEME } from '../../constants/theme';
import { OptionRow } from './OptionRow';

type ThemeType = typeof THEME;

interface SettingsGroupsSectionProps {
  onPress: () => void;
  theme: ThemeType;
}

export const SettingsGroupsSection = ({ onPress, theme }: SettingsGroupsSectionProps) => (
  <View style={[styles.section, { borderBottomColor: theme.border }]}>
    <Text style={[styles.sectionTitle, { color: theme.text }]}>Groups</Text>
    <OptionRow onPress={onPress} label="Manage Groups" textColor={theme.text}>
      <ChevronRight size={18} color={theme.textMuted} />
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
});
