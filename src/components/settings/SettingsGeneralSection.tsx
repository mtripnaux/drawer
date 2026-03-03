import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { THEME } from '../../constants/theme';
import { UserConfig } from '../../constants/config';

type ThemeType = typeof THEME;

interface SettingsGeneralSectionProps {
  config: UserConfig;
  onUpdate: (c: UserConfig) => void;
  theme: ThemeType;
}

export const SettingsGeneralSection = ({ config, onUpdate, theme }: SettingsGeneralSectionProps) => (
  <View style={[styles.section, { borderBottomColor: theme.border }]}>
    <Text style={[styles.sectionTitle, { color: theme.text }]}>General</Text>

    <Text style={[styles.subtitle, { marginTop: 0, color: theme.textMuted }]}>Center ID (Point of View)</Text>
    <TextInput
      style={[styles.input, { marginBottom: 20, borderColor: theme.border, color: theme.text, backgroundColor: theme.surface }]}
      value={config.centerId}
      onChangeText={(text) => onUpdate({ ...config, centerId: text })}
      placeholder="e.g. fb98bd92-1daa-4249-be13-96e547918761"
      placeholderTextColor={theme.textMuted}
      autoCapitalize="none"
      autoCorrect={false}
    />

    <Text style={[styles.subtitle, { marginTop: 0, color: theme.textMuted }]}>Name Display Pattern</Text>
    <TextInput
      style={[styles.input, { marginBottom: 20, borderColor: theme.border, color: theme.text, backgroundColor: theme.surface }]}
      value={config.nameDisplayPattern}
      onChangeText={(text) => onUpdate({ ...config, nameDisplayPattern: text })}
      placeholder="e.g. TITLE FIRST LAST"
      placeholderTextColor={theme.textMuted}
    />

    <Text style={[styles.subtitle, { marginTop: 0, color: theme.textMuted }]}>Date Format Pattern</Text>
    <TextInput
      style={[styles.input, { marginBottom: 20, borderColor: theme.border, color: theme.text, backgroundColor: theme.surface }]}
      value={config.dateFormat}
      onChangeText={(text) => onUpdate({ ...config, dateFormat: text })}
      placeholder="e.g. MONTH DD, YYYY"
      placeholderTextColor={theme.textMuted}
    />

    <Text style={[styles.subtitle, { marginTop: 0, color: theme.textMuted }]}>Contacts Sorted By</Text>
    <View style={[styles.row, { marginTop: 10, gap: 10 }]}>
      {(['PROXIMITY', 'ALPHABETICAL'] as const).map((option) => (
        <TouchableOpacity
          key={option}
          style={[
            styles.chip,
            config.sortBy === option
              ? { backgroundColor: theme.primary, borderColor: theme.primary }
              : { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
          onPress={() => onUpdate({ ...config, sortBy: option })}
        >
          <Text
            style={[
              styles.chipText,
              config.sortBy === option ? { color: theme.primaryForeground } : { color: theme.text },
            ]}
          >
            {option === 'PROXIMITY' ? 'Proximity' : 'Alphabetical'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
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
  subtitle: {
    fontSize: 14,
    color: THEME.textMuted,
    marginTop: 4,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: THEME.text,
    backgroundColor: THEME.surface,
    marginTop: 8,
    ...Platform.select({
      web: { outlineStyle: 'none' },
      default: {},
    }) as any,
  },
  row: {
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  chipText: {
    color: THEME.text,
    fontSize: 14,
    fontWeight: '500',
  },
});
