import React from 'react';
import { View, TextInput, StyleSheet, Platform } from 'react-native';
import { Search } from 'lucide-react-native';
import { THEME } from '../constants/theme';

type ThemeType = typeof THEME;

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  theme: ThemeType;
}

export const SearchBar = ({ value, onChangeText, theme }: SearchBarProps) => {
  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Search size={20} color={theme.textMuted} style={styles.icon} />
      <TextInput
        style={[styles.input, { color: theme.text }]}
        placeholder="Search contacts..."
        placeholderTextColor={theme.textMuted}
        value={value}
        onChangeText={onChangeText}
        scrollEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 10,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
    ...Platform.select({
      web: { outlineStyle: 'none' },
      default: {},
    }) as any,
  },
});
